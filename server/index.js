'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {
  initDb, getDbInfo, all, get, run, transaction
} = require('./db');
const { hashPassword, verifyPassword, newToken } = require('./security');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SESSION_DAYS = 7;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const SESSION_COOKIE = 'aniiss_session';
const SECURE_COOKIE = Boolean(process.env.VERCEL) || process.env.COOKIE_SECURE === '1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const categories = ['Sedan', 'SUV', 'Sports', 'Coupe', 'Pickup', 'Hatchback', 'Van', 'Convertible', 'Wagon'];
const fuels = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const conditions = ['New', 'Certified Pre-Owned'];
const drivetrains = ['FWD', 'RWD', 'AWD', '4WD'];
const orderStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const driveStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const routes = [];

function addRoute(method, pattern, handler, opts = {}) {
  const keys = [];
  const source = '^' + pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  }) + '/?$';
  routes.push({ method, regex: new RegExp(source), keys, handler, opts });
}

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
  );
}

function sendJson(res, status, payload) {
  if (res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  securityHeaders(res);
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new HttpError(413, 'Request body is too large.');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid body');
    }
    return parsed;
  } catch {
    throw new HttpError(400, 'Invalid JSON request body.');
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function safeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username || null,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    created_at: row.created_at
  };
}

async function sessionUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const row = await get(`
    SELECT u.id, u.username, u.name, u.email, u.phone, u.role, u.created_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > NOW()
  `, [token]);
  return safeUser(row);
}

async function issueSession(userId, res) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', [token, userId, expires]);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_SECONDS}${SECURE_COOKIE ? '; Secure' : ''}`
  );
}

async function clearSession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) await run('DELETE FROM sessions WHERE token = ?', [token]);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${SECURE_COOKIE ? '; Secure' : ''}`);
}

function requireUser(ctx) {
  if (!ctx.user) throw new HttpError(401, 'Please sign in to continue.');
  return ctx.user;
}

function requireAdmin(ctx) {
  if (!ctx.user) throw new HttpError(401, 'Admin authentication required.');
  if (ctx.user.role !== 'admin') throw new HttpError(403, 'This account does not have admin access.');
  return ctx.user;
}

const loginAttempts = new Map();
const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_LIMIT = 12;

function loginKey(req) {
  if (process.env.VERCEL) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket.remoteAddress || 'unknown';
}

function checkLoginRate(req) {
  const key = loginKey(req);
  const entry = loginAttempts.get(key);
  if (!entry) return;
  if (Date.now() - entry.first > LOGIN_WINDOW) {
    loginAttempts.delete(key);
    return;
  }
  if (entry.count >= LOGIN_LIMIT) {
    throw new HttpError(429, 'Too many failed sign-in attempts. Please wait 15 minutes and try again.');
  }
}

function recordLoginFailure(req) {
  const key = loginKey(req);
  const entry = loginAttempts.get(key);
  if (!entry || Date.now() - entry.first > LOGIN_WINDOW) {
    loginAttempts.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
  if (loginAttempts.size > 2000) loginAttempts.clear();
}

async function authenticate(req, body, adminOnly = false) {
  checkLoginRate(req);
  const identifier = String(body.identifier || body.email || body.username || '').trim();
  const password = String(body.password || '');
  if (!identifier || !password) {
    recordLoginFailure(req);
    throw new HttpError(400, 'Enter your email/username and password.');
  }
  const row = await get(`
    SELECT * FROM users WHERE lower(email) = lower(?) OR lower(username) = lower(?) LIMIT 1
  `, [identifier, identifier]);
  if (!row || !verifyPassword(password, row.password_salt, row.password_hash)) {
    recordLoginFailure(req);
    throw new HttpError(401, 'The credentials you entered are incorrect.');
  }
  if (adminOnly && row.role !== 'admin') {
    recordLoginFailure(req);
    throw new HttpError(403, 'This account does not have admin access.');
  }
  loginAttempts.delete(loginKey(req));
  return row;
}

function str(value, name, min, max) {
  const text = String(value ?? '').trim();
  if (text.length < min) throw new HttpError(400, `${name} is required.`);
  if (text.length > max) throw new HttpError(400, `${name} is too long.`);
  return text;
}

function optionalStr(value, max) {
  const text = String(value ?? '').trim();
  return text.length > max ? text.slice(0, max) : text;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function numberField(value, name, min, max, fallback = null) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== null) return fallback;
    throw new HttpError(400, `${name} is required.`);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new HttpError(400, `${name} must be between ${min} and ${max}.`);
  }
  return Math.round(n);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {
      return value.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
    }
  }
  return [];
}

function todayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function generateVin() {
  const digits = String(Math.floor(100000000000 + Math.random() * 900000000000));
  return `ANIIS${digits}`;
}

async function brandRow(id) {
  return get('SELECT * FROM brands WHERE id = ?', [id]);
}

async function vehicleWithBrand(id) {
  return get(`
    SELECT v.*, b.name AS brand_name, b.country AS brand_country, b.logo_color, b.tagline AS brand_tagline
    FROM vehicles v JOIN brands b ON b.id = v.brand_id WHERE v.id = ?
  `, [id]);
}

function shapeVehicle(row, includeDetails = false) {
  if (!row) return null;
  const out = {
    id: row.id,
    brand_id: row.brand_id,
    brand_name: row.brand_name,
    brand_country: row.brand_country,
    logo_color: row.logo_color,
    brand_tagline: row.brand_tagline,
    model: row.model,
    variant: row.variant,
    year: row.year,
    category: row.category,
    price: row.price,
    msrp: row.msrp,
    condition: row.condition,
    mileage: row.mileage,
    fuel: row.fuel,
    transmission: row.transmission,
    drivetrain: row.drivetrain,
    engine: row.engine,
    horsepower: row.horsepower,
    torque: row.torque,
    seats: row.seats,
    doors: row.doors,
    exterior_color: row.exterior_color,
    color_hex: row.color_hex,
    stock: row.stock,
    vin: row.vin,
    featured: row.featured,
    badge: row.badge,
    rating: row.rating,
    reviews_count: row.reviews_count,
    created_at: row.created_at
  };
  if (includeDetails) {
    out.description = row.description;
    out.features = parseJsonArray(row.features);
    out.safety = parseJsonArray(row.safety);
  }
  return out;
}

function listSelect() {
  return `
    v.id, v.brand_id, v.model, v.variant, v.year, v.category, v.price, v.msrp, v.condition,
    v.mileage, v.fuel, v.transmission, v.drivetrain, v.engine, v.horsepower, v.torque,
    v.seats, v.doors, v.exterior_color, v.color_hex, v.stock, v.vin, v.featured, v.badge,
    v.rating, v.reviews_count, v.created_at, b.name AS brand_name, b.country AS brand_country,
    b.logo_color, b.tagline AS brand_tagline
  `;
}

async function listVehicles(searchParams) {
  const joins = 'FROM vehicles v JOIN brands b ON b.id = v.brand_id';
  const where = [];
  const params = [];
  const q = String(searchParams.get('q') || '').trim().slice(0, 80);
  if (q) {
    where.push('(v.model ILIKE ? OR b.name ILIKE ? OR v.variant ILIKE ? OR v.description ILIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  const brandId = Number(searchParams.get('brand'));
  if (Number.isInteger(brandId) && brandId > 0) {
    where.push('v.brand_id = ?');
    params.push(brandId);
  }
  for (const [param, column] of [['category', 'v.category'], ['fuel', 'v.fuel'], ['condition', 'v.condition'], ['transmission', 'v.transmission'], ['drivetrain', 'v.drivetrain']]) {
    const value = String(searchParams.get(param) || '').trim();
    if (value) {
      where.push(`${column} = ?`);
      params.push(value);
    }
  }
  const minPrice = Number(searchParams.get('minPrice'));
  if (Number.isFinite(minPrice) && minPrice > 0) {
    where.push('v.price >= ?');
    params.push(Math.floor(minPrice));
  }
  const maxPrice = Number(searchParams.get('maxPrice'));
  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    where.push('v.price <= ?');
    params.push(Math.floor(maxPrice));
  }
  const minYear = Number(searchParams.get('minYear'));
  if (Number.isFinite(minYear) && minYear > 1900) {
    where.push('v.year >= ?');
    params.push(Math.floor(minYear));
  }
  if (String(searchParams.get('stock') || '') === '1') where.push('v.stock > 0');
  if (String(searchParams.get('featured') || '') === '1') where.push('v.featured = 1');

  const sortMap = {
    featured: 'v.featured DESC, (v.stock > 0) DESC, v.rating DESC, v.id ASC',
    newest: 'v.year DESC, v.id DESC',
    price_asc: 'v.price ASC, v.id ASC',
    price_desc: 'v.price DESC, v.id DESC',
    rating: 'v.rating DESC, v.reviews_count DESC',
    mileage: 'v.mileage ASC, v.id ASC',
    horsepower: 'v.horsepower DESC, v.id ASC'
  };
  const sort = sortMap[String(searchParams.get('sort') || 'featured')] || sortMap.featured;
  const page = Math.max(1, Math.floor(Number(searchParams.get('page')) || 1));
  const limit = Math.min(48, Math.max(1, Math.floor(Number(searchParams.get('limit')) || 12)));
  const offset = (page - 1) * limit;
  const whereClause = where.length ? ` WHERE ${where.join(' AND ')}` : '';

  const totalRow = await get(`SELECT COUNT(*)::int AS count ${joins}${whereClause}`, params);
  const total = Number(totalRow.count);
  const rows = await all(`
    SELECT ${listSelect()} ${joins}${whereClause}
    ORDER BY ${sort} LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  return {
    vehicles: rows.map((row) => shapeVehicle(row)),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    limit
  };
}

async function getSettings() {
  const rows = await all('SELECT key, value FROM settings');
  const out = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

/* ------------------------------ PUBLIC API ------------------------------ */

addRoute('GET', '/api/health', () => ({ ok: true, service: 'AniissAuto', time: new Date().toISOString() }));

addRoute('GET', '/api/settings', async () => ({ settings: await getSettings() }));

addRoute('GET', '/api/brands', async () => {
  const rows = await all(`
    SELECT b.id, b.name, b.country, b.logo_color, b.tagline,
      COUNT(v.id)::int AS vehicles,
      COALESCE(SUM(CASE WHEN v.stock > 0 THEN 1 ELSE 0 END), 0)::int AS available,
      COALESCE(MIN(v.price), 0) AS min_price
    FROM brands b LEFT JOIN vehicles v ON v.brand_id = b.id
    GROUP BY b.id
    ORDER BY vehicles DESC, b.name ASC
  `);
  return { brands: rows };
});

addRoute('GET', '/api/meta', async () => {
  const [categories, fuels, conditions, transmissions, price] = await Promise.all([
    all('SELECT category AS name, COUNT(*)::int AS count FROM vehicles GROUP BY category ORDER BY count DESC'),
    all('SELECT fuel AS name, COUNT(*)::int AS count FROM vehicles GROUP BY fuel ORDER BY count DESC'),
    all("SELECT condition AS name, COUNT(*)::int AS count FROM vehicles GROUP BY condition"),
    all('SELECT transmission AS name, COUNT(*)::int AS count FROM vehicles GROUP BY transmission ORDER BY count DESC'),
    get('SELECT MIN(price) AS min, MAX(price) AS max, MIN(year) AS "minYear", MAX(year) AS "maxYear" FROM vehicles')
  ]);
  return { meta: { categories, fuels, conditions, transmissions, price } };
});

addRoute('GET', '/api/stats', async () => {
  const stats = await get(`
    SELECT
      (SELECT COUNT(*) FROM vehicles)::int AS vehicles,
      (SELECT COUNT(*) FROM vehicles WHERE stock > 0)::int AS "inStock",
      (SELECT COUNT(*) FROM brands)::int AS brands,
      (SELECT COUNT(DISTINCT model) FROM vehicles)::int AS models,
      (SELECT COUNT(*) FROM reviews)::int AS reviews,
      (SELECT ROUND(AVG(rating), 2)::double precision FROM reviews) AS "avgRating",
      (SELECT MIN(price) FROM vehicles) AS "minPrice",
      (SELECT MAX(price) FROM vehicles) AS "maxPrice"
  `);
  return { stats };
});

addRoute('GET', '/api/vehicles/options', async () => {
  const rows = await all(`
    SELECT v.id, v.year, v.model, v.variant, v.fuel, v.price, b.name AS brand_name
    FROM vehicles v JOIN brands b ON b.id = v.brand_id
    WHERE v.stock > 0
    ORDER BY b.name ASC, v.model ASC, v.variant ASC
  `);
  return { vehicles: rows };
});

addRoute('GET', '/api/vehicles', (_ctx, _params, url) => listVehicles(url.searchParams));

addRoute('GET', '/api/vehicles/:id/related', async (_ctx, params) => {
  const vehicle = await get('SELECT id, brand_id, category, price FROM vehicles WHERE id = ?', [Number(params.id)]);
  if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
  const rows = await all(`
    SELECT ${listSelect()}
    FROM vehicles v JOIN brands b ON b.id = v.brand_id
    WHERE v.id != ? AND v.stock > 0 AND (v.category = ? OR v.brand_id = ?)
    ORDER BY (v.brand_id = ?) DESC, ABS(v.price - ?) ASC
    LIMIT 4
  `, [vehicle.id, vehicle.category, vehicle.brand_id, vehicle.brand_id, vehicle.price]);
  return { vehicles: rows.map((row) => shapeVehicle(row)) };
});

addRoute('GET', '/api/vehicles/:id', async (_ctx, params) => {
  const row = await vehicleWithBrand(Number(params.id));
  if (!row) throw new HttpError(404, 'That vehicle is no longer in the showroom.');
  const reviews = await all(`
    SELECT id, author_name, rating, comment, created_at
    FROM reviews WHERE vehicle_id = ? ORDER BY created_at DESC LIMIT 8
  `, [row.id]);
  return { vehicle: shapeVehicle(row, true), reviews };
});

addRoute('POST', '/api/vehicles/:id/reviews', async (ctx, params) => {
  const user = requireUser(ctx);
  const vehicle = await get('SELECT id FROM vehicles WHERE id = ?', [Number(params.id)]);
  if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
  const body = await readJson(ctx.req);
  const rating = numberField(body.rating, 'Rating', 1, 5);
  const comment = str(body.comment, 'Review', 5, 800);
  const created = await transaction(async (tx) => {
    const result = await tx.run(
      'INSERT INTO reviews (vehicle_id, user_id, author_name, rating, comment) VALUES (?, ?, ?, ?, ?) RETURNING id, created_at',
      [vehicle.id, user.id, user.name, rating, comment]
    );
    const aggregate = await tx.get(
      'SELECT ROUND(AVG(rating), 1)::double precision AS rating, COUNT(*)::int AS count FROM reviews WHERE vehicle_id = ?',
      [vehicle.id]
    );
    await tx.run('UPDATE vehicles SET rating = ?, reviews_count = ? WHERE id = ?', [aggregate.rating, aggregate.count, vehicle.id]);
    return { result, aggregate };
  });
  return {
    review: {
      id: Number(created.result.lastInsertId),
      author_name: user.name,
      rating,
      comment,
      created_at: created.result.rows[0]?.created_at
    },
    rating: created.aggregate.rating,
    reviews_count: created.aggregate.count
  };
});

addRoute('GET', '/api/reviews/latest', async (_ctx, _params, url) => {
  const limit = Math.min(12, Math.max(1, Number(url.searchParams.get('limit')) || 6));
  const rows = await all(`
    SELECT r.id, r.author_name, r.rating, r.comment, r.created_at,
      v.id AS vehicle_id, v.model, v.variant, v.year, b.name AS brand_name
    FROM reviews r
    JOIN vehicles v ON v.id = r.vehicle_id
    JOIN brands b ON b.id = v.brand_id
    WHERE r.rating >= 4
    ORDER BY r.created_at DESC LIMIT ?
  `, [limit]);
  return { reviews: rows };
});

addRoute('POST', '/api/newsletter', async (ctx) => {
  const body = await readJson(ctx.req);
  const email = str(body.email, 'Email', 5, 160).toLowerCase();
  if (!validEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  await run('INSERT INTO newsletter (email) VALUES (?) ON CONFLICT (email) DO NOTHING', [email]);
  return { ok: true, message: 'You are on the list. Watch your inbox for first access.' };
});

addRoute('POST', '/api/contact', async (ctx) => {
  const body = await readJson(ctx.req);
  const name = str(body.name, 'Name', 2, 80);
  const email = str(body.email, 'Email', 5, 160).toLowerCase();
  if (!validEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  const phone = optionalStr(body.phone, 40);
  const subject = str(body.subject || 'General enquiry', 'Subject', 2, 120);
  const message = str(body.message, 'Message', 5, 2000);
  const result = await run(`
    INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?) RETURNING id
  `, [name, email, phone, subject, message]);
  return { ok: true, id: Number(result.lastInsertId), message: 'Your message has been received. Our team will reply shortly.' };
});

addRoute('POST', '/api/test-drives', async (ctx) => {
  const body = await readJson(ctx.req);
  const vehicleId = numberField(body.vehicleId, 'Vehicle', 1, Number.MAX_SAFE_INTEGER);
  const vehicle = await vehicleWithBrand(vehicleId);
  if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
  const name = str(body.name, 'Name', 2, 80);
  const email = str(body.email, 'Email', 5, 160).toLowerCase();
  if (!validEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  const phone = str(body.phone, 'Phone', 5, 40);
  const preferredDate = str(body.preferredDate || body.preferred_date, 'Preferred date', 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || preferredDate < todayString()) {
    throw new HttpError(400, 'Choose a preferred date from today onwards.');
  }
  const preferredTime = optionalStr(body.preferredTime || body.preferred_time || '10:00', 20);
  const notes = optionalStr(body.notes, 500);
  const result = await run(`
    INSERT INTO test_drives (user_id, vehicle_id, vehicle_snapshot, name, email, phone, preferred_date, preferred_time, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
  `, [
    ctx.user ? ctx.user.id : null, vehicle.id, `${vehicle.brand_name} ${vehicle.model} ${vehicle.variant}`,
    name, email, phone, preferredDate, preferredTime, notes
  ]);
  return {
    ok: true,
    id: Number(result.lastInsertId),
    message: 'Your test drive request is confirmed as received. We will contact you to finalise the slot.'
  };
});

addRoute('POST', '/api/register', async (ctx) => {
  const body = await readJson(ctx.req);
  const name = str(body.name, 'Name', 2, 80);
  const email = str(body.email, 'Email', 5, 160).toLowerCase();
  if (!validEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  const phone = optionalStr(body.phone, 40);
  const password = String(body.password || '');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (password.length > 200) throw new HttpError(400, 'Password is too long.');
  const exists = await get('SELECT id FROM users WHERE lower(email) = lower(?)', [email]);
  if (exists) throw new HttpError(409, 'An account already exists with that email.');
  const { salt, hash } = hashPassword(password);
  const result = await run(`
    INSERT INTO users (name, email, password_hash, password_salt, phone, role)
    VALUES (?, ?, ?, ?, ?, 'customer') RETURNING id
  `, [name, email, hash, salt, phone]);
  const user = safeUser(await get('SELECT id, username, name, email, phone, role, created_at FROM users WHERE id = ?', [Number(result.lastInsertId)]));
  await issueSession(user.id, ctx.res);
  return { user, favorites: [], message: 'Welcome to AniissAuto.' };
});

addRoute('POST', '/api/login', async (ctx) => {
  const body = await readJson(ctx.req);
  const row = await authenticate(ctx.req, body, false);
  await issueSession(row.id, ctx.res);
  const favorites = (await all('SELECT vehicle_id FROM favorites WHERE user_id = ?', [row.id])).map((r) => r.vehicle_id);
  return { user: safeUser(row), favorites };
});

addRoute('POST', '/api/logout', async (ctx) => {
  await clearSession(ctx.req, ctx.res);
  return { ok: true };
});

addRoute('GET', '/api/me', async (ctx) => {
  if (!ctx.user) return { user: null, favorites: [] };
  const favorites = (await all('SELECT vehicle_id FROM favorites WHERE user_id = ?', [ctx.user.id])).map((r) => r.vehicle_id);
  return { user: ctx.user, favorites };
});

addRoute('GET', '/api/favorites', async (ctx) => {
  const user = requireUser(ctx);
  const rows = await all(`
    SELECT ${listSelect()}
    FROM favorites f
    JOIN vehicles v ON v.id = f.vehicle_id
    JOIN brands b ON b.id = v.brand_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `, [user.id]);
  return { vehicles: rows.map((row) => shapeVehicle(row)) };
});

addRoute('POST', '/api/favorites', async (ctx) => {
  const user = requireUser(ctx);
  const body = await readJson(ctx.req);
  const vehicleId = numberField(body.vehicleId, 'Vehicle', 1, Number.MAX_SAFE_INTEGER);
  const exists = await get('SELECT id FROM vehicles WHERE id = ?', [vehicleId]);
  if (!exists) throw new HttpError(404, 'Vehicle not found.');
  await run('INSERT INTO favorites (user_id, vehicle_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [user.id, vehicleId]);
  return { ok: true, saved: true };
});

addRoute('DELETE', '/api/favorites/:vehicleId', async (ctx, params) => {
  const user = requireUser(ctx);
  await run('DELETE FROM favorites WHERE user_id = ? AND vehicle_id = ?', [user.id, Number(params.vehicleId)]);
  return { ok: true, saved: false };
});

addRoute('GET', '/api/account/orders', async (ctx) => {
  const user = requireUser(ctx);
  const rows = await all(`
    SELECT o.*, b.name AS brand_name, b.logo_color, v.model, v.variant, v.year, v.color_hex, v.category
    FROM orders o
    LEFT JOIN vehicles v ON v.id = o.vehicle_id
    LEFT JOIN brands b ON b.id = v.brand_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `, [user.id]);
  return { orders: rows };
});

addRoute('GET', '/api/account/test-drives', async (ctx) => {
  const user = requireUser(ctx);
  const rows = await all(`
    SELECT t.*, b.name AS brand_name, b.logo_color, v.model, v.variant, v.year, v.color_hex, v.category
    FROM test_drives t
    LEFT JOIN vehicles v ON v.id = t.vehicle_id
    LEFT JOIN brands b ON b.id = v.brand_id
    WHERE t.user_id = ?
    ORDER BY t.preferred_date DESC
  `, [user.id]);
  return { testDrives: rows };
});

addRoute('POST', '/api/orders', async (ctx) => {
  const user = requireUser(ctx);
  const body = await readJson(ctx.req);
  const vehicleId = numberField(body.vehicleId, 'Vehicle', 1, Number.MAX_SAFE_INTEGER);
  const notes = optionalStr(body.notes, 600);
  const vehicle = await vehicleWithBrand(vehicleId);
  if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
  if (vehicle.stock <= 0) throw new HttpError(409, 'This vehicle has just been reserved. Please contact our team for alternatives.');
  const existing = await get(`
    SELECT id FROM orders WHERE user_id = ? AND vehicle_id = ? AND status IN ('pending', 'confirmed') LIMIT 1
  `, [user.id, vehicleId]);
  if (existing) throw new HttpError(409, 'You already have an active reservation for this vehicle.');
  const deposit = Math.max(500, Math.round((vehicle.price * 0.01) / 50) * 50);
  const snapshot = `${vehicle.brand_name} ${vehicle.model} ${vehicle.variant}`;
  const orderId = await transaction(async (tx) => {
    const result = await tx.run(`
      INSERT INTO orders (user_id, vehicle_id, vehicle_snapshot, type, status, deposit, total, notes)
      VALUES (?, ?, ?, 'reservation', 'pending', ?, ?, ?) RETURNING id
    `, [user.id, vehicle.id, snapshot, deposit, vehicle.price, notes]);
    const stockUpdate = await tx.run('UPDATE vehicles SET stock = stock - 1 WHERE id = ? AND stock > 0', [vehicle.id]);
    if (!stockUpdate.rowCount) throw new HttpError(409, 'This vehicle has just been reserved. Please contact our team for alternatives.');
    return Number(result.lastInsertId);
  });
  const order = await get('SELECT * FROM orders WHERE id = ?', [orderId]);
  return {
    order,
    message: 'Reservation received. Your dedicated specialist will contact you within one business hour.'
  };
});

/* ------------------------------- ADMIN API ------------------------------ */

addRoute('POST', '/api/admin/login', async (ctx) => {
  const body = await readJson(ctx.req);
  const row = await authenticate(ctx.req, body, true);
  await issueSession(row.id, ctx.res);
  return { user: safeUser(row) };
});

addRoute('GET', '/api/admin/overview', async (ctx) => {
  requireAdmin(ctx);
  const stats = await get(`
    SELECT
      (SELECT COUNT(*) FROM vehicles)::int AS vehicles,
      (SELECT COUNT(*) FROM vehicles WHERE stock > 0)::int AS "inStock",
      (SELECT COALESCE(SUM(price * stock), 0) FROM vehicles)::int AS "inventoryValue",
      (SELECT COUNT(*) FROM brands)::int AS brands,
      (SELECT COUNT(*) FROM users WHERE role = 'customer')::int AS customers,
      (SELECT COUNT(*) FROM orders)::int AS orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending')::int AS "pendingOrders",
      (SELECT COUNT(*) FROM test_drives WHERE status = 'pending')::int AS "pendingDrives",
      (SELECT COUNT(*) FROM messages WHERE status = 'new')::int AS "newMessages",
      (SELECT COUNT(*) FROM newsletter)::int AS subscribers,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status IN ('confirmed', 'completed'))::int AS "pipelineValue"
  `);
  const statusBreakdown = await all(`
    SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total), 0)::int AS value FROM orders GROUP BY status
  `);
  const monthly = (await all(`
    SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count, COALESCE(SUM(total), 0)::int AS value
    FROM orders GROUP BY month ORDER BY month DESC LIMIT 6
  `)).reverse();
  const topBrands = await all(`
    SELECT b.name, b.logo_color, COUNT(v.id)::int AS vehicles, COALESCE(SUM(v.stock), 0)::int AS stock,
      COALESCE(SUM(v.price * v.stock), 0)::int AS value
    FROM brands b LEFT JOIN vehicles v ON v.brand_id = b.id
    GROUP BY b.id ORDER BY stock DESC LIMIT 8
  `);
  const recentOrders = await all(`
    SELECT o.id, o.status, o.deposit, o.total, o.created_at, o.vehicle_snapshot,
      u.name AS customer_name, u.email AS customer_email, b.logo_color
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN vehicles v ON v.id = o.vehicle_id
    LEFT JOIN brands b ON b.id = v.brand_id
    ORDER BY o.created_at DESC LIMIT 6
  `);
  const upcomingDrives = await all(`
    SELECT t.id, t.name, t.email, t.phone, t.preferred_date, t.preferred_time, t.status, t.vehicle_snapshot
    FROM test_drives t
    WHERE t.preferred_date >= CURRENT_DATE::text AND t.status IN ('pending', 'confirmed')
    ORDER BY t.preferred_date ASC, t.preferred_time ASC LIMIT 5
  `);
  const recentMessages = await all(`
    SELECT id, name, email, subject, status, created_at FROM messages ORDER BY created_at DESC LIMIT 4
  `);
  return { stats, statusBreakdown, monthly, topBrands, recentOrders, upcomingDrives, recentMessages };
});

addRoute('GET', '/api/admin/vehicles', async (ctx) => {
  requireAdmin(ctx);
  const rows = await all(`
    SELECT v.*, b.name AS brand_name, b.logo_color
    FROM vehicles v JOIN brands b ON b.id = v.brand_id
    ORDER BY b.name ASC, v.model ASC, v.variant ASC
  `);
  return {
    vehicles: rows.map((row) => ({ ...shapeVehicle(row, true), description: row.description }))
  };
});

async function vehicleInput(body, existing = null) {
  const brandId = numberField(body.brand_id ?? body.brandId ?? existing?.brand_id, 'Brand', 1, Number.MAX_SAFE_INTEGER);
  if (!(await brandRow(brandId))) throw new HttpError(400, 'Choose a valid brand.');
  const model = str(body.model ?? existing?.model, 'Model', 1, 80);
  const variant = optionalStr(body.variant ?? existing?.variant ?? '', 80);
  const year = numberField(body.year ?? existing?.year, 'Year', 1990, 2027);
  const category = str(body.category ?? existing?.category, 'Category', 2, 30);
  if (!categories.includes(category)) throw new HttpError(400, 'Invalid category.');
  const price = numberField(body.price ?? existing?.price, 'Price', 1000, 20000000);
  let msrp = body.msrp ?? existing?.msrp;
  if (msrp === '' || msrp === null || msrp === undefined) msrp = null;
  else msrp = numberField(msrp, 'MSRP', 1000, 25000000);
  const condition = String(body.condition ?? existing?.condition ?? 'New');
  if (!conditions.includes(condition)) throw new HttpError(400, 'Invalid condition.');
  const mileage = numberField(body.mileage ?? existing?.mileage ?? 0, 'Mileage', 0, 500000, 0);
  const fuel = String(body.fuel ?? existing?.fuel ?? 'Petrol');
  if (!fuels.includes(fuel)) throw new HttpError(400, 'Invalid fuel type.');
  const transmission = str(body.transmission ?? existing?.transmission, 'Transmission', 2, 60);
  const drivetrain = String(body.drivetrain ?? existing?.drivetrain ?? 'FWD');
  if (!drivetrains.includes(drivetrain)) throw new HttpError(400, 'Invalid drivetrain.');
  const engine = str(body.engine ?? existing?.engine, 'Engine', 2, 100);
  const horsepower = numberField(body.horsepower ?? existing?.horsepower ?? 200, 'Horsepower', 10, 3000, 200);
  const torque = numberField(body.torque ?? existing?.torque ?? 200, 'Torque', 10, 5000, 200);
  const seats = numberField(body.seats ?? existing?.seats ?? 5, 'Seats', 1, 12, 5);
  const doors = numberField(body.doors ?? existing?.doors ?? 4, 'Doors', 2, 6, 4);
  const exteriorColor = str(body.exterior_color ?? existing?.exterior_color, 'Exterior colour', 2, 80);
  const colorHexRaw = String(body.color_hex ?? existing?.color_hex ?? '#7C8288');
  const colorHex = /^#[0-9a-fA-F]{6}$/.test(colorHexRaw) ? colorHexRaw : '#7C8288';
  const stock = numberField(body.stock ?? existing?.stock ?? 1, 'Stock', 0, 999, 1);
  let vin = optionalStr(body.vin ?? existing?.vin ?? '', 20).toUpperCase();
  if (!vin) vin = generateVin();
  if (!/^[A-Z0-9]{5,20}$/.test(vin)) throw new HttpError(400, 'VIN should be 5–20 letters and numbers.');
  const featured = Number(body.featured ?? existing?.featured ?? 0) ? 1 : 0;
  const badge = optionalStr(body.badge ?? existing?.badge ?? '', 40) || null;
  const description = str(body.description ?? existing?.description, 'Description', 10, 2000);
  const features = parseJsonArray(body.features ?? existing?.features ?? []).slice(0, 20);
  const safety = parseJsonArray(body.safety ?? existing?.safety ?? []).slice(0, 20);
  return {
    brand_id: brandId, model, variant, year, category, price, msrp, condition, mileage, fuel,
    transmission, drivetrain, engine, horsepower, torque, seats, doors, exterior_color: exteriorColor,
    color_hex: colorHex, stock, vin, featured, badge, description,
    features: JSON.stringify(features), safety: JSON.stringify(safety)
  };
}

addRoute('POST', '/api/admin/vehicles', async (ctx) => {
  requireAdmin(ctx);
  const body = await readJson(ctx.req);
  const input = await vehicleInput(body);
  try {
    const result = await run(`
      INSERT INTO vehicles (
        brand_id, model, variant, year, category, price, msrp, condition, mileage, fuel,
        transmission, drivetrain, engine, horsepower, torque, seats, doors, exterior_color,
        color_hex, stock, vin, featured, badge, description, features, safety
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
    `, [
      input.brand_id, input.model, input.variant, input.year, input.category, input.price, input.msrp,
      input.condition, input.mileage, input.fuel, input.transmission, input.drivetrain, input.engine,
      input.horsepower, input.torque, input.seats, input.doors, input.exterior_color, input.color_hex,
      input.stock, input.vin, input.featured, input.badge, input.description, input.features, input.safety
    ]);
    const created = await vehicleWithBrand(Number(result.lastInsertId));
    return { vehicle: shapeVehicle(created, true), message: 'Vehicle added to the showroom.' };
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || error.code === '23505') throw new HttpError(409, 'A vehicle with that VIN already exists.');
    throw error;
  }
});

addRoute('PUT', '/api/admin/vehicles/:id', async (ctx, params) => {
  requireAdmin(ctx);
  const id = Number(params.id);
  const existing = await vehicleWithBrand(id);
  if (!existing) throw new HttpError(404, 'Vehicle not found.');
  const body = await readJson(ctx.req);
  const input = await vehicleInput(body, existing);
  try {
    await run(`
      UPDATE vehicles SET
        brand_id = ?, model = ?, variant = ?, year = ?, category = ?, price = ?, msrp = ?,
        condition = ?, mileage = ?, fuel = ?, transmission = ?, drivetrain = ?, engine = ?,
        horsepower = ?, torque = ?, seats = ?, doors = ?, exterior_color = ?, color_hex = ?,
        stock = ?, vin = ?, featured = ?, badge = ?, description = ?, features = ?, safety = ?
      WHERE id = ?
    `, [
      input.brand_id, input.model, input.variant, input.year, input.category, input.price, input.msrp,
      input.condition, input.mileage, input.fuel, input.transmission, input.drivetrain, input.engine,
      input.horsepower, input.torque, input.seats, input.doors, input.exterior_color, input.color_hex,
      input.stock, input.vin, input.featured, input.badge, input.description, input.features, input.safety, id
    ]);
    const updated = await vehicleWithBrand(id);
    return { vehicle: shapeVehicle(updated, true), message: 'Vehicle updated.' };
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || error.code === '23505') throw new HttpError(409, 'A vehicle with that VIN already exists.');
    throw error;
  }
});

addRoute('DELETE', '/api/admin/vehicles/:id', async (ctx, params) => {
  requireAdmin(ctx);
  const id = Number(params.id);
  const existing = await get('SELECT id FROM vehicles WHERE id = ?', [id]);
  if (!existing) throw new HttpError(404, 'Vehicle not found.');
  await run('DELETE FROM vehicles WHERE id = ?', [id]);
  return { ok: true, message: 'Vehicle removed from inventory.' };
});

addRoute('GET', '/api/admin/brands', async (ctx) => {
  requireAdmin(ctx);
  const brands = await all(`
    SELECT b.*, COUNT(v.id)::int AS vehicles, COALESCE(SUM(v.stock), 0)::int AS stock,
      COALESCE(SUM(v.price * v.stock), 0)::int AS inventory_value
    FROM brands b LEFT JOIN vehicles v ON v.brand_id = b.id
    GROUP BY b.id ORDER BY vehicles DESC, b.name ASC
  `);
  return { brands };
});

addRoute('POST', '/api/admin/brands', async (ctx) => {
  requireAdmin(ctx);
  const body = await readJson(ctx.req);
  const name = str(body.name, 'Brand name', 1, 60);
  const country = str(body.country, 'Country', 2, 60);
  const rawColor = String(body.logo_color || '#C8CDD0');
  const logoColor = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : '#C8CDD0';
  const tagline = optionalStr(body.tagline, 120);
  try {
    const result = await run('INSERT INTO brands (name, country, logo_color, tagline) VALUES (?, ?, ?, ?) RETURNING id', [name, country, logoColor, tagline]);
    return { brand: await get('SELECT * FROM brands WHERE id = ?', [Number(result.lastInsertId)]), message: 'Brand added.' };
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || error.code === '23505') throw new HttpError(409, 'A brand with that name already exists.');
    throw error;
  }
});

addRoute('PUT', '/api/admin/brands/:id', async (ctx, params) => {
  requireAdmin(ctx);
  const id = Number(params.id);
  const existing = await brandRow(id);
  if (!existing) throw new HttpError(404, 'Brand not found.');
  const body = await readJson(ctx.req);
  const name = str(body.name ?? existing.name, 'Brand name', 1, 60);
  const country = str(body.country ?? existing.country, 'Country', 2, 60);
  const rawColor = String(body.logo_color ?? existing.logo_color);
  const logoColor = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : existing.logo_color;
  const tagline = optionalStr(body.tagline ?? existing.tagline, 120);
  try {
    await run('UPDATE brands SET name = ?, country = ?, logo_color = ?, tagline = ? WHERE id = ?', [name, country, logoColor, tagline, id]);
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || error.code === '23505') throw new HttpError(409, 'A brand with that name already exists.');
    throw error;
  }
  return { brand: await brandRow(id), message: 'Brand updated.' };
});

addRoute('DELETE', '/api/admin/brands/:id', async (ctx, params) => {
  requireAdmin(ctx);
  const id = Number(params.id);
  const existing = await brandRow(id);
  if (!existing) throw new HttpError(404, 'Brand not found.');
  const countRow = await get('SELECT COUNT(*)::int AS count FROM vehicles WHERE brand_id = ?', [id]);
  const count = Number(countRow.count);
  if (count > 0) throw new HttpError(409, `Move or remove the ${count} vehicle(s) under this brand first.`);
  await run('DELETE FROM brands WHERE id = ?', [id]);
  return { ok: true, message: 'Brand removed.' };
});

addRoute('GET', '/api/admin/orders', async (ctx) => {
  requireAdmin(ctx);
  const orders = await all(`
    SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
      b.name AS brand_name, b.logo_color, v.model, v.variant, v.year, v.color_hex
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN vehicles v ON v.id = o.vehicle_id
    LEFT JOIN brands b ON b.id = v.brand_id
    ORDER BY o.created_at DESC
  `);
  return { orders };
});

addRoute('PATCH', '/api/admin/orders/:id', async (ctx, params) => {
  requireAdmin(ctx);
  const id = Number(params.id);
  const body = await readJson(ctx.req);
  const status = String(body.status || '');
  if (!orderStatuses.includes(status)) throw new HttpError(400, 'Invalid order status.');
  const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) throw new HttpError(404, 'Reservation not found.');
  if (order.status === status) return { order, message: 'Status unchanged.' };
  await transaction(async (tx) => {
    if (order.status !== 'cancelled' && status === 'cancelled' && order.vehicle_id) {
      await tx.run('UPDATE vehicles SET stock = stock + 1 WHERE id = ?', [order.vehicle_id]);
    }
    if (order.status === 'cancelled' && status !== 'cancelled' && order.vehicle_id) {
      const vehicle = await tx.get('SELECT stock FROM vehicles WHERE id = ?', [order.vehicle_id]);
      if (!vehicle || vehicle.stock <= 0) throw new HttpError(409, 'Cannot reinstate this reservation — the vehicle is no longer available.');
      await tx.run('UPDATE vehicles SET stock = stock - 1 WHERE id = ?', [order.vehicle_id]);
    }
    await tx.run('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  });
  const updated = await get('SELECT * FROM orders WHERE id = ?', [id]);
  return { order: updated, message: 'Reservation updated.' };
});

addRoute('GET', '/api/admin/test-drives', async (ctx) => {
  requireAdmin(ctx);
  const testDrives = await all(`
    SELECT t.*, u.name AS customer_name, u.email AS customer_email,
      b.name AS brand_name, b.logo_color, v.model, v.variant, v.year, v.color_hex
    FROM test_drives t
    LEFT JOIN users u ON u.id = t.user_id
    LEFT JOIN vehicles v ON v.id = t.vehicle_id
    LEFT JOIN brands b ON b.id = v.brand_id
    ORDER BY t.preferred_date DESC, t.preferred_time DESC
  `);
  return { testDrives };
});

addRoute('PATCH', '/api/admin/test-drives/:id', async (ctx, params) => {
  requireAdmin(ctx);
  const id = Number(params.id);
  const body = await readJson(ctx.req);
  const status = String(body.status || '');
  if (!driveStatuses.includes(status)) throw new HttpError(400, 'Invalid test drive status.');
  const existing = await get('SELECT id FROM test_drives WHERE id = ?', [id]);
  if (!existing) throw new HttpError(404, 'Test drive not found.');
  await run('UPDATE test_drives SET status = ? WHERE id = ?', [status, id]);
  return { ok: true, message: 'Test drive updated.' };
});

addRoute('GET', '/api/admin/users', async (ctx) => {
  requireAdmin(ctx);
  const users = await all(`
    SELECT u.id, u.username, u.name, u.email, u.phone, u.role, u.created_at,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id)::int AS orders,
      (SELECT COUNT(*) FROM favorites f WHERE f.user_id = u.id)::int AS favorites,
      (SELECT COUNT(*) FROM test_drives t WHERE t.user_id = u.id)::int AS test_drives
    FROM users u ORDER BY u.created_at DESC
  `);
  return { users };
});

addRoute('PATCH', '/api/admin/users/:id', async (ctx, params) => {
  const admin = requireAdmin(ctx);
  const id = Number(params.id);
  const body = await readJson(ctx.req);
  const role = String(body.role || '');
  if (!['admin', 'customer'].includes(role)) throw new HttpError(400, 'Invalid role.');
  if (id === admin.id) throw new HttpError(400, 'You cannot change your own role.');
  const existing = await get('SELECT id FROM users WHERE id = ?', [id]);
  if (!existing) throw new HttpError(404, 'Customer not found.');
  await run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  return { ok: true, message: `Account access updated to ${role}.` };
});

addRoute('GET', '/api/admin/messages', async (ctx) => {
  requireAdmin(ctx);
  const messages = await all('SELECT * FROM messages ORDER BY created_at DESC');
  return { messages };
});

addRoute('PATCH', '/api/admin/messages/:id', async (ctx, params) => {
  requireAdmin(ctx);
  const id = Number(params.id);
  const body = await readJson(ctx.req);
  const status = String(body.status || '');
  if (!['new', 'read', 'resolved'].includes(status)) throw new HttpError(400, 'Invalid message status.');
  const existing = await get('SELECT id FROM messages WHERE id = ?', [id]);
  if (!existing) throw new HttpError(404, 'Message not found.');
  await run('UPDATE messages SET status = ? WHERE id = ?', [status, id]);
  return { ok: true, message: 'Message updated.' };
});

addRoute('GET', '/api/admin/newsletter', async (ctx) => {
  requireAdmin(ctx);
  return { subscribers: await all('SELECT * FROM newsletter ORDER BY created_at DESC') };
});

addRoute('GET', '/api/admin/settings', async (ctx) => {
  requireAdmin(ctx);
  return { settings: await getSettings() };
});

addRoute('PUT', '/api/admin/settings', async (ctx) => {
  requireAdmin(ctx);
  const body = await readJson(ctx.req);
  const allowed = ['showroom_name', 'tagline', 'phone', 'email', 'address', 'hours', 'announcement'];
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    const value = optionalStr(body[key], 500);
    await run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value', [key, value]);
  }
  return { settings: await getSettings(), message: 'Showroom settings saved.' };
});

/* ------------------------------- STATIC -------------------------------- */

function serveStatic(req, res, pathname) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }
  let requested = pathname;
  if (requested === '/' || requested === '/index.html') requested = '/index.html';
  else if (requested === '/admin' || requested === '/admin/') requested = '/admin.html';
  const relative = requested.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, relative);
  const traversal = path.relative(PUBLIC_DIR, filePath);
  if (traversal.startsWith('..') || path.isAbsolute(traversal)) {
    sendJson(res, 403, { error: 'Forbidden.' });
    return;
  }
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    securityHeaders(res);
    res.end('<h1>404</h1><p>This road does not exist. <a href="/">Return to AniissAuto</a>.</p>');
    return;
  }
  if (!stat.isFile()) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', ['.html', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=3600');
  securityHeaders(res);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  });
  stream.pipe(res);
}

/* -------------------------------- SERVER -------------------------------- */

async function routeRequest(req, res, allowStatic) {
  try {
    await initDb();
    let url;
    try {
      url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch {
      throw new HttpError(400, 'Invalid URL.');
    }
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/api/')) {
      const method = req.method === 'HEAD' ? 'GET' : req.method;
      let matched = null;
      let values = null;
      for (const candidate of routes) {
        if (candidate.method !== method) continue;
        const match = candidate.regex.exec(pathname);
        if (match) {
          matched = candidate;
          values = match.slice(1).map((value) => decodeURIComponent(value));
          break;
        }
      }
      if (!matched) throw new HttpError(404, 'API route not found.');
      const params = {};
      matched.keys.forEach((key, index) => { params[key] = values[index]; });
      const ctx = { req, res, url, user: await sessionUser(req) };
      if (matched.opts.auth) requireUser(ctx);
      if (matched.opts.admin) requireAdmin(ctx);
      const result = await matched.handler(ctx, params, url);
      if (result !== undefined) sendJson(res, 200, result);
      return;
    }

    if (allowStatic && (req.method === 'GET' || req.method === 'HEAD')) {
      serveStatic(req, res, pathname);
      return;
    }

    throw new HttpError(404, 'Not found.');
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, { error: error.message });
      return;
    }
    console.error('[AniissAuto] Unexpected error:', error);
    if (!res.headersSent) sendJson(res, 500, { error: 'Something went wrong on our side. Please try again.' });
    else res.end();
  }
}

async function handleApiRequest(req, res) {
  return routeRequest(req, res, false);
}

async function startServer() {
  await initDb();
  const server = http.createServer((req, res) => routeRequest(req, res, true));
  server.listen(PORT, HOST, () => {
    console.log('');
    console.log('  ANIISSAUTO — premium automotive showroom');
    console.log('  -----------------------------------------------');
    console.log(`  Storefront : http://${HOST}:${PORT}`);
    console.log(`  Admin      : http://${HOST}:${PORT}/admin`);
    console.log(`  Database   : ${getDbInfo().label}`);
    console.log('  Admin user : aniissadmin');
    console.log('  (Password configured in server/db.js or ADMIN_PASSWORD)');
    console.log('');
  });
  process.on('SIGINT', () => server.close(() => process.exit(0)));
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('[AniissAuto] Failed to start:', error);
    process.exit(1);
  });
}

module.exports = { startServer, handleApiRequest };
