import {
  state, $, api, esc, initials, icon, toast, setRefreshHandler,
  openTestDriveModal, openLegalModal, toggleFavorite
} from './utils.js';
import {
  renderHome, renderInventory, renderVehicle, renderBrands, renderAbout,
  renderContact, renderAuth, renderAccount
} from './pages.js';
import { errorPage } from './pages/shared.js';

let lastPath = null;

function parseHash() {
  let raw = window.location.hash.slice(1) || '/';
  if (!raw.startsWith('/')) raw = `/${raw}`;
  const [pathPart, queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  return {
    path: `/${segments.join('/')}`,
    segments,
    params: new URLSearchParams(queryPart)
  };
}

function updateAccountArea() {
  const area = $('#accountArea');
  const extra = $('#mobileNavExtra');
  if (!area) return;

  if (state.user) {
    area.innerHTML = `<button class="account-btn" type="button" data-account-toggle aria-expanded="false" aria-controls="accountMenu" aria-label="Open account menu">
      <span class="avatar">${esc(initials(state.user.name))}</span>
      ${icon('chevronDown', 'chev')}
    </button>
    <div class="account-menu" id="accountMenu" hidden>
      <div class="account-menu-head"><strong>${esc(state.user.name)}</strong><span>${esc(state.user.email)}</span></div>
      <a href="#/account?tab=orders">${icon('key')} Reservations</a>
      <a href="#/account?tab=drives">${icon('calendar')} Test drives</a>
      <a href="#/account?tab=garage">${icon('heart')} My garage</a>
      <a href="#/account?tab=profile">${icon('user')} Profile</a>
      ${state.user.role === 'admin' ? `<a href="/admin">${icon('dashboard')} Admin dashboard</a>` : ''}
      <button class="danger" type="button" data-logout>${icon('logout')} Sign out</button>
    </div>`;
    if (extra) {
      extra.innerHTML = `<a class="btn btn-gold" href="#/account">My account</a>
        <a class="btn btn-outline" href="#/account?tab=garage">My garage</a>`;
    }
  } else {
    area.innerHTML = '<a class="account-signin" href="#/login">Sign in</a>';
    if (extra) {
      extra.innerHTML = `<a class="btn btn-gold" href="#/login">Sign in</a>
        <a class="btn btn-outline" href="#/register">Create account</a>`;
    }
  }
}

function closeAccountMenu() {
  const menu = $('#accountMenu');
  const button = $('[data-account-toggle]');
  if (menu && !menu.hidden) menu.hidden = true;
  if (button) button.setAttribute('aria-expanded', 'false');
}

function closeMobileNav() {
  const nav = $('#mainNav');
  const toggle = $('#menuToggle');
  if (nav) nav.classList.remove('open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function applyChrome() {
  const settings = state.settings || {};
  updateAccountArea();

  const tagline = $('#footerTagline');
  if (tagline) tagline.textContent = settings.tagline || "The world's finest automobiles, curated under one roof.";
  const address = $('#footerAddress');
  if (address) address.textContent = settings.address || '88 Velocity Boulevard, Beverly Hills, CA';
  const phone = $('#footerPhone');
  if (phone) {
    phone.textContent = settings.phone || '+1 (555) 018-2026';
    phone.href = `tel:${String(settings.phone || '+15550182026').replace(/[^\d+]/g, '')}`;
  }
  const email = $('#footerEmail');
  if (email) {
    email.textContent = settings.email || 'hello@aniissauto.com';
    email.href = `mailto:${settings.email || 'hello@aniissauto.com'}`;
  }
  const hours = $('#footerHours');
  if (hours) hours.textContent = settings.hours || 'Mon–Sat 9–8 · Sun 10–5';
  const year = $('#footerYear');
  if (year) year.textContent = String(new Date().getFullYear());

  const bar = $('#announcementBar');
  const text = $('#announcementText');
  if (bar && text && settings.announcement && sessionStorage.getItem('aniiss_announcement') !== settings.announcement) {
    text.textContent = settings.announcement;
    bar.hidden = false;
  }
}

function markNavigation(path) {
  const key = path === '/' ? 'home'
    : path.startsWith('/inventory') || path.startsWith('/vehicle') ? 'inventory'
      : path === '/brands' ? 'brands'
        : path === '/about' ? 'about'
          : path === '/contact' ? 'contact'
            : '';
  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === key);
  });
}

function setTitle(path) {
  const titles = {
    '/': 'Exceptional automobiles, curated',
    '/inventory': 'The collection',
    '/brands': 'The marques',
    '/about': 'Our story',
    '/contact': 'Contact the showroom',
    '/login': 'Client sign in',
    '/register': 'Create an account',
    '/account': 'My account'
  };
  const title = path.startsWith('/vehicle/') ? 'Vehicle details' : titles[path] || 'Page not found';
  document.title = title === 'Exceptional automobiles, curated' ? 'AniissAuto — Exceptional automobiles, curated' : `${title} — AniissAuto`;
}

async function route({ preserveScroll = false } = {}) {
  const current = parseHash();
  const app = $('#app');
  if (!app) return;

  closeAccountMenu();
  closeMobileNav();
  markNavigation(current.path);

  if (current.path === '/account' && !state.user) {
    sessionStorage.setItem('aniiss_after_login', window.location.hash || '#/account');
    window.location.hash = '#/login';
    return;
  }
  if ((current.path === '/login' || current.path === '/register') && state.user) {
    window.location.hash = '#/account';
    return;
  }

  const pathChanged = lastPath !== current.path;
  const token = ++state.routeToken;
  if (pathChanged && !preserveScroll) window.scrollTo(0, 0);
  if (pathChanged) {
    app.innerHTML = '<div class="route-loading"><div class="spinner"></div><p>Preparing the showroom…</p></div>';
  }

  try {
    const [first, second] = current.segments;
    if (!first) await renderHome(current.params, token);
    else if (first === 'inventory') await renderInventory(current.params, token);
    else if (first === 'vehicle' && second) await renderVehicle(second, current.params, token);
    else if (first === 'brands') await renderBrands(current.params, token);
    else if (first === 'about') await renderAbout(current.params, token);
    else if (first === 'contact') await renderContact(current.params, token);
    else if (first === 'login') await renderAuth('login', current.params, token);
    else if (first === 'register') await renderAuth('register', current.params, token);
    else if (first === 'account') await renderAccount(current.params, token);
    else if (token === state.routeToken) {
      app.innerHTML = errorPage('This road does not exist', 'The page you are looking for has moved or never existed.', '<a class="btn btn-gold" href="#/">Return home</a>');
    }
  } catch (error) {
    if (token === state.routeToken) {
      app.innerHTML = errorPage('Something went sideways', error.message || 'Please try again in a moment.', '<a class="btn btn-gold" href="#/">Return home</a>');
    }
  }

  if (token === state.routeToken) {
    setTitle(current.path);
    updateAccountArea();
    lastPath = current.path;
  }
}

async function signOut() {
  const button = document.querySelector('[data-logout]');
  if (button) button.disabled = true;
  try {
    await api('/api/logout', { method: 'POST' });
  } catch {
    state.user = null;
  }
  state.user = null;
  state.favorites = new Set();
  closeAccountMenu();
  updateAccountArea();
  toast('You have been signed out.', 'info');
  if (window.location.hash === '#/' || !window.location.hash) await route();
  else window.location.hash = '#/';
}

function bindGlobalEvents() {
  const header = $('#siteHeader');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $('#menuToggle')?.addEventListener('click', (event) => {
    event.stopPropagation();
    const nav = $('#mainNav');
    const toggle = event.currentTarget;
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    closeAccountMenu();
  });

  document.addEventListener('click', async (event) => {
    const accountToggle = event.target.closest('[data-account-toggle]');
    if (accountToggle) {
      event.stopPropagation();
      const menu = $('#accountMenu');
      const open = menu?.hidden;
      if (menu) menu.hidden = !open;
      accountToggle.setAttribute('aria-expanded', String(Boolean(open)));
      return;
    }
    if (!event.target.closest('.account-area')) closeAccountMenu();
    if (event.target.closest('.main-nav a')) closeMobileNav();

    const retry = event.target.closest('[data-retry]');
    if (retry) {
      window.location.reload();
      return;
    }

    const logout = event.target.closest('[data-logout]');
    if (logout) {
      event.preventDefault();
      await signOut();
      return;
    }

    const fav = event.target.closest('[data-fav]');
    if (fav) {
      event.preventDefault();
      event.stopPropagation();
      await toggleFavorite(fav.dataset.fav);
      return;
    }

    const vehicleLink = event.target.closest('[data-vehicle-link]');
    if (vehicleLink && !event.target.closest('a, button')) {
      window.location.hash = vehicleLink.dataset.vehicleLink;
      return;
    }

    const testDrive = event.target.closest('[data-testdrive]');
    if (testDrive) {
      event.preventDefault();
      closeMobileNav();
      await openTestDriveModal();
      return;
    }

    const legal = event.target.closest('[data-legal]');
    if (legal) {
      event.preventDefault();
      openLegalModal(legal.dataset.legal);
    }
  });

  $('#announcementClose')?.addEventListener('click', () => {
    const bar = $('#announcementBar');
    if (bar) bar.hidden = true;
    if (state.settings.announcement) sessionStorage.setItem('aniiss_announcement', state.settings.announcement);
  });

  $('#footerNewsletter')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = $('#newsletterEmail');
    const note = $('#newsletterNote');
    if (!input || !note || !form.reportValidity()) return;
    note.classList.remove('error');
    note.textContent = 'Joining…';
    try {
      const data = await api('/api/newsletter', { method: 'POST', body: { email: input.value.trim() } });
      note.textContent = data.message;
      form.reset();
      toast('You are on the first-access list.', 'success');
    } catch (error) {
      note.classList.add('error');
      note.textContent = error.message;
    }
  });
}

async function boot() {
  const app = $('#app');
  try {
    const [settingsData, brandsData, metaData, statsData, meData] = await Promise.all([
      api('/api/settings'),
      api('/api/brands'),
      api('/api/meta'),
      api('/api/stats'),
      api('/api/me')
    ]);
    state.settings = settingsData.settings || {};
    state.brands = brandsData.brands || [];
    state.meta = metaData.meta || null;
    state.stats = statsData.stats || null;
    state.user = meData.user || null;
    state.favorites = new Set((meData.favorites || []).map(Number));
  } catch (error) {
    if (app) {
      app.innerHTML = errorPage('The showroom could not open', 'We could not reach the AniissAuto service. Please refresh the page or try again shortly.', '<a class="btn btn-gold" href="/">Refresh</a>');
    }
    return;
  }

  applyChrome();
  bindGlobalEvents();
  setRefreshHandler(() => route({ preserveScroll: true }));
  window.addEventListener('hashchange', () => route());
  await route();
}

boot();
