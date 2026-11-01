import { $, esc, icon, state } from '../utils.js';

export function paint(html, token) {
  if (token !== undefined && token !== state.routeToken) return false;
  const app = $('#app');
  if (!app) return false;
  app.innerHTML = html;
  return true;
}

export function pageHero({ eyebrow = '', title = '', lede = '', aside = '' }) {
  return `<section class="page-hero">
    <div class="container page-hero-inner">
      <div>
        <span class="eyebrow">${eyebrow}</span>
        <h1 class="page-title">${title}</h1>
        ${lede ? `<p class="page-lede">${lede}</p>` : ''}
      </div>
      ${aside ? `<div class="page-hero-aside">${aside}</div>` : ''}
    </div>
  </section>`;
}

export function heroStat(value, label) {
  return `<div class="page-hero-stat"><strong>${value}</strong><span>${label}</span></div>`;
}

export function sectionHead({ eyebrow = '', title = '', sub = '', link = '' }) {
  return `<div class="section-head">
    <div>
      <span class="eyebrow">${eyebrow}</span>
      <h2 class="section-title">${title}</h2>
      ${sub ? `<p class="section-sub">${sub}</p>` : ''}
    </div>
    ${link}
  </div>`;
}

export function breadcrumb(items) {
  const parts = items.map((item, index) => {
    const separator = index ? icon('chevronRight') : '';
    if (item.href) return `${separator}<a href="${esc(item.href)}">${esc(item.label)}</a>`;
    return `${separator}<span>${esc(item.label)}</span>`;
  }).join('');
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${parts}</nav>`;
}

export function errorPage(title = 'Something went wrong', text = 'Please try again in a moment.', action = '') {
  return `<section class="container" style="padding:80px 0 120px">
    ${emptyStateMarkup('spark', title, text, action)}
  </section>`;
}

export function emptyStateMarkup(iconName, title, text, action = '') {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon(iconName)}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${action}
  </div>`;
}

export function routeLoading() {
  return `<div class="route-loading"><div class="spinner"></div><p>Preparing the showroom…</p></div>`;
}

export function vehicleSnapshot(row, fallback = {}) {
  return {
    category: 'Sedan',
    brand_name: 'AniissAuto',
    model: '',
    variant: '',
    year: '',
    color_hex: '#7C8288',
    logo_color: '#D8AA5B',
    ...fallback,
    ...(row || {})
  };
}

export function statusChip(status) {
  const value = String(status || 'pending').toLowerCase();
  return `<span class="status-chip status-${esc(value)}">${esc(value)}</span>`;
}

export function cleanPageTitle(title) {
  document.title = title ? `${title} — AniissAuto` : 'AniissAuto — Exceptional automobiles, curated';
}
