import {
  api, $, esc, money, compactMoney, number, formatDate, formatTime, initials,
  icon, safeHex, toast, openModal, closeModal
} from './utils.js';

const VIEWS = {
  overview: { label: 'Overview', section: 'Command centre' },
  inventory: { label: 'Inventory', section: 'Workspace' },
  brands: { label: 'Marques', section: 'Workspace' },
  orders: { label: 'Reservations', section: 'Operations' },
  drives: { label: 'Test drives', section: 'Operations' },
  customers: { label: 'Customers', section: 'Operations' },
  messages: { label: 'Messages', section: 'Inbox' },
  subscribers: { label: 'Subscribers', section: 'Inbox' },
  settings: { label: 'Showroom settings', section: 'System' }
};

const NAV_GROUPS = [
  ['Workspace', [['overview', 'Overview', 'dashboard'], ['inventory', 'Inventory', 'car'], ['brands', 'Marques', 'tag']]],
  ['Operations', [['orders', 'Reservations', 'key'], ['drives', 'Test drives', 'calendar'], ['customers', 'Customers', 'users']]],
  ['Inbox', [['messages', 'Messages', 'inbox'], ['subscribers', 'Subscribers', 'mail']]],
  ['System', [['settings', 'Settings', 'settings']]]
];

const ORDER_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const DRIVE_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const MESSAGE_STATUSES = ['new', 'read', 'resolved'];
const CATEGORIES = ['Sedan', 'SUV', 'Sports', 'Coupe', 'Pickup', 'Hatchback', 'Van', 'Convertible', 'Wagon'];
const FUELS = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const CONDITIONS = ['New', 'Certified Pre-Owned'];
const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4WD'];

const adminState = {
  user: null,
  currentView: 'overview',
  routeToken: 0,
  vehicles: [],
  brands: []
};

const ui = {
  inventory: { q: '', brand: 'all', category: 'all', stock: 'all', sort: 'newest', page: 1 },
  brands: { q: '' },
  orders: { q: '', status: 'all' },
  drives: { q: '', status: 'all' },
  customers: { q: '' },
  messages: { q: '', status: 'all' },
  subscribers: { q: '' }
};

function option(value, label, current) {
  return `<option value="${esc(value)}"${String(value) === String(current) ? ' selected' : ''}>${esc(label)}</option>`;
}

function adminStatusChip(status) {
  const value = String(status || 'pending').toLowerCase();
  return `<span class="status-chip status-${esc(value)}">${esc(value)}</span>`;
}

function statusSelect(kind, id, current, statuses) {
  return `<select class="admin-status-select status-${esc(current)}" data-${kind}-id="${id}" data-current="${esc(current)}" aria-label="Update status">
    ${statuses.map((status) => option(status, status, current)).join('')}
  </select>`;
}

function formatDateTime(value) {
  return value ? `${formatDate(value)} · ${new Date(String(value).replace(' ', 'T')).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : '—';
}

function monthLabel(value) {
  if (!value) return '';
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

function vehicleName(vehicle) {
  return `${vehicle.year || ''} ${vehicle.brand_name || ''} ${vehicle.model || ''} ${vehicle.variant || ''}`.replace(/\s+/g, ' ').trim();
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function emptyMarkup(iconName, title, text) {
  return `<div class="admin-empty">${icon(iconName)}<h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
}

function visiblePages(page, pages) {
  const wanted = new Set([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => wanted.add(value));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((value) => wanted.add(value));
  return [...wanted].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
}

function handleSessionExpired(message = 'Your administrator session has expired. Please sign in again.') {
  adminState.user = null;
  closeModal();
  renderLogin(message);
}

function renderLogin(message = '') {
  const root = $('#adminRoot');
  if (!root) return;
  adminState.user = null;
  document.title = 'Admin sign in — AniissAuto';
  root.innerHTML = `<div class="admin-login">
    <section class="login-visual">
      <a class="login-brand" href="/">
        <span class="login-brand-mark">A</span>
        <span><strong>ANIIS</strong><small>Automobiles · Admin</small></span>
      </a>
      <div class="login-copy">
        <span class="eyebrow">Command centre</span>
        <h1>Run the showroom<br><em>beautifully.</em></h1>
        <p>Inventory, reservations, client relationships and the stories behind every handover — orchestrated from one considered workspace.</p>
      </div>
      <div class="login-facts">
        <span class="login-fact">${icon('car')} Live inventory</span>
        <span class="login-fact">${icon('key')} Reservation desk</span>
        <span class="login-fact">${icon('shield')} Secure admin access</span>
      </div>
    </section>
    <section class="login-panel">
      <div class="login-card">
        <div class="login-card-mark">${icon('lock')}</div>
        <h2>Administrator sign in</h2>
        <p>Private access for the AniissAuto showroom team. All activity is linked to your administrator account.</p>
        <form class="login-form" id="adminLoginForm">
          <div class="field">
            <label for="adminIdentifier">Email or username</label>
            <input id="adminIdentifier" name="identifier" type="text" autocomplete="username" placeholder="aniissadmin" required>
          </div>
          <div class="field">
            <label for="adminPassword">Password</label>
            <div class="login-password">
              <input id="adminPassword" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required>
              <button type="button" id="adminPasswordToggle" aria-label="Show password">${icon('eye')}</button>
            </div>
          </div>
          <p class="login-status" id="loginStatus" role="status">${esc(message)}</p>
          <button class="btn btn-gold login-submit" type="submit" id="adminLoginSubmit">Enter the command centre</button>
        </form>
        <a class="login-storefront" href="/">${icon('chevronLeft')} Return to the storefront</a>
      </div>
    </section>
  </div>`;

  $('#adminPasswordToggle')?.addEventListener('click', () => {
    const input = $('#adminPassword');
    const button = $('#adminPasswordToggle');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.innerHTML = icon(show ? 'eyeOff' : 'eye');
    button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  $('#adminLoginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = $('#adminLoginSubmit');
    const status = $('#loginStatus');
    status.textContent = '';
    button.disabled = true;
    button.textContent = 'Verifying…';
    try {
      const data = await api('/api/admin/login', {
        method: 'POST',
        body: {
          identifier: $('#adminIdentifier').value.trim(),
          password: $('#adminPassword').value
        }
      });
      adminState.user = data.user;
      const requested = currentViewKey();
      history.replaceState(null, '', `#/${requested}`);
      initShell();
      await route();
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
      button.textContent = 'Enter the command centre';
    }
  });
}

function initShell() {
  const root = $('#adminRoot');
  if (!root || !adminState.user) return;
  const user = adminState.user;
  root.innerHTML = `<div class="admin-shell">
    <aside class="admin-sidebar" id="adminSidebar">
      <a class="admin-logo" href="#/overview">
        <span class="admin-logo-mark">A</span>
        <span><strong>ANIIS</strong><small>Automobiles · Admin</small></span>
      </a>
      <div class="admin-nav-scroll">
        ${NAV_GROUPS.map(([label, links]) => `<div class="admin-nav-label">${label}</div>
          ${links.map(([key, name, iconName]) => `<a class="admin-nav-link" href="#/${key}" data-view="${key}">${icon(iconName)}<span>${name}</span></a>`).join('')}`).join('')}
      </div>
      <div class="admin-sidebar-foot">
        <div class="admin-sidebar-user">
          <span class="avatar">${esc(initials(user.name))}</span>
          <div><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span></div>
        </div>
        <div class="admin-sidebar-actions">
          <a href="/" target="_blank" rel="noopener">${icon('external')} Storefront</a>
          <button type="button" id="adminLogout">${icon('logout')} Sign out</button>
        </div>
      </div>
    </aside>
    <button class="admin-scrim" id="adminScrim" type="button" aria-label="Close navigation"></button>
    <div class="admin-main">
      <header class="admin-topbar">
        <div class="admin-topbar-left">
          <button class="admin-menu-toggle" id="adminMenuToggle" type="button" aria-label="Open navigation" aria-expanded="false">${icon('menu')}</button>
          <div class="admin-topbar-title">
            <span id="adminViewSection">Command centre</span>
            <strong id="adminViewTitle">Overview</strong>
          </div>
        </div>
        <div class="admin-topbar-actions">
          <a class="admin-top-link" href="/" target="_blank" rel="noopener">${icon('external')}<span>View storefront</span></a>
          <div class="admin-user-chip">
            <span class="avatar">${esc(initials(user.name))}</span>
            <div><strong>${esc(user.name)}</strong><span>Administrator</span></div>
          </div>
        </div>
      </header>
      <main class="admin-content" id="adminContent"></main>
    </div>
  </div>`;

  const openNav = (open) => {
    $('#adminSidebar')?.classList.toggle('open', open);
    $('#adminScrim')?.classList.toggle('open', open);
    $('#adminMenuToggle')?.setAttribute('aria-expanded', String(open));
  };
  $('#adminMenuToggle')?.addEventListener('click', () => openNav(true));
  $('#adminScrim')?.addEventListener('click', () => openNav(false));
  document.querySelectorAll('.admin-nav-link').forEach((link) => link.addEventListener('click', () => openNav(false)));
  $('#adminLogout')?.addEventListener('click', async () => {
    try {
      await api('/api/logout', { method: 'POST' });
    } catch {
      adminState.user = null;
    }
    renderLogin();
  });
  $('#adminContent')?.addEventListener('click', (event) => {
    if (event.target.closest('[data-refresh]')) {
      event.preventDefault();
      route({ silent: true });
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') openNav(false);
  });
}

function currentViewKey() {
  const key = (window.location.hash.replace(/^#\/?/, '').split('?')[0] || 'overview').toLowerCase();
  return VIEWS[key] ? key : 'overview';
}

async function route({ silent = false } = {}) {
  if (!adminState.user) return;
  const view = currentViewKey();
  if (!VIEWS[view]) {
    history.replaceState(null, '', '#/overview');
  }
  adminState.currentView = view;
  const content = $('#adminContent');
  if (!content) return;
  document.title = `${VIEWS[view].label} — AniissAuto Admin`;
  const title = $('#adminViewTitle');
  const section = $('#adminViewSection');
  if (title) title.textContent = VIEWS[view].label;
  if (section) section.textContent = VIEWS[view].section;
  document.querySelectorAll('.admin-nav-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.view === view);
  });
  $('#adminSidebar')?.classList.remove('open');
  $('#adminScrim')?.classList.remove('open');

  const token = ++adminState.routeToken;
  if (!silent) content.innerHTML = '<div class="admin-loading"><div class="spinner"></div><p>Loading the workspace…</p></div>';
  try {
    const result = await LOADERS[view](token);
    if (token !== adminState.routeToken) return;
    content.innerHTML = result.html;
    result.mount?.();
  } catch (error) {
    if (token !== adminState.routeToken) return;
    if (error.status === 401 || error.status === 403) {
      handleSessionExpired();
      return;
    }
    content.innerHTML = `<div class="admin-error"><span>${esc(error.message || 'The workspace could not be loaded.')}</span><button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Retry</button></div>`;
  }
}

function overviewMarkup(data) {
  const stats = data.stats || {};
  const monthly = data.monthly || [];
  const maxMonth = Math.max(...monthly.map((month) => Number(month.value) || 0), 1);
  const statusMap = new Map((data.statusBreakdown || []).map((row) => [row.status, row]));
  const topBrands = data.topBrands || [];
  const maxStock = Math.max(...topBrands.map((brand) => Number(brand.stock) || 0), 1);
  const recentOrders = data.recentOrders || [];
  const upcomingDrives = data.upcomingDrives || [];
  const recentMessages = data.recentMessages || [];

  return `<div class="admin-intro">
    <div>
      <span class="eyebrow">Executive snapshot</span>
      <h1>${greeting()}, ${esc(adminState.user.name.split(' ')[0])}.</h1>
      <p>Here is how the showroom is moving today — inventory value, reservations and the conversations that need your attention.</p>
    </div>
    <div class="admin-intro-actions">
      <button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Refresh</button>
      <a class="btn btn-gold btn-sm" href="#/inventory">${icon('car')} Manage inventory</a>
    </div>
  </div>
  <div class="admin-stats-grid">
    <article class="admin-stat"><div class="admin-stat-top"><span>Inventory value</span><span class="admin-stat-icon">${icon('wallet')}</span></div><strong>${compactMoney(stats.inventoryValue || 0)}</strong><span class="admin-stat-foot">${icon('car')} ${number(stats.vehicles || 0)} vehicles across ${number(stats.brands || 0)} marques</span></article>
    <article class="admin-stat"><div class="admin-stat-top"><span>Confirmed pipeline</span><span class="admin-stat-icon">${icon('chart')}</span></div><strong>${compactMoney(stats.pipelineValue || 0)}</strong><span class="admin-stat-foot">${icon('key')} ${number(stats.orders || 0)} reservations in total</span></article>
    <article class="admin-stat"><div class="admin-stat-top"><span>Pending reservations</span><span class="admin-stat-icon">${icon('clock')}</span></div><strong>${number(stats.pendingOrders || 0)}</strong><span class="admin-stat-foot">${icon('calendar')} ${number(stats.pendingDrives || 0)} test drives · ${number(stats.newMessages || 0)} new messages</span></article>
    <article class="admin-stat"><div class="admin-stat-top"><span>Client base</span><span class="admin-stat-icon">${icon('users')}</span></div><strong>${number(stats.customers || 0)}</strong><span class="admin-stat-foot">${icon('mail')} ${number(stats.subscribers || 0)} newsletter subscribers</span></article>
  </div>
  <div class="admin-grid-2">
    <section class="admin-panel">
      <div class="admin-panel-head"><div><h2>Reservation value</h2><p>Recent order value by month</p></div><span class="admin-tag gold">${compactMoney(stats.pipelineValue || 0)} pipeline</span></div>
      <div class="admin-panel-body">
        ${monthly.length ? `<div class="admin-chart">${monthly.map((month) => {
          const height = Math.max(5, Math.round((Number(month.value) / maxMonth) * 132));
          return `<div class="admin-chart-col"><span class="admin-chart-value">${compactMoney(month.value)}</span><div class="admin-chart-bar" style="height:${height}px"></div><span class="admin-chart-month">${esc(monthLabel(month.month))}</span></div>`;
        }).join('')}</div>` : emptyMarkup('chart', 'No reservation history', 'Reservation value will appear here once orders begin.')}
      </div>
    </section>
    <section class="admin-panel">
      <div class="admin-panel-head"><div><h2>Order pipeline</h2><p>Every reservation by current stage</p></div><a class="admin-panel-link" href="#/orders">View all ${icon('arrowRight')}</a></div>
      <div class="admin-panel-body">
        <div class="pipeline-list">
          ${ORDER_STATUSES.map((status) => {
            const row = statusMap.get(status) || { count: 0, value: 0 };
            const total = Number(stats.orders) || 1;
            const width = Math.round((Number(row.count) / total) * 100);
            return `<div class="pipeline-row">
              <div class="pipeline-top"><span>${status} <em>${number(row.count)} orders</em></span><strong>${compactMoney(row.value)}</strong></div>
              <div class="pipeline-track"><div class="pipeline-fill ${status}" style="width:${width}%"></div></div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>
  </div>
  <div class="admin-grid-2">
    <section class="admin-panel">
      <div class="admin-panel-head"><div><h2>Recent reservations</h2><p>The latest activity from the reservation desk</p></div><a class="admin-panel-link" href="#/orders">Open desk ${icon('arrowRight')}</a></div>
      <div class="admin-panel-body flush">
        ${recentOrders.length ? `<div class="admin-table-scroll"><table class="admin-table">
          <thead><tr><th>Vehicle</th><th>Client</th><th>Value</th><th>Status</th></tr></thead>
          <tbody>${recentOrders.map((order) => `<tr>
            <td><strong>${esc(order.vehicle_snapshot)}</strong><span class="admin-table-sub">Order #${String(order.id).padStart(5, '0')}</span></td>
            <td>${esc(order.customer_name || 'Guest')}<span class="admin-table-sub">${esc(order.customer_email || '')}</span></td>
            <td class="admin-price">${money(order.total)}</td>
            <td>${adminStatusChip(order.status)}</td>
          </tr>`).join('')}</tbody>
        </table></div>` : emptyMarkup('key', 'No reservations yet', 'The reservation desk is quiet for now.')}
      </div>
    </section>
    <section class="admin-panel">
      <div class="admin-panel-head"><div><h2>Upcoming test drives</h2><p>Private appointments on the calendar</p></div><a class="admin-panel-link" href="#/drives">Calendar ${icon('arrowRight')}</a></div>
      <div class="admin-panel-body">
        ${upcomingDrives.length ? `<div class="admin-list">${upcomingDrives.map((drive) => {
          const date = new Date(`${drive.preferred_date}T00:00:00`);
          return `<div class="admin-list-row">
            <span class="admin-list-date"><strong>${date.getDate() || '—'}</strong><span>${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)}</span></span>
            <div class="admin-list-main"><strong>${esc(drive.vehicle_snapshot)}</strong><span>${esc(drive.name)} · ${formatTime(drive.preferred_time)}</span></div>
            <div class="admin-list-side">${adminStatusChip(drive.status)}</div>
          </div>`;
        }).join('')}</div>` : emptyMarkup('calendar', 'No upcoming drives', 'New appointments will appear here.')}
      </div>
    </section>
  </div>
  <div class="admin-grid-2">
    <section class="admin-panel">
      <div class="admin-panel-head"><div><h2>Inventory by marque</h2><p>The strongest stocked marques</p></div><a class="admin-panel-link" href="#/brands">All marques ${icon('arrowRight')}</a></div>
      <div class="admin-panel-body">
        ${topBrands.length ? `<div class="admin-top-brands">${topBrands.map((brand) => `<div class="admin-top-brand">
          <strong>${esc(brand.name)}</strong><span>${number(brand.stock)} units · ${compactMoney(brand.value)}</span>
          <div class="pipeline-track"><div class="pipeline-fill" style="width:${Math.round((Number(brand.stock) / maxStock) * 100)}%"></div></div>
        </div>`).join('')}</div>` : emptyMarkup('tag', 'No inventory', 'Add marques and vehicles to populate the showroom.')}
      </div>
    </section>
    <section class="admin-panel">
      <div class="admin-panel-head"><div><h2>Latest enquiries</h2><p>Messages from prospective clients</p></div><a class="admin-panel-link" href="#/messages">Inbox ${icon('arrowRight')}</a></div>
      <div class="admin-panel-body">
        ${recentMessages.length ? `<div class="admin-list">${recentMessages.map((message) => `<div class="admin-list-row">
          <div class="admin-list-main"><strong>${esc(message.subject)}</strong><span>${esc(message.name)} · ${formatDate(message.created_at)}</span></div>
          <div class="admin-list-side">${adminStatusChip(message.status)}</div>
        </div>`).join('')}</div>` : emptyMarkup('inbox', 'The inbox is clear', 'New client enquiries will appear here.')}
      </div>
    </section>
  </div>`;
}

async function loadOverview() {
  const data = await api('/api/admin/overview');
  return { html: overviewMarkup(data) };
}

function filteredInventory() {
  const filters = ui.inventory;
  const query = filters.q.trim().toLowerCase();
  let list = adminState.vehicles.filter((vehicle) => {
    if (filters.brand !== 'all' && String(vehicle.brand_id) !== String(filters.brand)) return false;
    if (filters.category !== 'all' && vehicle.category !== filters.category) return false;
    if (filters.stock === 'in' && Number(vehicle.stock) <= 0) return false;
    if (filters.stock === 'out' && Number(vehicle.stock) > 0) return false;
    if (!query) return true;
    return [vehicle.brand_name, vehicle.model, vehicle.variant, vehicle.vin, vehicle.category, vehicle.condition, vehicle.year]
      .join(' ').toLowerCase().includes(query);
  });
  if (filters.sort === 'price_desc') list = list.sort((a, b) => b.price - a.price);
  else if (filters.sort === 'price_asc') list = list.sort((a, b) => a.price - b.price);
  else if (filters.sort === 'stock') list = list.sort((a, b) => b.stock - a.stock);
  else list = list.sort((a, b) => b.id - a.id);
  return list;
}

function inventoryResultsMarkup() {
  const list = filteredInventory();
  const perPage = 12;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  ui.inventory.page = Math.min(Math.max(1, ui.inventory.page), pages);
  const page = ui.inventory.page;
  const rows = list.slice((page - 1) * perPage, page * perPage);
  if (!rows.length) {
    return emptyMarkup('car', 'No vehicles found', 'Adjust the search or filters, or add a vehicle to the collection.');
  }
  return `<div class="admin-table-scroll"><table class="admin-table">
    <thead><tr><th>Vehicle</th><th>Specification</th><th>Price</th><th>Stock</th><th>Status</th><th class="admin-col-actions">Actions</th></tr></thead>
    <tbody>${rows.map((vehicle) => {
      const stock = Number(vehicle.stock) || 0;
      return `<tr>
        <td><div class="admin-vehicle-cell"><span class="admin-swatch" style="--swatch:${safeHex(vehicle.color_hex, '#7C8288')}"></span><div><strong>${esc(vehicle.year)} ${esc(vehicle.brand_name)} ${esc(vehicle.model)}</strong><span class="admin-table-sub">${esc(vehicle.variant || 'Standard')} · ${esc(vehicle.vin)}</span></div></div></td>
        <td>${esc(vehicle.category)}<span class="admin-table-sub">${esc(vehicle.condition)} · ${esc(vehicle.fuel)}</span></td>
        <td class="admin-price">${money(vehicle.price)}${Number(vehicle.msrp) > Number(vehicle.price) ? `<small>MSRP ${money(vehicle.msrp)}</small>` : ''}</td>
        <td><strong>${number(stock)}</strong><span class="admin-table-sub">${stock > 0 ? 'Available' : 'Reserved'}</span></td>
        <td>${vehicle.featured ? '<span class="admin-tag gold">Featured</span>' : stock > 0 ? '<span class="admin-tag green">Live</span>' : '<span class="admin-tag red">Out</span>'}</td>
        <td class="admin-cell-actions">
          <a class="admin-icon-btn" href="/#/vehicle/${vehicle.id}" target="_blank" rel="noopener" aria-label="View on storefront">${icon('external')}</a>
          <button class="admin-icon-btn" type="button" data-edit-vehicle="${vehicle.id}" aria-label="Edit vehicle">${icon('edit')}</button>
          <button class="admin-icon-btn danger" type="button" data-delete-vehicle="${vehicle.id}" aria-label="Delete vehicle">${icon('trash')}</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>
  <div class="admin-pager"><span>Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, list.length)} of ${list.length}</span><div class="admin-pager-buttons">
    <button type="button" data-page="${page - 1}" data-pager="inventory"${page === 1 ? ' disabled' : ''} aria-label="Previous page">${icon('chevronLeft')}</button>
    ${visiblePages(page, pages).map((value) => `<button type="button" class="${value === page ? 'active' : ''}" data-page="${value}" data-pager="inventory">${value}</button>`).join('')}
    <button type="button" data-page="${page + 1}" data-pager="inventory"${page === pages ? ' disabled' : ''} aria-label="Next page">${icon('chevronRight')}</button>
  </div></div>`;
}

function paintInventory() {
  const results = $('#adminInventoryResults');
  if (results) results.innerHTML = inventoryResultsMarkup();
  const count = $('#adminInventoryCount');
  if (count) count.textContent = `${number(filteredInventory().length)} vehicles`;
}

function inventoryMarkup() {
  const filters = ui.inventory;
  const categories = [...new Set(adminState.vehicles.map((vehicle) => vehicle.category))].sort();
  return `<div class="admin-intro">
    <div><span class="eyebrow">The collection</span><h1>Inventory, <em>curated.</em></h1><p>Every listing, specification and stock level in the showroom. Changes publish to the storefront immediately.</p></div>
    <div class="admin-intro-actions"><span class="admin-count" id="adminInventoryCount">${number(filteredInventory().length)} vehicles</span><button class="btn btn-gold btn-sm" type="button" id="adminAddVehicle">${icon('plus')} Add vehicle</button></div>
  </div>
  <div class="admin-toolbar">
    <div class="admin-toolbar-left">
      <div class="admin-search">${icon('search')}<input id="adminInventorySearch" type="search" placeholder="Search model, VIN, variant…" value="${esc(filters.q)}"></div>
      <select class="admin-select" id="adminInventoryBrand" aria-label="Filter by marque"><option value="all">All marques</option>${adminState.brands.map((brand) => option(brand.id, brand.name, filters.brand)).join('')}</select>
      <select class="admin-select" id="adminInventoryCategory" aria-label="Filter by category"><option value="all">All body styles</option>${categories.map((category) => option(category, category, filters.category)).join('')}</select>
    </div>
    <div class="admin-toolbar-right">
      <select class="admin-select" id="adminInventoryStock" aria-label="Filter by stock"><option value="all">All stock</option>${option('in', 'Available', filters.stock)}${option('out', 'Reserved', filters.stock)}</select>
      <select class="admin-select" id="adminInventorySort" aria-label="Sort vehicles">${option('newest', 'Newest added', filters.sort)}${option('price_desc', 'Price high to low', filters.sort)}${option('price_asc', 'Price low to high', filters.sort)}${option('stock', 'Most stock', filters.sort)}</select>
      <button class="btn btn-outline btn-sm" type="button" id="adminInventoryReset">${icon('refresh')} Reset</button>
    </div>
  </div>
  <section class="admin-panel"><div class="admin-panel-body flush" id="adminInventoryResults">${inventoryResultsMarkup()}</div></section>`;
}

function openVehicleForm(vehicle = null) {
  if (!adminState.brands.length) {
    toast('Add a marque before creating a vehicle.', 'error');
    return;
  }
  const editing = Boolean(vehicle);
  const car = vehicle || {
    brand_id: adminState.brands[0]?.id || '', model: '', variant: '', year: 2026, category: 'Sedan',
    price: 75000, msrp: '', condition: 'New', mileage: 0, fuel: 'Petrol', transmission: '8-Speed Automatic',
    drivetrain: 'RWD', engine: '3.0L Turbo I6', horsepower: 300, torque: 300, seats: 5, doors: 4,
    exterior_color: 'Obsidian Black', color_hex: '#0B0E13', stock: 1, vin: '', featured: 0, badge: '',
    description: '', features: [], safety: []
  };
  const field = (id, label, control, className = '') => `<div class="field ${className}"><label for="${id}">${label}</label>${control}</div>`;
  openModal(`
    <div class="modal-head">
      <div><h2>${editing ? 'Edit vehicle' : 'Add vehicle'}</h2><p>${editing ? esc(vehicleName(car)) : 'Create a new listing for the showroom collection.'}</p></div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      <form id="vehicleForm">
        <div class="admin-form-grid">
          <div class="admin-form-section">Identity &amp; listing</div>
          ${field('vehicleBrand', 'Marque', `<select id="vehicleBrand" name="brand_id" required>${adminState.brands.map((brand) => option(brand.id, brand.name, car.brand_id)).join('')}</select>`)}
          ${field('vehicleYear', 'Model year', `<input id="vehicleYear" name="year" type="number" min="1990" max="2027" value="${esc(car.year)}" required>`)}
          ${field('vehicleModel', 'Model', `<input id="vehicleModel" name="model" type="text" maxlength="80" value="${esc(car.model)}" required>`)}
          ${field('vehicleVariant', 'Variant / trim', `<input id="vehicleVariant" name="variant" type="text" maxlength="80" value="${esc(car.variant)}">`)}
          ${field('vehicleCategory', 'Body style', `<select id="vehicleCategory" name="category" required>${CATEGORIES.map((value) => option(value, value, car.category)).join('')}</select>`)}
          ${field('vehicleCondition', 'Condition', `<select id="vehicleCondition" name="condition" required>${CONDITIONS.map((value) => option(value, value, car.condition)).join('')}</select>`)}
          ${field('vehiclePrice', 'Price (USD)', `<input id="vehiclePrice" name="price" type="number" min="1000" max="20000000" step="50" value="${esc(car.price)}" required>`)}
          ${field('vehicleMsrp', 'MSRP (optional)', `<input id="vehicleMsrp" name="msrp" type="number" min="1000" max="25000000" step="50" value="${esc(car.msrp ?? '')}">`)}
          ${field('vehicleStock', 'Units in stock', `<input id="vehicleStock" name="stock" type="number" min="0" max="999" value="${esc(car.stock)}" required>`)}
          ${field('vehicleVin', 'VIN', `<input id="vehicleVin" name="vin" type="text" maxlength="20" value="${esc(car.vin)}" placeholder="Leave blank to generate">`, '')}
          ${field('vehicleMileage', 'Mileage', `<input id="vehicleMileage" name="mileage" type="number" min="0" max="500000" value="${esc(car.mileage)}" required>`)}
          <div class="field"><label>&nbsp;</label><label class="admin-check"><input type="checkbox" name="featured" value="1"${Number(car.featured) ? ' checked' : ''}> Feature on the homepage</label></div>
          <div class="admin-form-section">Powertrain</div>
          ${field('vehicleFuel', 'Fuel', `<select id="vehicleFuel" name="fuel" required>${FUELS.map((value) => option(value, value, car.fuel)).join('')}</select>`)}
          ${field('vehicleDrivetrain', 'Drivetrain', `<select id="vehicleDrivetrain" name="drivetrain" required>${DRIVETRAINS.map((value) => option(value, value, car.drivetrain)).join('')}</select>`)}
          ${field('vehicleTransmission', 'Transmission', `<input id="vehicleTransmission" name="transmission" type="text" maxlength="60" value="${esc(car.transmission)}" required>`)}
          ${field('vehicleEngine', 'Engine', `<input id="vehicleEngine" name="engine" type="text" maxlength="100" value="${esc(car.engine)}" required>`)}
          ${field('vehicleHorsepower', 'Horsepower', `<input id="vehicleHorsepower" name="horsepower" type="number" min="10" max="3000" value="${esc(car.horsepower)}" required>`)}
          ${field('vehicleTorque', 'Torque (lb-ft)', `<input id="vehicleTorque" name="torque" type="number" min="10" max="5000" value="${esc(car.torque)}" required>`)}
          ${field('vehicleSeats', 'Seats', `<input id="vehicleSeats" name="seats" type="number" min="1" max="12" value="${esc(car.seats)}" required>`)}
          ${field('vehicleDoors', 'Doors', `<input id="vehicleDoors" name="doors" type="number" min="2" max="6" value="${esc(car.doors)}" required>`)}
          <div class="admin-form-section">Presentation</div>
          ${field('vehicleColorName', 'Exterior colour', `<input id="vehicleColorName" name="exterior_color" type="text" maxlength="80" value="${esc(car.exterior_color)}" required>`)}
          ${field('vehicleColor', 'Colour swatch', `<input id="vehicleColor" name="color_hex" type="color" value="${safeHex(car.color_hex)}" required>`)}
          ${field('vehicleBadge', 'Badge (optional)', `<input id="vehicleBadge" name="badge" type="text" maxlength="40" value="${esc(car.badge || '')}" placeholder="e.g. New Arrival">`)}
          ${field('vehicleFeatures', 'Features', `<textarea id="vehicleFeatures" name="features" placeholder="One feature per line or comma separated">${esc((car.features || []).join('\n'))}</textarea>`, 'full')}
          ${field('vehicleSafety', 'Safety equipment', `<textarea id="vehicleSafety" name="safety" placeholder="One item per line or comma separated">${esc((car.safety || []).join('\n'))}</textarea>`, 'full')}
          ${field('vehicleDescription', 'Description', `<textarea id="vehicleDescription" name="description" minlength="10" maxlength="2000" required placeholder="Tell the story of this vehicle…">${esc(car.description || '')}</textarea>`, 'full')}
        </div>
        <p class="admin-form-status" id="vehicleFormStatus" role="status"></p>
      </form>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" type="button" data-close-modal>Cancel</button>
      <button class="btn btn-gold" type="submit" form="vehicleForm" id="vehicleFormSubmit">${editing ? 'Save changes' : 'Add vehicle'}</button>
    </div>
  `, { wide: true, label: editing ? 'Edit vehicle' : 'Add vehicle' });

  $('#vehicleForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const status = $('#vehicleFormStatus');
    const button = $('#vehicleFormSubmit');
    const data = new FormData(form);
    const payload = {
      brand_id: Number(data.get('brand_id')),
      model: String(data.get('model') || '').trim(),
      variant: String(data.get('variant') || '').trim(),
      year: Number(data.get('year')),
      category: String(data.get('category')),
      price: Number(data.get('price')),
      msrp: data.get('msrp') ? Number(data.get('msrp')) : null,
      condition: String(data.get('condition')),
      mileage: Number(data.get('mileage')),
      fuel: String(data.get('fuel')),
      transmission: String(data.get('transmission') || '').trim(),
      drivetrain: String(data.get('drivetrain')),
      engine: String(data.get('engine') || '').trim(),
      horsepower: Number(data.get('horsepower')),
      torque: Number(data.get('torque')),
      seats: Number(data.get('seats')),
      doors: Number(data.get('doors')),
      exterior_color: String(data.get('exterior_color') || '').trim(),
      color_hex: String(data.get('color_hex')),
      stock: Number(data.get('stock')),
      vin: String(data.get('vin') || '').trim(),
      featured: data.get('featured') ? 1 : 0,
      badge: String(data.get('badge') || '').trim(),
      description: String(data.get('description') || '').trim(),
      features: String(data.get('features') || ''),
      safety: String(data.get('safety') || '')
    };
    status.textContent = '';
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      const result = await api(editing ? `/api/admin/vehicles/${vehicle.id}` : '/api/admin/vehicles', {
        method: editing ? 'PUT' : 'POST',
        body: payload
      });
      toast(result.message || 'Vehicle saved.', 'success');
      closeModal();
      await route({ silent: true });
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
      button.textContent = editing ? 'Save changes' : 'Add vehicle';
    }
  });
}

function confirmAction({ title, text, label = 'Confirm', onConfirm }) {
  openModal(`
    <div class="modal-head">
      <div><h2>Please confirm</h2><p>This action affects live showroom data.</p></div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body admin-confirm">
      <div class="admin-confirm-icon">${icon('trash')}</div>
      <h2>${esc(title)}</h2>
      <p>${text}</p>
      <p class="admin-form-status" id="confirmStatus" role="status"></p>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" type="button" data-close-modal>Cancel</button>
      <button class="btn btn-danger" type="button" id="confirmActionButton">${esc(label)}</button>
    </div>
  `, { label: title });
  $('#confirmActionButton')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const status = $('#confirmStatus');
    button.disabled = true;
    button.textContent = 'Working…';
    try {
      await onConfirm();
      closeModal();
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
      button.textContent = label;
    }
  });
}

function bindInventory() {
  $('#adminInventorySearch')?.addEventListener('input', (event) => {
    ui.inventory.q = event.target.value;
    ui.inventory.page = 1;
    paintInventory();
  });
  for (const [id, key] of [['adminInventoryBrand', 'brand'], ['adminInventoryCategory', 'category'], ['adminInventoryStock', 'stock'], ['adminInventorySort', 'sort']]) {
    $(`#${id}`)?.addEventListener('change', (event) => {
      ui.inventory[key] = event.target.value;
      ui.inventory.page = 1;
      paintInventory();
    });
  }
  $('#adminInventoryReset')?.addEventListener('click', () => {
    ui.inventory = { q: '', brand: 'all', category: 'all', stock: 'all', sort: 'newest', page: 1 };
    route({ silent: true });
  });
  $('#adminAddVehicle')?.addEventListener('click', () => openVehicleForm());
  $('#adminInventoryResults')?.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-vehicle]');
    if (edit) {
      const vehicle = adminState.vehicles.find((item) => String(item.id) === String(edit.dataset.editVehicle));
      if (vehicle) openVehicleForm(vehicle);
      return;
    }
    const remove = event.target.closest('[data-delete-vehicle]');
    if (remove) {
      const vehicle = adminState.vehicles.find((item) => String(item.id) === String(remove.dataset.deleteVehicle));
      if (!vehicle) return;
      confirmAction({
        title: 'Remove this vehicle?',
        text: `This permanently removes <strong>${esc(vehicleName(vehicle))}</strong> from the showroom. Reservations already placed retain their snapshot.`,
        label: 'Remove vehicle',
        onConfirm: async () => {
          const result = await api(`/api/admin/vehicles/${vehicle.id}`, { method: 'DELETE' });
          toast(result.message || 'Vehicle removed.', 'success');
          await route({ silent: true });
        }
      });
      return;
    }
    const page = event.target.closest('[data-page][data-pager="inventory"]');
    if (page && !page.disabled) {
      ui.inventory.page = Number(page.dataset.page);
      paintInventory();
      $('#adminInventoryResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

async function loadInventory() {
  const [vehicleData, brandData] = await Promise.all([
    api('/api/admin/vehicles'),
    api('/api/admin/brands')
  ]);
  adminState.vehicles = vehicleData.vehicles || [];
  adminState.brands = brandData.brands || [];
  return { html: inventoryMarkup(), mount: bindInventory };
}

function filteredBrands() {
  const query = ui.brands.q.trim().toLowerCase();
  return adminState.brands.filter((brand) => !query || [brand.name, brand.country, brand.tagline].join(' ').toLowerCase().includes(query));
}

function brandResultsMarkup() {
  const brands = filteredBrands();
  if (!brands.length) return emptyMarkup('tag', 'No marques found', 'Adjust your search or add a new marque to the directory.');
  return `<div class="admin-table-scroll"><table class="admin-table">
    <thead><tr><th>Marque</th><th>Country</th><th>Vehicles</th><th>Stock</th><th>Inventory value</th><th class="admin-col-actions">Actions</th></tr></thead>
    <tbody>${brands.map((brand) => `<tr>
      <td><div class="admin-vehicle-cell"><span class="admin-monogram" style="--brand:${safeHex(brand.logo_color, '#D8AA5B')}">${esc(initials(brand.name))}</span><div><strong>${esc(brand.name)}</strong><span class="admin-table-sub">${esc(brand.tagline || 'No tagline')}</span></div></div></td>
      <td>${esc(brand.country)}</td>
      <td><strong>${number(brand.vehicles)}</strong></td>
      <td>${number(brand.stock)}</td>
      <td class="admin-price">${compactMoney(brand.inventory_value)}</td>
      <td class="admin-cell-actions"><button class="admin-icon-btn" type="button" data-edit-brand="${brand.id}" aria-label="Edit marque">${icon('edit')}</button><button class="admin-icon-btn danger" type="button" data-delete-brand="${brand.id}" aria-label="Delete marque">${icon('trash')}</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function paintBrands() {
  const results = $('#adminBrandResults');
  if (results) results.innerHTML = brandResultsMarkup();
  const count = $('#adminBrandCount');
  if (count) count.textContent = `${number(filteredBrands().length)} marques`;
}

function brandsMarkup() {
  return `<div class="admin-intro">
    <div><span class="eyebrow">The marques</span><h1>A world of <em>makers.</em></h1><p>The marques represented in the showroom, their inventory footprint and the countries that shaped them.</p></div>
    <div class="admin-intro-actions"><span class="admin-count" id="adminBrandCount">${number(filteredBrands().length)} marques</span><button class="btn btn-gold btn-sm" type="button" id="adminAddBrand">${icon('plus')} Add marque</button></div>
  </div>
  <div class="admin-toolbar"><div class="admin-toolbar-left"><div class="admin-search">${icon('search')}<input id="adminBrandSearch" type="search" placeholder="Search marque or country…" value="${esc(ui.brands.q)}"></div></div><div class="admin-toolbar-right"><button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Refresh</button></div></div>
  <section class="admin-panel"><div class="admin-panel-body flush" id="adminBrandResults">${brandResultsMarkup()}</div></section>`;
}

function openBrandForm(brand = null) {
  const editing = Boolean(brand);
  const item = brand || { name: '', country: '', logo_color: '#D8AA5B', tagline: '' };
  openModal(`
    <div class="modal-head">
      <div><h2>${editing ? 'Edit marque' : 'Add marque'}</h2><p>${editing ? esc(item.name) : 'Introduce a new manufacturer to the showroom.'}</p></div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      <form id="brandForm">
        <div class="admin-form-grid">
          <div class="field"><label for="brandName">Marque name</label><input id="brandName" name="name" type="text" maxlength="60" value="${esc(item.name)}" required></div>
          <div class="field"><label for="brandCountry">Country of origin</label><input id="brandCountry" name="country" type="text" maxlength="60" value="${esc(item.country)}" required></div>
          <div class="field"><label for="brandColor">Brand colour</label><input id="brandColor" name="logo_color" type="color" value="${safeHex(item.logo_color, '#D8AA5B')}" required></div>
          <div class="field"><label for="brandTagline">Tagline (optional)</label><input id="brandTagline" name="tagline" type="text" maxlength="120" value="${esc(item.tagline || '')}" placeholder="A short line about the marque"></div>
        </div>
        <p class="admin-form-note">A marque must be empty of vehicles before it can be deleted. ${editing ? `This marque currently has ${number(brand.vehicles)} vehicle${Number(brand.vehicles) === 1 ? '' : 's'}.` : ''}</p>
        <p class="admin-form-status" id="brandFormStatus" role="status"></p>
      </form>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" type="button" data-close-modal>Cancel</button>
      <button class="btn btn-gold" type="submit" form="brandForm" id="brandFormSubmit">${editing ? 'Save marque' : 'Add marque'}</button>
    </div>
  `, { label: editing ? 'Edit marque' : 'Add marque' });

  $('#brandForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const status = $('#brandFormStatus');
    const button = $('#brandFormSubmit');
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      country: String(data.get('country') || '').trim(),
      logo_color: String(data.get('logo_color')),
      tagline: String(data.get('tagline') || '').trim()
    };
    status.textContent = '';
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      const result = await api(editing ? `/api/admin/brands/${brand.id}` : '/api/admin/brands', {
        method: editing ? 'PUT' : 'POST',
        body: payload
      });
      toast(result.message || 'Marque saved.', 'success');
      closeModal();
      await route({ silent: true });
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
      button.textContent = editing ? 'Save marque' : 'Add marque';
    }
  });
}

function bindBrands() {
  $('#adminBrandSearch')?.addEventListener('input', (event) => {
    ui.brands.q = event.target.value;
    paintBrands();
  });
  $('#adminAddBrand')?.addEventListener('click', () => openBrandForm());
  $('#adminBrandResults')?.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-brand]');
    if (edit) {
      const brand = adminState.brands.find((item) => String(item.id) === String(edit.dataset.editBrand));
      if (brand) openBrandForm(brand);
      return;
    }
    const remove = event.target.closest('[data-delete-brand]');
    if (!remove) return;
    const brand = adminState.brands.find((item) => String(item.id) === String(remove.dataset.deleteBrand));
    if (!brand) return;
    confirmAction({
      title: 'Remove this marque?',
      text: Number(brand.vehicles) > 0
        ? `<strong>${esc(brand.name)}</strong> still has ${number(brand.vehicles)} vehicles. Move or remove them before deleting the marque.`
        : `This permanently removes <strong>${esc(brand.name)}</strong> from the marque directory.`,
      label: 'Remove marque',
      onConfirm: async () => {
        const result = await api(`/api/admin/brands/${brand.id}`, { method: 'DELETE' });
        toast(result.message || 'Marque removed.', 'success');
        await route({ silent: true });
      }
    });
  });
}

async function loadBrands() {
  const data = await api('/api/admin/brands');
  adminState.brands = data.brands || [];
  return { html: brandsMarkup(), mount: bindBrands };
}

function filteredOrders() {
  const query = ui.orders.q.trim().toLowerCase();
  return adminState.ordersCache.filter((order) => {
    if (ui.orders.status !== 'all' && order.status !== ui.orders.status) return false;
    if (!query) return true;
    return [order.id, order.vehicle_snapshot, order.customer_name, order.customer_email, order.type, order.notes]
      .join(' ').toLowerCase().includes(query);
  });
}

adminState.ordersCache = [];

function orderResultsMarkup() {
  const orders = filteredOrders();
  if (!orders.length) return emptyMarkup('key', 'No reservations found', 'Adjust the filters or wait for the next client reservation.');
  return `<div class="admin-table-scroll"><table class="admin-table">
    <thead><tr><th>Order</th><th>Vehicle</th><th>Client</th><th>Value</th><th>Status</th><th class="admin-col-actions">Details</th></tr></thead>
    <tbody>${orders.map((order) => `<tr>
      <td class="admin-nowrap"><strong>#${String(order.id).padStart(5, '0')}</strong><span class="admin-table-sub">${formatDate(order.created_at)}</span></td>
      <td class="admin-col-vehicle"><strong>${esc(order.vehicle_snapshot)}</strong><span class="admin-table-sub">${esc(order.type || 'reservation')}</span></td>
      <td class="admin-col-customer">${esc(order.customer_name || 'Guest')}<span class="admin-table-sub">${esc(order.customer_email || 'No email')}</span></td>
      <td class="admin-price">${money(order.total)}<small>Deposit ${money(order.deposit)}</small></td>
      <td>${statusSelect('order', order.id, order.status, ORDER_STATUSES)}</td>
      <td class="admin-cell-actions"><button class="admin-icon-btn" type="button" data-order-view="${order.id}" aria-label="View reservation">${icon('eye')}</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function paintOrders() {
  const results = $('#adminOrderResults');
  if (results) results.innerHTML = orderResultsMarkup();
  const count = $('#adminOrderCount');
  if (count) count.textContent = `${number(filteredOrders().length)} reservations`;
}

function ordersMarkup() {
  return `<div class="admin-intro">
    <div><span class="eyebrow">Reservation desk</span><h1>Every handover, <em>in motion.</em></h1><p>Review deposits, client details and the progress of every reservation from first hold to completed delivery.</p></div>
    <div class="admin-intro-actions"><span class="admin-count" id="adminOrderCount">${number(filteredOrders().length)} reservations</span><button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Refresh</button></div>
  </div>
  <div class="admin-toolbar">
    <div class="admin-toolbar-left"><div class="admin-search">${icon('search')}<input id="adminOrderSearch" type="search" placeholder="Search client, vehicle or order…" value="${esc(ui.orders.q)}"></div><select class="admin-select" id="adminOrderStatus" aria-label="Filter reservations"><option value="all">All statuses</option>${ORDER_STATUSES.map((status) => option(status, status, ui.orders.status)).join('')}</select></div>
    <div class="admin-toolbar-right"><button class="btn btn-outline btn-sm" type="button" id="adminOrdersReset">${icon('refresh')} Reset</button></div>
  </div>
  <section class="admin-panel"><div class="admin-panel-body flush" id="adminOrderResults">${orderResultsMarkup()}</div></section>`;
}

function openOrderDetails(order) {
  openModal(`
    <div class="modal-head">
      <div><h2>Reservation #${String(order.id).padStart(5, '0')}</h2><p>${esc(order.vehicle_snapshot)}</p></div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      <div class="admin-detail-grid">
        <div class="admin-detail-item"><span>Client</span><strong>${esc(order.customer_name || 'Guest')}</strong></div>
        <div class="admin-detail-item"><span>Status</span><strong>${adminStatusChip(order.status)}</strong></div>
        <div class="admin-detail-item"><span>Email</span><strong>${esc(order.customer_email || '—')}</strong></div>
        <div class="admin-detail-item"><span>Telephone</span><strong>${esc(order.customer_phone || '—')}</strong></div>
        <div class="admin-detail-item"><span>Vehicle value</span><strong>${money(order.total)}</strong></div>
        <div class="admin-detail-item"><span>Deposit</span><strong>${money(order.deposit)}</strong></div>
        <div class="admin-detail-item"><span>Created</span><strong>${formatDateTime(order.created_at)}</strong></div>
        <div class="admin-detail-item"><span>Last updated</span><strong>${formatDateTime(order.updated_at)}</strong></div>
      </div>
      <div class="admin-detail-note">${order.notes ? esc(order.notes) : 'No notes were left with this reservation.'}</div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" type="button" data-close-modal>Close</button>
      ${order.vehicle_id ? `<a class="btn btn-gold" href="/#/vehicle/${order.vehicle_id}" target="_blank" rel="noopener">View vehicle</a>` : ''}
    </div>
  `, { label: `Reservation ${order.id}` });
}

async function updateOrderStatus(order, select) {
  const previous = order.status;
  const next = select.value;
  if (next === previous) return;
  const apply = async () => {
    select.disabled = true;
    try {
      const result = await api(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status: next } });
      toast(result.message || 'Reservation updated.', 'success');
      await route({ silent: true });
    } catch (error) {
      select.value = previous;
      select.className = `admin-status-select status-${previous}`;
      select.disabled = false;
      toast(error.message, 'error');
      throw error;
    }
  };
  if (next === 'cancelled') {
    select.value = previous;
    confirmAction({
      title: 'Cancel this reservation?',
      text: `Cancelling <strong>${esc(order.vehicle_snapshot)}</strong> will release the vehicle back into available stock.`,
      label: 'Cancel reservation',
      onConfirm: apply
    });
  } else {
    try {
      await apply();
    } catch {
      return;
    }
  }
}

function bindOrders() {
  $('#adminOrderSearch')?.addEventListener('input', (event) => {
    ui.orders.q = event.target.value;
    paintOrders();
  });
  $('#adminOrderStatus')?.addEventListener('change', (event) => {
    ui.orders.status = event.target.value;
    paintOrders();
  });
  $('#adminOrdersReset')?.addEventListener('click', () => {
    ui.orders = { q: '', status: 'all' };
    route({ silent: true });
  });
  $('#adminOrderResults')?.addEventListener('click', (event) => {
    const view = event.target.closest('[data-order-view]');
    if (view) {
      const order = adminState.ordersCache.find((item) => String(item.id) === String(view.dataset.orderView));
      if (order) openOrderDetails(order);
    }
  });
  $('#adminOrderResults')?.addEventListener('change', (event) => {
    const select = event.target.closest('[data-order-id]');
    if (!select) return;
    const order = adminState.ordersCache.find((item) => String(item.id) === String(select.dataset.orderId));
    if (order) updateOrderStatus(order, select);
  });
}

async function loadOrders() {
  const data = await api('/api/admin/orders');
  adminState.ordersCache = data.orders || [];
  return { html: ordersMarkup(), mount: bindOrders };
}

adminState.drivesCache = [];

function filteredDrives() {
  const query = ui.drives.q.trim().toLowerCase();
  return adminState.drivesCache.filter((drive) => {
    if (ui.drives.status !== 'all' && drive.status !== ui.drives.status) return false;
    if (!query) return true;
    return [drive.id, drive.vehicle_snapshot, drive.name, drive.email, drive.phone, drive.notes]
      .join(' ').toLowerCase().includes(query);
  });
}

function driveResultsMarkup() {
  const drives = filteredDrives();
  if (!drives.length) return emptyMarkup('calendar', 'No test drives found', 'Adjust the filters or wait for a new appointment request.');
  return `<div class="admin-table-scroll"><table class="admin-table">
    <thead><tr><th>Appointment</th><th>Vehicle</th><th>Client</th><th>Contact</th><th>Status</th><th class="admin-col-actions">Details</th></tr></thead>
    <tbody>${drives.map((drive) => `<tr>
      <td class="admin-nowrap"><strong>${formatDate(drive.preferred_date)}</strong><span class="admin-table-sub">${formatTime(drive.preferred_time)}</span></td>
      <td class="admin-col-vehicle"><strong>${esc(drive.vehicle_snapshot)}</strong><span class="admin-table-sub">TD-${String(drive.id).padStart(5, '0')}</span></td>
      <td class="admin-col-customer">${esc(drive.name)}<span class="admin-table-sub">${esc(drive.email)}</span></td>
      <td><a class="admin-contact" href="tel:${esc(String(drive.phone).replace(/[^\d+]/g, ''))}">${esc(drive.phone)}</a><a class="admin-contact admin-table-sub" href="mailto:${esc(drive.email)}">${esc(drive.email)}</a></td>
      <td>${statusSelect('drive', drive.id, drive.status, DRIVE_STATUSES)}</td>
      <td class="admin-cell-actions"><button class="admin-icon-btn" type="button" data-drive-view="${drive.id}" aria-label="View test drive">${icon('eye')}</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function paintDrives() {
  const results = $('#adminDriveResults');
  if (results) results.innerHTML = driveResultsMarkup();
  const count = $('#adminDriveCount');
  if (count) count.textContent = `${number(filteredDrives().length)} appointments`;
}

function drivesMarkup() {
  return `<div class="admin-intro">
    <div><span class="eyebrow">Private appointments</span><h1>Time behind <em>the wheel.</em></h1><p>Coordinate the test drives that turn curiosity into a handover. Confirm, complete or cancel each appointment as it progresses.</p></div>
    <div class="admin-intro-actions"><span class="admin-count" id="adminDriveCount">${number(filteredDrives().length)} appointments</span><button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Refresh</button></div>
  </div>
  <div class="admin-toolbar">
    <div class="admin-toolbar-left"><div class="admin-search">${icon('search')}<input id="adminDriveSearch" type="search" placeholder="Search client, vehicle or phone…" value="${esc(ui.drives.q)}"></div><select class="admin-select" id="adminDriveStatus" aria-label="Filter test drives"><option value="all">All statuses</option>${DRIVE_STATUSES.map((status) => option(status, status, ui.drives.status)).join('')}</select></div>
    <div class="admin-toolbar-right"><button class="btn btn-outline btn-sm" type="button" id="adminDrivesReset">${icon('refresh')} Reset</button></div>
  </div>
  <section class="admin-panel"><div class="admin-panel-body flush" id="adminDriveResults">${driveResultsMarkup()}</div></section>`;
}

function openDriveDetails(drive) {
  openModal(`
    <div class="modal-head">
      <div><h2>Test drive TD-${String(drive.id).padStart(5, '0')}</h2><p>${esc(drive.vehicle_snapshot)}</p></div>
      <button class="modal-close" type="button" data-close-modal aria-label="Close">${icon('close')}</button>
    </div>
    <div class="modal-body">
      <div class="admin-detail-grid">
        <div class="admin-detail-item"><span>Client</span><strong>${esc(drive.name)}</strong></div>
        <div class="admin-detail-item"><span>Status</span><strong>${adminStatusChip(drive.status)}</strong></div>
        <div class="admin-detail-item"><span>Preferred date</span><strong>${formatDate(drive.preferred_date)}</strong></div>
        <div class="admin-detail-item"><span>Preferred time</span><strong>${formatTime(drive.preferred_time)}</strong></div>
        <div class="admin-detail-item"><span>Email</span><strong>${esc(drive.email)}</strong></div>
        <div class="admin-detail-item"><span>Telephone</span><strong>${esc(drive.phone)}</strong></div>
      </div>
      <div class="admin-detail-note">${drive.notes ? esc(drive.notes) : 'No additional notes for this appointment.'}</div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" type="button" data-close-modal>Close</button>
      ${drive.vehicle_id ? `<a class="btn btn-gold" href="/#/vehicle/${drive.vehicle_id}" target="_blank" rel="noopener">View vehicle</a>` : ''}
    </div>
  `, { label: `Test drive ${drive.id}` });
}

async function updateDriveStatus(drive, select) {
  const previous = drive.status;
  const next = select.value;
  if (next === previous) return;
  select.disabled = true;
  try {
    const result = await api(`/api/admin/test-drives/${drive.id}`, { method: 'PATCH', body: { status: next } });
    toast(result.message || 'Test drive updated.', 'success');
    await route({ silent: true });
  } catch (error) {
    select.value = previous;
    select.className = `admin-status-select status-${previous}`;
    select.disabled = false;
    toast(error.message, 'error');
  }
}

function bindDrives() {
  $('#adminDriveSearch')?.addEventListener('input', (event) => {
    ui.drives.q = event.target.value;
    paintDrives();
  });
  $('#adminDriveStatus')?.addEventListener('change', (event) => {
    ui.drives.status = event.target.value;
    paintDrives();
  });
  $('#adminDrivesReset')?.addEventListener('click', () => {
    ui.drives = { q: '', status: 'all' };
    route({ silent: true });
  });
  $('#adminDriveResults')?.addEventListener('click', (event) => {
    const view = event.target.closest('[data-drive-view]');
    if (!view) return;
    const drive = adminState.drivesCache.find((item) => String(item.id) === String(view.dataset.driveView));
    if (drive) openDriveDetails(drive);
  });
  $('#adminDriveResults')?.addEventListener('change', (event) => {
    const select = event.target.closest('[data-drive-id]');
    if (!select) return;
    const drive = adminState.drivesCache.find((item) => String(item.id) === String(select.dataset.driveId));
    if (drive) updateDriveStatus(drive, select);
  });
}

async function loadDrives() {
  const data = await api('/api/admin/test-drives');
  adminState.drivesCache = data.testDrives || [];
  return { html: drivesMarkup(), mount: bindDrives };
}

adminState.usersCache = [];

function filteredCustomers() {
  const query = ui.customers.q.trim().toLowerCase();
  return adminState.usersCache.filter((user) => !query || [user.name, user.email, user.phone, user.username, user.role].join(' ').toLowerCase().includes(query));
}

function customerResultsMarkup() {
  const users = filteredCustomers();
  if (!users.length) return emptyMarkup('users', 'No customers found', 'Adjust your search to find a client account.');
  return `<div class="admin-table-scroll"><table class="admin-table">
    <thead><tr><th>Client</th><th>Contact</th><th>Activity</th><th>Joined</th><th>Access</th><th class="admin-col-actions">Role</th></tr></thead>
    <tbody>${users.map((user) => {
      const self = user.id === adminState.user.id;
      return `<tr>
        <td><div class="admin-vehicle-cell"><span class="avatar">${esc(initials(user.name))}</span><div><strong>${esc(user.name)}</strong><span class="admin-table-sub">${esc(user.username ? `@${user.username}` : user.email)}</span></div></div></td>
        <td><a class="admin-contact" href="mailto:${esc(user.email)}">${esc(user.email)}</a><span class="admin-contact admin-table-sub">${esc(user.phone || 'No telephone')}</span></td>
        <td><strong>${number(user.orders)}</strong> reservations<span class="admin-table-sub">${number(user.favorites)} saved · ${number(user.test_drives)} drives</span></td>
        <td class="admin-nowrap">${formatDate(user.created_at)}</td>
        <td>${user.role === 'admin' ? '<span class="admin-tag gold">Administrator</span>' : '<span class="admin-tag green">Client</span>'}</td>
        <td class="admin-cell-actions">${self ? '<span class="admin-tag">You</span>' : `<button class="admin-icon-btn" type="button" data-user-role="${user.id}" aria-label="${user.role === 'admin' ? 'Remove admin access' : 'Grant admin access'}">${icon(user.role === 'admin' ? 'user' : 'shield')}</button>`}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function paintCustomers() {
  const results = $('#adminCustomerResults');
  if (results) results.innerHTML = customerResultsMarkup();
  const count = $('#adminCustomerCount');
  if (count) count.textContent = `${number(filteredCustomers().length)} accounts`;
}

function customersMarkup() {
  return `<div class="admin-intro">
    <div><span class="eyebrow">Client relationships</span><h1>The people behind <em>the keys.</em></h1><p>Every registered client, their activity with the showroom and the level of access they hold.</p></div>
    <div class="admin-intro-actions"><span class="admin-count" id="adminCustomerCount">${number(filteredCustomers().length)} accounts</span><button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Refresh</button></div>
  </div>
  <div class="admin-toolbar"><div class="admin-toolbar-left"><div class="admin-search">${icon('search')}<input id="adminCustomerSearch" type="search" placeholder="Search name, email or phone…" value="${esc(ui.customers.q)}"></div></div></div>
  <section class="admin-panel"><div class="admin-panel-body flush" id="adminCustomerResults">${customerResultsMarkup()}</div></section>`;
}

function bindCustomers() {
  $('#adminCustomerSearch')?.addEventListener('input', (event) => {
    ui.customers.q = event.target.value;
    paintCustomers();
  });
  $('#adminCustomerResults')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-user-role]');
    if (!button) return;
    const user = adminState.usersCache.find((item) => String(item.id) === String(button.dataset.userRole));
    if (!user) return;
    const next = user.role === 'admin' ? 'customer' : 'admin';
    confirmAction({
      title: next === 'admin' ? 'Grant admin access?' : 'Remove admin access?',
      text: next === 'admin'
        ? `<strong>${esc(user.name)}</strong> will be able to enter the admin workspace and manage all showroom data.`
        : `<strong>${esc(user.name)}</strong> will lose access to the admin workspace and return to a client account.`,
      label: next === 'admin' ? 'Grant access' : 'Remove access',
      onConfirm: async () => {
        const result = await api(`/api/admin/users/${user.id}`, { method: 'PATCH', body: { role: next } });
        toast(result.message || 'Account access updated.', 'success');
        await route({ silent: true });
      }
    });
  });
}

async function loadCustomers() {
  const data = await api('/api/admin/users');
  adminState.usersCache = data.users || [];
  return { html: customersMarkup(), mount: bindCustomers };
}

adminState.messagesCache = [];

function filteredMessages() {
  const query = ui.messages.q.trim().toLowerCase();
  return adminState.messagesCache.filter((message) => {
    if (ui.messages.status !== 'all' && message.status !== ui.messages.status) return false;
    if (!query) return true;
    return [message.name, message.email, message.subject, message.message, message.phone]
      .join(' ').toLowerCase().includes(query);
  });
}

async function setMessageStatus(message, status) {
  try {
    const result = await api(`/api/admin/messages/${message.id}`, { method: 'PATCH', body: { status } });
    toast(result.message || 'Message updated.', 'success');
    await route({ silent: true });
  } catch (error) {
    toast(error.message, 'error');
  }
}

function messageResultsMarkup() {
  const messages = filteredMessages();
  if (!messages.length) return emptyMarkup('inbox', 'No messages found', 'Adjust the filters or wait for a new client enquiry.');
  return `<div class="admin-messages">${messages.map((message) => `<article class="message-card${message.status === 'new' ? ' unread' : ''}">
    <div class="message-head">
      <div class="message-sender"><span class="message-avatar">${esc(initials(message.name))}</span><div><strong>${esc(message.name)}</strong><span>${esc(message.email)} · ${formatDateTime(message.created_at)}</span></div></div>
      ${adminStatusChip(message.status)}
    </div>
    <h3 class="message-subject">${esc(message.subject)}</h3>
    <p class="message-body">${esc(message.message)}</p>
    <div class="message-actions">
      <a href="mailto:${esc(message.email)}">${icon('mail')} Reply by email</a>
      ${message.phone ? `<a href="tel:${esc(String(message.phone).replace(/[^\d+]/g, ''))}">${icon('phone')} ${esc(message.phone)}</a>` : ''}
      <span class="admin-spacer"></span>
      ${message.status === 'new' ? `<button class="admin-link-btn" type="button" data-message-id="${message.id}" data-message-status="read">Mark as read</button>` : ''}
      ${message.status !== 'resolved' ? `<button class="admin-link-btn" type="button" data-message-id="${message.id}" data-message-status="resolved">Mark resolved</button>` : `<button class="admin-link-btn" type="button" data-message-id="${message.id}" data-message-status="new">Reopen</button>`}
    </div>
  </article>`).join('')}</div>`;
}

function paintMessages() {
  const results = $('#adminMessageResults');
  if (results) results.innerHTML = messageResultsMarkup();
  const count = $('#adminMessageCount');
  if (count) count.textContent = `${number(filteredMessages().length)} messages`;
}

function messagesMarkup() {
  return `<div class="admin-intro">
    <div><span class="eyebrow">Client inbox</span><h1>Conversations worth <em>having.</em></h1><p>Every enquiry from the showroom floor, centrally collected and ready for a considered reply.</p></div>
    <div class="admin-intro-actions"><span class="admin-count" id="adminMessageCount">${number(filteredMessages().length)} messages</span><button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Refresh</button></div>
  </div>
  <div class="admin-toolbar">
    <div class="admin-toolbar-left"><div class="admin-search">${icon('search')}<input id="adminMessageSearch" type="search" placeholder="Search sender, subject or message…" value="${esc(ui.messages.q)}"></div><select class="admin-select" id="adminMessageStatus" aria-label="Filter messages"><option value="all">All statuses</option>${MESSAGE_STATUSES.map((status) => option(status, status, ui.messages.status)).join('')}</select></div>
  </div>
  <div id="adminMessageResults">${messageResultsMarkup()}</div>`;
}

function bindMessages() {
  $('#adminMessageSearch')?.addEventListener('input', (event) => {
    ui.messages.q = event.target.value;
    paintMessages();
  });
  $('#adminMessageStatus')?.addEventListener('change', (event) => {
    ui.messages.status = event.target.value;
    paintMessages();
  });
  $('#adminMessageResults')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-message-id][data-message-status]');
    if (!button) return;
    const message = adminState.messagesCache.find((item) => String(item.id) === String(button.dataset.messageId));
    if (message) setMessageStatus(message, button.dataset.messageStatus);
  });
}

async function loadMessages() {
  const data = await api('/api/admin/messages');
  adminState.messagesCache = data.messages || [];
  return { html: messagesMarkup(), mount: bindMessages };
}

adminState.subscribersCache = [];

function filteredSubscribers() {
  const query = ui.subscribers.q.trim().toLowerCase();
  return adminState.subscribersCache.filter((subscriber) => !query || subscriber.email.toLowerCase().includes(query));
}

function subscriberResultsMarkup() {
  const subscribers = filteredSubscribers();
  if (!subscribers.length) return emptyMarkup('mail', 'No subscribers found', 'Adjust the search or wait for new first-access signups.');
  return `<div class="admin-table-scroll"><table class="admin-table">
    <thead><tr><th>Email address</th><th>Subscriber since</th><th>Source</th></tr></thead>
    <tbody>${subscribers.map((subscriber) => `<tr>
      <td><a class="admin-contact" href="mailto:${esc(subscriber.email)}">${esc(subscriber.email)}</a></td>
      <td class="admin-nowrap">${formatDateTime(subscriber.created_at)}</td>
      <td><span class="admin-tag">Storefront newsletter</span></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function paintSubscribers() {
  const results = $('#adminSubscriberResults');
  if (results) results.innerHTML = subscriberResultsMarkup();
  const count = $('#adminSubscriberCount');
  if (count) count.textContent = `${number(filteredSubscribers().length)} subscribers`;
}

function subscribersMarkup() {
  return `<div class="admin-intro">
    <div><span class="eyebrow">First access</span><h1>The audience for <em>what is next.</em></h1><p>Collectors and enthusiasts who have asked to hear about new arrivals, private events and exceptional machines.</p></div>
    <div class="admin-intro-actions"><span class="admin-count" id="adminSubscriberCount">${number(filteredSubscribers().length)} subscribers</span><button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Refresh</button></div>
  </div>
  <div class="admin-toolbar"><div class="admin-toolbar-left"><div class="admin-search">${icon('search')}<input id="adminSubscriberSearch" type="search" placeholder="Search email address…" value="${esc(ui.subscribers.q)}"></div></div></div>
  <section class="admin-panel"><div class="admin-panel-body flush" id="adminSubscriberResults">${subscriberResultsMarkup()}</div></section>`;
}

function bindSubscribers() {
  $('#adminSubscriberSearch')?.addEventListener('input', (event) => {
    ui.subscribers.q = event.target.value;
    paintSubscribers();
  });
}

async function loadSubscribers() {
  const data = await api('/api/admin/newsletter');
  adminState.subscribersCache = data.subscribers || [];
  return { html: subscribersMarkup(), mount: bindSubscribers };
}

function settingsMarkup(settings) {
  return `<div class="admin-intro">
    <div><span class="eyebrow">Showroom identity</span><h1>The details clients <em>remember.</em></h1><p>These details flow through the storefront footer, contact pages and every communication from the showroom.</p></div>
    <div class="admin-intro-actions"><button class="btn btn-outline btn-sm" type="button" data-refresh>${icon('refresh')} Reload</button></div>
  </div>
  <div class="admin-settings-layout">
    <section class="admin-settings-card">
      <h3>Showroom details</h3>
      <p>Public contact information and the announcement shown above the storefront navigation.</p>
      <form id="adminSettingsForm">
        <div class="admin-form-grid">
          <div class="field"><label for="settingName">Showroom name</label><input id="settingName" name="showroom_name" type="text" maxlength="120" value="${esc(settings.showroom_name || '')}" required></div>
          <div class="field"><label for="settingPhone">Telephone</label><input id="settingPhone" name="phone" type="tel" maxlength="60" value="${esc(settings.phone || '')}" required></div>
          <div class="field full"><label for="settingTagline">Tagline</label><input id="settingTagline" name="tagline" type="text" maxlength="240" value="${esc(settings.tagline || '')}" required></div>
          <div class="field"><label for="settingEmail">Email</label><input id="settingEmail" name="email" type="email" maxlength="160" value="${esc(settings.email || '')}" required></div>
          <div class="field"><label for="settingHours">Opening hours</label><input id="settingHours" name="hours" type="text" maxlength="160" value="${esc(settings.hours || '')}"></div>
          <div class="field full"><label for="settingAddress">Address</label><input id="settingAddress" name="address" type="text" maxlength="240" value="${esc(settings.address || '')}"></div>
          <div class="field full"><label for="settingAnnouncement">Announcement bar</label><textarea id="settingAnnouncement" name="announcement" maxlength="300" placeholder="Leave blank to hide the announcement bar">${esc(settings.announcement || '')}</textarea></div>
        </div>
        <p class="admin-form-note">Changes are published to the storefront immediately after saving.</p>
        <p class="admin-form-status" id="settingsStatus" role="status"></p>
        <div class="admin-toolbar" style="margin:16px 0 0"><div class="admin-toolbar-right"><button class="btn btn-gold" type="submit" id="settingsSubmit">${icon('check')} Save settings</button></div></div>
      </form>
    </section>
    <aside class="admin-settings-card">
      <h3>Administrator</h3>
      <p>Your active account and the access attached to it.</p>
      <div class="admin-credential">${icon('user')}<div><strong>${esc(adminState.user.name)}</strong><br>${esc(adminState.user.email)}</div></div>
      <div class="admin-credential">${icon('lock')}<div>Role: <strong>Administrator</strong><br>Username: <strong>${esc(adminState.user.username || '—')}</strong></div></div>
      <p class="admin-form-note">Sessions expire automatically after seven days. Use a private browser session when working on a shared device.</p>
      <a class="btn btn-outline btn-sm" style="margin-top:16px" href="/" target="_blank" rel="noopener">${icon('external')} Open storefront</a>
    </aside>
  </div>`;
}

function bindSettings() {
  $('#adminSettingsForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const status = $('#settingsStatus');
    const button = $('#settingsSubmit');
    const data = new FormData(form);
    const payload = Object.fromEntries(['showroom_name', 'tagline', 'phone', 'email', 'address', 'hours', 'announcement'].map((key) => [key, String(data.get(key) || '')]));
    status.textContent = '';
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      const result = await api('/api/admin/settings', { method: 'PUT', body: payload });
      status.className = 'admin-form-status success';
      status.textContent = result.message || 'Showroom settings saved.';
      toast('Showroom settings saved.', 'success');
    } catch (error) {
      status.className = 'admin-form-status';
      status.textContent = error.message;
    } finally {
      button.disabled = false;
      button.innerHTML = `${icon('check')} Save settings`;
    }
  });
}

async function loadSettings() {
  const data = await api('/api/admin/settings');
  return { html: settingsMarkup(data.settings || {}), mount: bindSettings };
}

const LOADERS = {
  overview: loadOverview,
  inventory: loadInventory,
  brands: loadBrands,
  orders: loadOrders,
  drives: loadDrives,
  customers: loadCustomers,
  messages: loadMessages,
  subscribers: loadSubscribers,
  settings: loadSettings
};

window.addEventListener('hashchange', () => {
  if (adminState.user) route();
});

async function boot() {
  try {
    const data = await api('/api/me');
    if (data.user?.role === 'admin') {
      adminState.user = data.user;
      if (!window.location.hash) history.replaceState(null, '', '#/overview');
      initShell();
      await route();
    } else {
      renderLogin(data.user ? 'Administrator access is required for this workspace.' : '');
    }
  } catch (error) {
    renderLogin(error.message || 'The admin workspace could not be reached. Please try again.');
  }
}

boot();
