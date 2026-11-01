import {
  state, api, esc, compactMoney, number, icon, vehicleCard
} from '../utils.js';
import { paint, pageHero, heroStat, emptyStateMarkup } from './shared.js';

const SORTS = [
  ['featured', 'Curator’s choice'],
  ['newest', 'Newest arrivals'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['rating', 'Highest rated'],
  ['mileage', 'Lowest mileage'],
  ['horsepower', 'Most powerful']
];

function option(value, label, selectedValue) {
  return `<option value="${esc(value)}"${String(value) === String(selectedValue) ? ' selected' : ''}>${esc(label)}</option>`;
}

function pagination(page, pages, params) {
  if (pages <= 1) return '';
  const href = (target) => {
    const query = new URLSearchParams(params);
    query.set('page', String(target));
    return `#/inventory?${query.toString()}`;
  };
  const wanted = new Set([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => wanted.add(value));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((value) => wanted.add(value));
  const numbers = [...wanted].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
  let previous = 0;
  const buttons = numbers.map((value) => {
    const gap = value - previous > 1 ? '<span class="page-ellipsis">…</span>' : '';
    previous = value;
    return `${gap}<a class="page-btn${value === page ? ' active' : ''}" href="${href(value)}" aria-label="Page ${value}">${value}</a>`;
  }).join('');
  return `<nav class="pagination" aria-label="Inventory pages">
    <a class="page-btn" href="${href(Math.max(1, page - 1))}" aria-label="Previous page"${page === 1 ? ' aria-disabled="true" tabindex="-1"' : ''}>${icon('chevronLeft')}</a>
    ${buttons}
    <a class="page-btn" href="${href(Math.min(pages, page + 1))}" aria-label="Next page"${page === pages ? ' aria-disabled="true" tabindex="-1"' : ''}>${icon('chevronRight')}</a>
  </nav>`;
}

export async function renderInventory(params, token) {
  const query = new URLSearchParams(params);
  if (!query.get('limit')) query.set('limit', '12');
  const sort = params.get('sort') || 'featured';
  let data;
  try {
    data = await api(`/api/vehicles?${query.toString()}`);
  } catch (error) {
    if (token !== state.routeToken) return;
    paint(`<section class="container" style="padding:80px 0 120px">${emptyStateMarkup('spark', 'The collection could not be loaded', error.message, '<button class="btn btn-gold" type="button" data-retry>Try again</button>')}</section>`, token);
    return;
  }
  if (token !== state.routeToken) return;

  const meta = state.meta || {};
  const stats = state.stats || {};
  const priceRange = meta.price || {};
  const categories = meta.categories || [];
  const fuels = meta.fuels || [];
  const conditions = meta.conditions || [];
  const transmissions = meta.transmissions || [];
  const brands = [...(state.brands || [])].sort((a, b) => a.name.localeCompare(b.name));
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  const fuel = params.get('fuel') || '';
  const condition = params.get('condition') || '';
  const transmission = params.get('transmission') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const minYear = params.get('minYear') || '';
  const stockOnly = params.get('stock') === '1';
  const from = data.total ? (data.page - 1) * data.limit + 1 : 0;
  const to = Math.min(data.page * data.limit, data.total);

  const painted = paint(`
    ${pageHero({
      eyebrow: 'The collection',
      title: 'Every extraordinary <em>machine.</em>',
      lede: 'Search the complete AniissAuto inventory by marque, body style, fuel and budget. Every listing is prepared and inspection-verified.',
      aside: `${heroStat(number(stats.inStock || 0), 'Ready to drive')}<span class="page-hero-divider"></span>${heroStat(compactMoney(priceRange.min || 0), 'Starting from')}<span class="page-hero-divider"></span>${heroStat(number(stats.brands || 0), 'World marques')}`
    })}
    <section class="inventory-page">
      <div class="container">
        <div class="inventory-toolbar">
          <p class="results-count" id="resultsCount"><strong>${number(data.total)}</strong> ${data.total === 1 ? 'vehicle' : 'vehicles'} found${data.total ? ` · showing ${from}–${to}` : ''}</p>
          <div class="toolbar-actions">
            <button class="btn btn-outline btn-sm filter-toggle" type="button" id="openFilters">${icon('filter')} Filters</button>
            <select class="sort-select" id="inventorySort" aria-label="Sort inventory">
              ${SORTS.map(([value, label]) => option(value, label, sort)).join('')}
            </select>
          </div>
        </div>
        <div class="inventory-layout">
          <aside class="filter-panel" id="filterPanel" aria-label="Inventory filters">
            <div class="filter-panel-head">
              <h2>Refine the collection</h2>
              <div style="display:flex;align-items:center;gap:12px">
                <button class="clear-filters" type="button" id="clearFilters">Clear</button>
                <button class="filter-close" type="button" id="closeFilters" aria-label="Close filters">${icon('close')}</button>
              </div>
            </div>
            <form id="inventoryFilters">
              <div class="filter-group">
                <label class="filter-label" for="filterQuery">Search</label>
                <div class="filter-search">${icon('search')}<input id="filterQuery" name="q" type="search" placeholder="Model, variant, marque…" value="${esc(params.get('q') || '')}"></div>
              </div>
              <div class="filter-group">
                <label class="filter-label" for="filterBrand">Marque</label>
                <select id="filterBrand" name="brand">
                  <option value="">All marques</option>
                  ${brands.map((item) => option(item.id, item.name, brand)).join('')}
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label" for="filterCategory">Body style</label>
                <select id="filterCategory" name="category">
                  <option value="">All body styles</option>
                  ${categories.map((item) => option(item.name, `${item.name} (${item.count})`, category)).join('')}
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label" for="filterFuel">Fuel</label>
                <select id="filterFuel" name="fuel">
                  <option value="">All fuel types</option>
                  ${fuels.map((item) => option(item.name, item.name, fuel)).join('')}
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label" for="filterCondition">Condition</label>
                <select id="filterCondition" name="condition">
                  <option value="">New &amp; certified</option>
                  ${conditions.map((item) => option(item.name, item.name, condition)).join('')}
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label" for="filterTransmission">Transmission</label>
                <select id="filterTransmission" name="transmission">
                  <option value="">Any transmission</option>
                  ${transmissions.map((item) => option(item.name, item.name, transmission)).join('')}
                </select>
              </div>
              <div class="filter-group">
                <span class="filter-label">Price range (USD)</span>
                <div class="price-range">
                  <input name="minPrice" type="number" min="0" step="1000" placeholder="Min" value="${esc(minPrice)}" aria-label="Minimum price">
                  <input name="maxPrice" type="number" min="0" step="1000" placeholder="Max" value="${esc(maxPrice)}" aria-label="Maximum price">
                </div>
              </div>
              <div class="filter-group">
                <label class="filter-label" for="filterYear">From model year</label>
                <input id="filterYear" name="minYear" type="number" min="1990" max="${esc(priceRange.maxYear || 2027)}" placeholder="e.g. 2022" value="${esc(minYear)}">
              </div>
              <div class="filter-group">
                <label class="check-row"><input type="checkbox" name="stock" value="1"${stockOnly ? ' checked' : ''}> Available now only</label>
              </div>
              <div class="filter-actions">
                <button class="btn btn-gold btn-sm" type="submit">Apply filters</button>
                <button class="btn btn-ghost btn-sm" type="button" id="resetFilters">Reset</button>
              </div>
            </form>
          </aside>
          <div class="filter-scrim" id="filterScrim"></div>
          <div class="inventory-grid" id="inventoryResults">
            ${data.vehicles.length ? `<div class="vehicle-grid">${data.vehicles.map((vehicle, index) => vehicleCard(vehicle, index)).join('')}</div>${pagination(data.page, data.pages, query)}` : emptyStateMarkup('search', 'No vehicles match those filters', 'Adjust your search or reset the filters to see the full collection.', '<button class="btn btn-gold" type="button" id="emptyReset">Reset filters</button>')}
          </div>
        </div>
      </div>
    </section>
  `, token);
  if (!painted) return;

  const panel = document.querySelector('#filterPanel');
  const scrim = document.querySelector('#filterScrim');
  const close = () => {
    panel?.classList.remove('open');
    scrim?.classList.remove('open');
  };
  const open = () => {
    panel?.classList.add('open');
    scrim?.classList.add('open');
  };
  document.querySelector('#openFilters')?.addEventListener('click', open);
  document.querySelector('#closeFilters')?.addEventListener('click', close);
  scrim?.addEventListener('click', close);

  const go = (next) => {
    const value = next.toString();
    window.location.hash = `#/inventory${value ? `?${value}` : ''}`;
  };

  document.querySelector('#inventoryFilters')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      const clean = String(value).trim();
      if (clean) next.set(key, clean);
    }
    next.set('sort', document.querySelector('#inventorySort')?.value || 'featured');
    close();
    go(next);
  });

  const reset = () => {
    window.location.hash = '#/inventory';
  };
  document.querySelector('#clearFilters')?.addEventListener('click', reset);
  document.querySelector('#resetFilters')?.addEventListener('click', reset);
  document.querySelector('#emptyReset')?.addEventListener('click', reset);

  document.querySelector('#inventorySort')?.addEventListener('change', (event) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    next.set('sort', event.target.value);
    go(next);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  }, { once: true });
}
