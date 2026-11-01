export const state = {
  user: null,
  favorites: new Set(),
  brands: [],
  meta: null,
  stats: null,
  settings: {},
  vehicleOptions: null,
  routeToken: 0
};

let refreshHandler = null;
export function setRefreshHandler(fn) {
  refreshHandler = fn;
}
export function refreshCurrentRoute() {
  if (refreshHandler) refreshHandler();
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function safeHex(value, fallback = '#d8aa5b') {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;
}

export function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(number);
}

export function compactMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '$0';
  if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (number >= 10_000) return `$${Math.round(number / 1000)}K`;
  return money(number);
}

export function number(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(String(value).includes('T') ? String(value) : String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(date);
}

export function formatTime(value) {
  if (!value) return '';
  const [hours, minutes] = String(value).split(':');
  const hour = Number(hours);
  if (!Number.isFinite(hour)) return String(value);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(minutes || '00').padStart(2, '0')} ${suffix}`;
}

export function initials(name) {
  const words = String(name || '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'AA';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function truncate(value, length = 120) {
  const text = String(value ?? '');
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

export const ICONS = {
  arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  heart: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1.1-1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-6.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
  heartFill: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1.1-1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-6.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z" fill="currentColor"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
  starFill: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  car: '<path d="M3 16v-3l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 8l2 5v3"/><path d="M3 16h18"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M5 12h14"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .6 3 .7a2 2 0 0 1 1.6 2Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  shield: '<path d="m12 2 8 3v6c0 5-3.5 9.4-8 11-4.5-1.6-8-6-8-11V5l8-3Z"/><path d="m9 12 2 2 4-4"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z"/>',
  gauge: '<circle cx="12" cy="12" r="9"/><path d="M12 12 16 8"/><path d="M7.5 16.5a6 6 0 0 1 9 0"/>',
  road: '<path d="M4 21 7 3M20 21 17 3M12 4v3M12 10v3M12 16v3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  fuel: '<path d="M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16"/><path d="M3 21h13"/><path d="M14 9h2a2 2 0 0 1 2 2v5a2 2 0 0 0 4 0V9l-3-3"/><path d="M7 7h5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.3-2.3 2.7-2.1Z"/>',
  wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 12h4"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V4h9l8.6 8.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.9M6.6 6.6A17.8 17.8 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 4.4-.9"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 17 .8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
};

export function icon(name, className = '') {
  const body = ICONS[name] || ICONS.spark;
  return `<svg${className ? ` class="${className}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export function stars(rating, className = '') {
  const rounded = Math.round(Number(rating) || 0);
  const icons = Array.from({ length: 5 }, (_, i) => icon(i < rounded ? 'starFill' : 'star')).join('');
  return `<span class="stars ${className}">${icons}</span>`;
}

export function api(path, options = {}) {
  const opts = { credentials: 'same-origin', ...options, headers: { ...(options.headers || {}) } };
  if (opts.body && typeof opts.body !== 'string') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  return fetch(path, opts).then(async (response) => {
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const error = new Error(data?.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  });
}

export function toast(message, type = 'info') {
  const root = $('#toastRoot');
  if (!root) return;
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  const glyph = type === 'success' ? 'check' : type === 'error' ? 'close' : 'spark';
  node.innerHTML = `${icon(glyph)}<span>${esc(message)}</span>`;
  root.appendChild(node);
  window.setTimeout(() => {
    node.classList.add('leaving');
    window.setTimeout(() => node.remove(), 220);
  }, 4200);
}

export function openModal(content, { wide = false, label = 'Dialog' } = {}) {
  const root = $('#modalRoot');
  if (!root) return;
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop>
    <div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(label)}">${content}</div>
  </div>`;
  document.body.classList.add('no-scroll');
}

export function closeModal() {
  const root = $('#modalRoot');
  if (!root) return;
  root.innerHTML = '';
  document.body.classList.remove('no-scroll');
}

export function openSuccess(title, text, actions = '') {
  openModal(`
    <div class="modal-body">
      <div class="modal-success">
        <div class="modal-success-icon">${icon('check')}</div>
        <h2>${esc(title)}</h2>
        <p>${esc(text)}</p>
        <div class="modal-foot" style="border:0;padding:24px 0 0;justify-content:center">${actions}</div>
      </div>
    </div>
  `, { label: title });
}

export function openLegalModal(kind) {
  const isPrivacy = kind === 'privacy';
  const body = isPrivacy
    ? `<p>AniissAuto respects your privacy. We collect only the information needed to respond to enquiries, manage reservations and deliver vehicles. Account details are stored securely, passwords are salted and hashed, and we never sell customer data. You may request a copy or deletion of your information at any time by writing to privacy@aniissauto.com.</p>
       <p>Cookies are used solely to maintain your secure sign-in session. Analytics, if enabled, are anonymised and aggregated.</p>`
    : `<p>All vehicle prices are listed in US dollars and exclude applicable taxes, registration and optional delivery beyond the greater Los Angeles area. Reservations are secured with a refundable deposit and remain subject to final contract and vehicle availability.</p>
       <p>Certified Pre-Owned vehicles include the remainder of the manufacturer warranty where applicable, plus the AniissAuto 12-month limited mechanical guarantee. Our 7-day exchange promise applies to qualifying retail purchases. Full terms are provided with your order documentation.</p>`;
  openModal(`
    <div class="modal-head">
      <div><h2>${isPrivacy ? 'Privacy policy' : 'Terms of sale'}</h2><p>Last updated November 2026</p></div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body" style="display:grid;gap:14px;color:var(--muted);font-size:12.5px;line-height:1.8">
      ${body}
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" type="button" data-close-modal>Close</button>
    </div>
  `, { label: isPrivacy ? 'Privacy policy' : 'Terms of sale' });
}

function shade(hex, percent) {
  const clean = safeHex(hex, '#7c8288').slice(1);
  const num = parseInt(clean, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const CAR_SHAPES = {
  sedan: {
    body: 'M27 126 C30 110 39 102 62 98 L98 63 C108 50 123 42 146 40 L222 40 C247 40 265 46 285 64 L323 97 C347 100 365 109 371 126 L367 130 L339 130 A38 38 0 0 0 265 130 L136 130 A38 38 0 0 0 62 130 L31 130 Z',
    glass: 'M113 92 L139 57 C145 50 154 47 168 47 L219 47 C237 47 248 51 259 61 L284 92 Z',
    pillar: 'M206 47 L210 92',
    wheels: [104, 298]
  },
  suv: {
    body: 'M25 126 C28 109 36 100 57 96 L84 54 C92 41 105 34 125 32 L267 32 C285 32 299 38 311 52 L344 93 C362 97 372 107 375 126 L371 130 L343 130 A38 38 0 0 0 269 130 L136 130 A38 38 0 0 0 62 130 L29 130 Z',
    glass: 'M100 88 L116 53 C121 45 129 40 143 40 L263 40 C277 40 286 44 296 55 L314 88 Z',
    pillar: 'M190 40 L193 88',
    wheels: [104, 300]
  },
  hatch: {
    body: 'M29 126 C33 109 42 101 64 97 L93 58 C104 45 118 38 141 37 L229 37 C251 37 268 43 282 59 L317 97 C340 101 358 109 364 126 L360 130 L336 130 A37 37 0 0 0 263 130 L136 130 A37 37 0 0 0 63 130 L33 130 Z',
    glass: 'M112 92 L132 56 C138 48 146 44 160 44 L228 44 C244 44 252 48 263 60 L288 92 Z',
    pillar: 'M194 44 L198 92',
    wheels: [103, 301]
  },
  sports: {
    body: 'M23 128 C26 114 37 106 63 102 L111 78 C133 64 159 58 190 58 L246 58 C281 58 307 66 330 83 L357 100 C371 104 380 114 382 128 L378 132 L344 132 A37 37 0 0 0 269 132 L134 132 A37 37 0 0 0 60 132 L27 132 Z',
    glass: 'M119 94 L147 72 C158 66 173 64 192 64 L239 64 C261 64 275 68 291 77 L319 95 Z',
    pillar: 'M213 64 L217 95',
    wheels: [103, 302]
  },
  pickup: {
    body: 'M26 126 C30 110 39 102 62 98 L89 60 C99 46 113 40 135 38 L216 38 C234 38 247 44 259 56 L281 88 L344 86 C357 86 364 92 364 103 L364 123 C364 128 360 131 354 131 L342 131 A38 38 0 0 0 267 131 L136 131 A38 38 0 0 0 62 131 L30 131 Z',
    glass: 'M102 86 L121 51 C127 45 135 43 149 43 L208 43 C218 43 225 47 233 55 L251 86 Z',
    pillar: 'M182 43 L185 86',
    wheels: [102, 302]
  },
  van: {
    body: 'M23 126 C23 106 31 96 51 94 L63 51 C69 38 81 32 101 32 L278 33 C302 33 318 41 332 59 L354 95 C370 101 378 111 380 126 L376 130 L344 130 A38 38 0 0 0 269 130 L136 130 A38 38 0 0 0 62 130 L27 130 Z',
    glass: 'M79 86 L91 49 C95 42 101 39 112 39 L185 39 L185 86 Z M197 39 L273 39 C288 39 299 45 308 58 L322 86 L197 86 Z',
    pillar: 'M191 39 L191 86',
    wheels: [102, 302]
  }
};

const SHAPE_MAP = {
  Sedan: 'sedan', SUV: 'suv', Hatchback: 'hatch', Sports: 'sports', Coupe: 'sports',
  Convertible: 'sports', Pickup: 'pickup', Van: 'van', Wagon: 'sedan'
};

let artCounter = 0;

export function carArt(vehicle, mode = 'card', extraClass = '') {
  const shape = CAR_SHAPES[SHAPE_MAP[vehicle?.category]] || CAR_SHAPES.sedan;
  const base = safeHex(vehicle?.color_hex, '#8b929b');
  const brand = safeHex(vehicle?.logo_color, '#d8aa5b');
  const light = shade(base, 34);
  const dark = shade(base, -42);
  const uid = `car${++artCounter}`;
  const wheels = shape.wheels.map((x) => `
    <g>
      <circle cx="${x}" cy="130" r="29" fill="#07090d"/>
      <circle cx="${x}" cy="130" r="19" fill="#20262e" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>
      <circle cx="${x}" cy="130" r="7" fill="#0b0e13" stroke="rgba(255,255,255,.28)" stroke-width="1.5"/>
      <path d="M${x - 12} 130h24M${x} 118v24" stroke="rgba(255,255,255,.22)" stroke-width="2"/>
    </g>`).join('');
  return `<div class="car-art mode-${mode} ${extraClass}" style="--brand:${brand}" aria-hidden="true">
    <span class="car-art-glow"></span>
    <span class="car-art-brand">${esc(vehicle?.brand_name || 'AniissAuto')}</span>
    <span class="car-art-floor"></span>
    <svg class="car-svg" viewBox="0 0 400 175" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${uid}body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${light}"/>
          <stop offset=".42" stop-color="${base}"/>
          <stop offset="1" stop-color="${dark}"/>
        </linearGradient>
        <linearGradient id="${uid}glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#263243"/>
          <stop offset="1" stop-color="#090d13"/>
        </linearGradient>
        <linearGradient id="${uid}shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="rgba(255,255,255,0)"/>
          <stop offset=".45" stop-color="rgba(255,255,255,.26)"/>
          <stop offset="1" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="158" rx="155" ry="10" fill="#000" opacity=".55"/>
      <path d="${shape.body}" fill="url(#${uid}body)" stroke="rgba(255,255,255,.25)" stroke-width="1.2"/>
      <path d="${shape.glass}" fill="url(#${uid}glass)" stroke="rgba(255,255,255,.14)" stroke-width="1"/>
      <path d="${shape.pillar}" stroke="rgba(7,10,14,.6)" stroke-width="4"/>
      <path d="M49 104 C135 96 262 96 353 106" stroke="url(#${uid}shine)" stroke-width="2" opacity=".75"/>
      <path d="M52 111 C140 104 260 104 350 112" stroke="rgba(0,0,0,.2)" stroke-width="1"/>
      <path d="M351 101 C359 103 365 107 369 112" stroke="rgba(255,255,255,.7)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M33 103 C39 100 43 101 47 104" stroke="${brand}" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      ${wheels}
    </svg>
  </div>`;
}

export function brandMonogram(brand) {
  return `<span class="brand-monogram" style="--brand:${safeHex(brand.logo_color || brand.color, '#333')}">${esc(initials(brand.name))}</span>`;
}

export function vehicleCard(vehicle, index = 0) {
  const saved = state.favorites.has(Number(vehicle.id));
  const stockOut = Number(vehicle.stock) <= 0;
  let badge = null;
  let badgeClass = '';
  if (stockOut) {
    badge = 'Reserved';
    badgeClass = 'red';
  } else if (vehicle.badge) {
    badge = vehicle.badge;
    if (vehicle.badge === 'Certified') badgeClass = 'gold';
    else if (vehicle.badge === 'Electric') badgeClass = 'green';
    else if (vehicle.badge === 'Only 1 Left') badgeClass = 'red';
  }
  const mileage = Number(vehicle.mileage) > 0 ? `${number(vehicle.mileage)} mi` : 'New';
  const msrp = Number(vehicle.msrp) > Number(vehicle.price) ? `<small>MSRP ${money(vehicle.msrp)}</small>` : '';
  const ratingCount = Number(vehicle.reviews_count) || 0;
  return `<article class="v-card${stockOut ? ' sold' : ''}" data-vehicle-link="#/vehicle/${vehicle.id}" style="--delay:${Math.min(index * 45, 360)}ms">
    <div class="v-card-art">
      ${carArt(vehicle)}
      ${badge ? `<span class="v-badge ${badgeClass}">${esc(badge)}</span>` : ''}
      <button class="fav-btn${saved ? ' saved' : ''}" type="button" data-fav="${vehicle.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved vehicles' : 'Save vehicle'}">${icon(saved ? 'heartFill' : 'heart')}</button>
      <span class="v-stock${stockOut ? ' out' : ''}"><i></i>${stockOut ? 'Reserved' : `${vehicle.stock} in stock`}</span>
    </div>
    <div class="v-card-body">
      <div class="v-card-meta">
        <span class="v-brand">${esc(vehicle.brand_name)}</span>
        ${ratingCount ? `<span class="v-rating">${icon('starFill')}${Number(vehicle.rating || 0).toFixed(1)}</span>` : ''}
      </div>
      <h3 class="v-card-title"><a href="#/vehicle/${vehicle.id}">${esc(vehicle.year)} ${esc(vehicle.model)}</a></h3>
      <p class="v-variant">${esc(vehicle.variant)} · ${esc(vehicle.category)}</p>
      <div class="v-specs">
        <span class="v-spec">${icon('fuel')}${esc(vehicle.fuel)}</span>
        <span class="v-spec">${icon('gauge')}${number(vehicle.horsepower)} hp</span>
        <span class="v-spec">${icon('gear')}${esc(vehicle.transmission)}</span>
        <span class="v-spec">${icon('road')}${mileage}</span>
      </div>
      <div class="v-card-foot">
        <div class="v-price">${money(vehicle.price)}${msrp}</div>
        <a class="v-card-link" href="#/vehicle/${vehicle.id}" aria-label="View ${esc(vehicle.year)} ${esc(vehicle.brand_name)} ${esc(vehicle.model)}">${icon('arrowUpRight')}</a>
      </div>
    </div>
  </article>`;
}

export function skeletonCards(count = 8) {
  return Array.from({ length: count }, () => `<div class="skeleton-card"><div class="skeleton-art"></div><div class="skeleton-line medium"></div><div class="skeleton-line short"></div><div class="skeleton-line"></div></div>`).join('');
}

export function emptyState(iconName, title, text, action = '') {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon(iconName || 'search')}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${action}
  </div>`;
}

export async function toggleFavorite(id) {
  const vehicleId = Number(id);
  if (!state.user) {
    sessionStorage.setItem('aniiss_after_login', `#/vehicle/${vehicleId}`);
    toast('Sign in to save vehicles to your garage.', 'info');
    window.location.hash = '#/login';
    return;
  }
  const saved = state.favorites.has(vehicleId);
  try {
    if (saved) {
      await api(`/api/favorites/${vehicleId}`, { method: 'DELETE' });
      state.favorites.delete(vehicleId);
      toast('Removed from your garage.', 'info');
    } else {
      await api('/api/favorites', { method: 'POST', body: { vehicleId } });
      state.favorites.add(vehicleId);
      toast('Saved to your garage.', 'success');
    }
    document.querySelectorAll(`[data-fav="${vehicleId}"]`).forEach((button) => {
      const isSaved = state.favorites.has(vehicleId);
      button.classList.toggle('saved', isSaved);
      button.setAttribute('aria-pressed', String(isSaved));
      button.innerHTML = icon(isSaved ? 'heartFill' : 'heart');
    });
    if (saved && window.location.hash.startsWith('#/account')) refreshCurrentRoute();
  } catch (error) {
    if (error.status === 401) {
      state.user = null;
      sessionStorage.setItem('aniiss_after_login', window.location.hash);
      window.location.hash = '#/login';
    }
    toast(error.message, 'error');
  }
}

export async function copyLink() {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied to clipboard.', 'success');
  } catch {
    const input = document.createElement('textarea');
    input.value = url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      toast('Link copied to clipboard.', 'success');
    } catch {
      toast('Could not copy the link.', 'error');
    }
    input.remove();
  }
}

export function openReserveModal(vehicle) {
  if (!state.user) {
    sessionStorage.setItem('aniiss_after_login', `#/vehicle/${vehicle.id}`);
    toast('Sign in to reserve this vehicle.', 'info');
    window.location.hash = '#/login';
    return;
  }
  const deposit = Math.max(500, Math.round((Number(vehicle.price) * 0.01) / 50) * 50);
  openModal(`
    <div class="modal-head">
      <div><h2>Reserve this vehicle</h2><p>A refundable holding deposit secures it in your name.</p></div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      <div class="modal-summary">
        <div class="summary-art">${carArt(vehicle, 'thumb')}</div>
        <div>
          <strong>${esc(vehicle.year)} ${esc(vehicle.brand_name)} ${esc(vehicle.model)}</strong>
          <span>${esc(vehicle.variant)} · ${esc(vehicle.condition)}</span>
          <b>${money(vehicle.price)}</b>
        </div>
      </div>
      <form id="reserveForm">
        <div class="form-grid">
          <div class="field">
            <label for="reserveName">Full name</label>
            <input id="reserveName" type="text" value="${esc(state.user.name)}" disabled>
          </div>
          <div class="field">
            <label for="reserveEmail">Email</label>
            <input id="reserveEmail" type="email" value="${esc(state.user.email)}" disabled>
          </div>
          <div class="field full">
            <label for="reserveNotes">Notes for our team <span style="text-transform:none;letter-spacing:0;color:var(--faint)">(optional)</span></label>
            <textarea id="reserveNotes" placeholder="Delivery preferences, trade-in details, financing questions…" maxlength="600"></textarea>
          </div>
        </div>
        <div class="payment-summary">
          <div><span>Refundable deposit</span><strong>${money(deposit)}</strong></div>
          <div><span>Balance on delivery</span><strong>${money(Number(vehicle.price) - deposit)}</strong></div>
        </div>
        <label class="form-consent"><input type="checkbox" id="reserveTerms" required> I understand this is a refundable reservation deposit. Final purchase is subject to contract, inspection and availability.</label>
        <p class="form-status error" id="reserveStatus" role="status"></p>
      </form>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" type="button" data-close-modal>Cancel</button>
      <button class="btn btn-gold" type="submit" form="reserveForm" id="reserveSubmit">Confirm reservation</button>
    </div>
  `, { label: 'Reserve vehicle' });

  $('#reserveForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = $('#reserveStatus');
    const button = $('#reserveSubmit');
    if (!$('#reserveTerms').checked) {
      status.textContent = 'Please accept the reservation terms to continue.';
      return;
    }
    status.textContent = '';
    button.disabled = true;
    button.textContent = 'Reserving…';
    try {
      const data = await api('/api/orders', {
        method: 'POST',
        body: { vehicleId: Number(vehicle.id), notes: $('#reserveNotes').value.trim() }
      });
      openSuccess(
        'Reservation received',
        `Your ${vehicle.brand_name} ${vehicle.model} is now held in your name. A specialist will contact you within one business hour to finalise the next steps.`,
        `<a class="btn btn-gold" href="#/account?tab=orders" data-close-modal>View my reservations</a>
         <button class="btn btn-outline" type="button" data-close-modal>Continue browsing</button>`
      );
      toast(`Reservation #${data.order.id} created.`, 'success');
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
      button.textContent = 'Confirm reservation';
    }
  });
}

function optionMarkup(options, selectedId) {
  const groups = new Map();
  for (const option of options) {
    if (!groups.has(option.brand_name)) groups.set(option.brand_name, []);
    groups.get(option.brand_name).push(option);
  }
  return Array.from(groups.entries()).map(([brand, items]) => `<optgroup label="${esc(brand)}">${items.map((item) => {
    const label = `${item.year} ${item.model}${item.variant ? ` ${item.variant}` : ''} — ${item.fuel}`;
    return `<option value="${item.id}"${Number(selectedId) === Number(item.id) ? ' selected' : ''}>${esc(label)}</option>`;
  }).join('')}</optgroup>`).join('');
}

export async function openTestDriveModal(vehicle = null) {
  const selectedId = vehicle && typeof vehicle === 'object' ? vehicle.id : Number(vehicle) || null;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const summary = vehicle && typeof vehicle === 'object'
    ? `<div class="modal-summary">
        <div class="summary-art">${carArt(vehicle, 'thumb')}</div>
        <div><strong>${esc(vehicle.year)} ${esc(vehicle.brand_name)} ${esc(vehicle.model)}</strong>
        <span>${esc(vehicle.variant)} · ${esc(vehicle.fuel)}</span><b>${money(vehicle.price)}</b></div>
      </div>`
    : '';
  openModal(`
    <div class="modal-head">
      <div><h2>Book a test drive</h2><p>Private, unhurried and tailored to you. Seven days a week.</p></div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      ${summary}
      <form id="testDriveForm">
        <div class="form-grid">
          <div class="field">
            <label for="tdName">Full name</label>
            <input id="tdName" type="text" value="${esc(state.user?.name || '')}" autocomplete="name" required>
          </div>
          <div class="field">
            <label for="tdPhone">Phone</label>
            <input id="tdPhone" type="tel" value="${esc(state.user?.phone || '')}" autocomplete="tel" required>
          </div>
          <div class="field full">
            <label for="tdEmail">Email</label>
            <input id="tdEmail" type="email" value="${esc(state.user?.email || '')}" autocomplete="email" required>
          </div>
          <div class="field full">
            <label for="tdVehicle">Vehicle of interest</label>
            <select id="tdVehicle" required ${selectedId ? '' : 'disabled'}><option value="">${selectedId ? 'Loading vehicle…' : 'Loading vehicles…'}</option></select>
          </div>
          <div class="field">
            <label for="tdDate">Preferred date</label>
            <input id="tdDate" type="date" min="${today}" value="${tomorrow}" required>
          </div>
          <div class="field">
            <label for="tdTime">Preferred time</label>
            <select id="tdTime">
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="13:00">1:00 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
              <option value="17:00">5:00 PM</option>
              <option value="18:00">6:00 PM</option>
            </select>
          </div>
          <div class="field full">
            <label for="tdNotes">Anything we should know? <span style="text-transform:none;letter-spacing:0;color:var(--faint)">(optional)</span></label>
            <textarea id="tdNotes" maxlength="500" placeholder="Trade-in, accessibility needs, preferred route…"></textarea>
          </div>
        </div>
        <p class="form-status error" id="tdStatus" role="status"></p>
      </form>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" type="button" data-close-modal>Cancel</button>
      <button class="btn btn-gold" type="submit" form="testDriveForm" id="tdSubmit" ${selectedId ? '' : 'disabled'}>Request test drive</button>
    </div>
  `, { label: 'Book a test drive' });

  const select = $('#tdVehicle');
  const submit = $('#tdSubmit');
  try {
    if (!state.vehicleOptions) {
      const data = await api('/api/vehicles/options');
      state.vehicleOptions = data.vehicles;
    }
    if (!$('#tdVehicle')) return;
    select.innerHTML = `<option value="">Select a vehicle</option>${optionMarkup(state.vehicleOptions, selectedId)}`;
    select.disabled = false;
    submit.disabled = false;
    if (selectedId) select.value = String(selectedId);
  } catch (error) {
    const status = $('#tdStatus');
    if (status) status.textContent = 'Could not load vehicles. Please try again.';
    if (selectedId && select) {
      select.innerHTML = `<option value="${selectedId}">Selected vehicle</option>`;
      select.disabled = false;
      submit.disabled = false;
    }
  }

  $('#testDriveForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = $('#tdStatus');
    const button = $('#tdSubmit');
    const vehicleId = Number($('#tdVehicle').value);
    if (!vehicleId) {
      status.textContent = 'Please choose a vehicle.';
      return;
    }
    status.textContent = '';
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const data = await api('/api/test-drives', {
        method: 'POST',
        body: {
          vehicleId,
          name: $('#tdName').value.trim(),
          email: $('#tdEmail').value.trim(),
          phone: $('#tdPhone').value.trim(),
          preferredDate: $('#tdDate').value,
          preferredTime: $('#tdTime').value,
          notes: $('#tdNotes').value.trim()
        }
      });
      openSuccess(
        'Test drive requested',
        `Thank you. Your request has been received (reference TD-${String(data.id).padStart(5, '0')}). Our concierge team will call to confirm your preferred slot.`,
        `<a class="btn btn-gold" href="#/account?tab=drives" data-close-modal>View my test drives</a>
         <button class="btn btn-outline" type="button" data-close-modal>Done</button>`
      );
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
      button.textContent = 'Request test drive';
    }
  });
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-modal]')) {
    event.preventDefault();
    closeModal();
  }
  if (event.target.matches('[data-modal-backdrop]')) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});
