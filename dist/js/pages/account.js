import {
  state, api, esc, money, number, formatDate, formatTime, initials, icon,
  carArt, vehicleCard, toast
} from '../utils.js';
import {
  paint, statusChip, vehicleSnapshot, emptyStateMarkup
} from './shared.js';

const TABS = [
  ['orders', 'Reservations', 'key'],
  ['drives', 'Test drives', 'calendar'],
  ['garage', 'My garage', 'heart'],
  ['profile', 'Profile', 'user']
];

function orderRow(order) {
  const car = vehicleSnapshot(order, {
    category: order.category || 'Sedan',
    brand_name: order.brand_name || 'AniissAuto',
    model: order.model || '',
    variant: order.variant || '',
    year: order.year || '',
    color_hex: order.color_hex || '#7C8288',
    logo_color: order.logo_color || '#D8AA5B'
  });
  const content = `<span class="order-art">${carArt(car, 'thumb')}</span>
    <div class="order-main">
      <h3>${esc(order.vehicle_snapshot)}</h3>
      <p>Reservation #${String(order.id).padStart(5, '0')} · ${formatDate(order.created_at)}</p>
      <div class="order-meta">
        ${statusChip(order.status)}
        <span>Deposit ${money(order.deposit)}</span>
        <span>${esc(order.type || 'reservation')}</span>
      </div>
    </div>
    <div class="order-side"><strong>${money(order.total)}</strong><span>Vehicle price</span></div>`;
  return order.vehicle_id
    ? `<a class="order-row" href="#/vehicle/${order.vehicle_id}">${content}</a>`
    : `<div class="order-row">${content}</div>`;
}

function driveRow(drive) {
  const car = vehicleSnapshot(drive, {
    category: drive.category || 'Sedan',
    brand_name: drive.brand_name || 'AniissAuto',
    model: drive.model || '',
    variant: drive.variant || '',
    year: drive.year || '',
    color_hex: drive.color_hex || '#7C8288',
    logo_color: drive.logo_color || '#D8AA5B'
  });
  const content = `<span class="order-art">${carArt(car, 'thumb')}</span>
    <div class="order-main">
      <h3>${esc(drive.vehicle_snapshot)}</h3>
      <p>Request TD-${String(drive.id).padStart(5, '0')} · ${formatDate(drive.preferred_date)} at ${formatTime(drive.preferred_time)}</p>
      <div class="order-meta">
        ${statusChip(drive.status)}
        <span>${esc(drive.name)}</span>
        ${drive.notes ? `<span>${esc(drive.notes)}</span>` : ''}
      </div>
    </div>
    <div class="order-side"><strong>${formatTime(drive.preferred_time)}</strong><span>${formatDate(drive.preferred_date)}</span></div>`;
  return drive.vehicle_id
    ? `<a class="order-row" href="#/vehicle/${drive.vehicle_id}">${content}</a>`
    : `<div class="order-row">${content}</div>`;
}

export async function renderAccount(params, token) {
  if (!state.user) {
    sessionStorage.setItem('aniiss_after_login', window.location.hash || '#/account');
    window.location.hash = '#/login';
    return;
  }

  let ordersData;
  let drivesData;
  let favoritesData;
  try {
    [ordersData, drivesData, favoritesData] = await Promise.all([
      api('/api/account/orders'),
      api('/api/account/test-drives'),
      api('/api/favorites')
    ]);
  } catch (error) {
    if (error.status === 401) {
      state.user = null;
      state.favorites = new Set();
      sessionStorage.setItem('aniiss_after_login', window.location.hash || '#/account');
      window.location.hash = '#/login';
      return;
    }
    if (token !== state.routeToken) return;
    paint(`<section class="container" style="padding:80px 0 120px">${emptyStateMarkup('spark', 'Your account could not be loaded', error.message, '<button class="btn btn-gold" data-retry type="button">Try again</button>')}</section>`, token);
    return;
  }
  if (token !== state.routeToken) return;

  const orders = ordersData.orders || [];
  const drives = drivesData.testDrives || [];
  const favorites = favoritesData.vehicles || [];
  const requested = params.get('tab') || 'orders';
  const tab = TABS.some(([key]) => key === requested) ? requested : 'orders';
  const user = state.user;
  const counts = { orders: orders.length, drives: drives.length, garage: favorites.length, profile: 0 };

  const panelMarkup = {
    orders: `<div class="account-panel${tab === 'orders' ? ' active' : ''}" id="panel-orders">
      <div class="account-panel-head"><div><h2>Your reservations</h2><p>Vehicles currently held in your name.</p></div><a class="section-link" href="#/inventory">Find another ${icon('arrowRight')}</a></div>
      <div class="account-card">
        ${orders.length ? orders.map(orderRow).join('') : `<div class="order-empty">${icon('key')}<h3>No reservations yet</h3><p>When you reserve a vehicle, its progress will appear here.</p><a class="btn btn-gold btn-sm" href="#/inventory">Explore the collection</a></div>`}
      </div>
    </div>`,
    drives: `<div class="account-panel${tab === 'drives' ? ' active' : ''}" id="panel-drives">
      <div class="account-panel-head"><div><h2>Your test drives</h2><p>Private appointments arranged by our concierge team.</p></div><button class="btn btn-outline btn-sm" type="button" data-testdrive>Book another</button></div>
      <div class="account-card">
        ${drives.length ? drives.map(driveRow).join('') : `<div class="order-empty">${icon('calendar')}<h3>No test drives booked</h3><p>Choose a vehicle and a time that suits you. We will handle the rest.</p><button class="btn btn-gold btn-sm" type="button" data-testdrive>Book a test drive</button></div>`}
      </div>
    </div>`,
    garage: `<div class="account-panel${tab === 'garage' ? ' active' : ''}" id="panel-garage">
      <div class="account-panel-head"><div><h2>My garage</h2><p>${favorites.length ? `${favorites.length} saved ${favorites.length === 1 ? 'vehicle' : 'vehicles'}.` : 'Your shortlist of saved vehicles.'}</p></div><a class="section-link" href="#/inventory">Browse inventory ${icon('arrowRight')}</a></div>
      ${favorites.length ? `<div class="vehicle-grid cols-3">${favorites.map((vehicle, index) => vehicleCard(vehicle, index)).join('')}</div>` : `<div class="account-card">${emptyStateMarkup('heart', 'Your garage is empty', 'Tap the heart on any vehicle to keep it here for later.', '<a class="btn btn-gold btn-sm" href="#/inventory">Find a vehicle</a>')}</div>`}
    </div>`,
    profile: `<div class="account-panel${tab === 'profile' ? ' active' : ''}" id="panel-profile">
      <div class="account-panel-head"><div><h2>Your profile</h2><p>The details linked to your AniissAuto account.</p></div><a class="section-link" href="#/contact">Contact concierge ${icon('arrowRight')}</a></div>
      <div class="profile-grid">
        <div class="profile-field"><span>Full name</span><strong>${esc(user.name)}</strong></div>
        <div class="profile-field"><span>Email</span><strong>${esc(user.email)}</strong></div>
        <div class="profile-field"><span>Telephone</span><strong>${esc(user.phone || 'Not provided')}</strong></div>
        <div class="profile-field"><span>Member since</span><strong>${formatDate(user.created_at)}</strong></div>
        <div class="profile-field"><span>Account type</span><strong>${esc(user.role === 'admin' ? 'Showroom administrator' : 'Private client')}</strong></div>
        <div class="profile-field"><span>Saved vehicles</span><strong>${number(favorites.length)}</strong></div>
      </div>
      <div class="account-card" style="margin-top:14px">
        <p style="color:var(--muted);font-size:12px;line-height:1.7">For security, your session expires after seven days. To update your contact details or change your password, contact our concierge team — a specialist will verify your identity first.</p>
        ${user.role === 'admin' ? `<a class="btn btn-outline btn-sm" style="margin-top:16px" href="/admin">Open admin dashboard ${icon('external')}</a>` : ''}
      </div>
    </div>`
  };

  const painted = paint(`
    <section class="account-page">
      <div class="container">
        <div class="account-header">
          <div class="account-profile">
            <span class="avatar">${esc(initials(user.name))}</span>
            <div>
              <h1>${esc(user.name)}${user.role === 'admin' ? '<span class="role-chip">Admin</span>' : ''}</h1>
              <p>${esc(user.email)} · Client since ${formatDate(user.created_at, { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div class="toolbar-actions">
            <a class="btn btn-outline btn-sm" href="#/inventory">${icon('search')} Browse inventory</a>
            <button class="btn btn-gold btn-sm" type="button" data-testdrive>Book a test drive</button>
          </div>
        </div>
        <div class="account-layout">
          <aside class="account-side">
            <nav class="account-tabs" aria-label="Account sections">
              ${TABS.map(([key, label, iconName]) => `<a class="account-tab${tab === key ? ' active' : ''}" href="#/account?tab=${key}">${icon(iconName)} ${label}${counts[key] ? `<span>${counts[key]}</span>` : ''}</a>`).join('')}
            </nav>
            <div class="account-side-footer">
              <a href="#/contact">${icon('mail')} Concierge support</a>
              <button type="button" id="accountLogout">${icon('logout')} Sign out</button>
            </div>
          </aside>
          <div class="account-content">
            ${TABS.map(([key]) => panelMarkup[key]).join('')}
          </div>
        </div>
      </div>
    </section>
  `, token);
  if (!painted) return;

  document.querySelector('#accountLogout')?.addEventListener('click', async () => {
    const button = document.querySelector('#accountLogout');
    button.disabled = true;
    try {
      await api('/api/logout', { method: 'POST' });
    } catch {
      state.user = null;
    }
    state.user = null;
    state.favorites = new Set();
    toast('You have been signed out.', 'info');
    window.location.hash = '#/';
  });
}
