import {
  state, api, esc, money, number, formatDate, initials, icon, stars,
  carArt, vehicleCard, toast, openReserveModal, openTestDriveModal, copyLink,
  refreshCurrentRoute
} from '../utils.js';
import { paint, breadcrumb, emptyStateMarkup } from './shared.js';

function reviewMarkup(review) {
  return `<article class="review-item">
    <div class="review-item-head">
      <div class="review-author">
        <span class="avatar">${esc(initials(review.author_name))}</span>
        <div><strong>${esc(review.author_name)}</strong><span>${formatDate(review.created_at)}</span></div>
      </div>
      <span class="review-stars">${stars(review.rating)}</span>
    </div>
    <p>${esc(review.comment)}</p>
  </article>`;
}

function detailSpec(iconName, label, value) {
  return `<div class="detail-spec">${icon(iconName)}<span>${esc(label)}</span><strong>${esc(value || '—')}</strong></div>`;
}

function specRow(label, value) {
  return `<div class="spec-row"><dt>${esc(label)}</dt><dd>${esc(value ?? '—')}</dd></div>`;
}

function featureList(items, iconName = 'check') {
  return `<ul class="feature-list">${items.length
    ? items.map((item) => `<li>${icon(iconName)}<span>${esc(item)}</span></li>`).join('')
    : '<li>Standard specification applies.</li>'}</ul>`;
}

export async function renderVehicle(id, _params, token) {
  let data;
  try {
    data = await api(`/api/vehicles/${encodeURIComponent(id)}`);
  } catch (error) {
    if (token !== state.routeToken) return;
    paint(`<section class="container" style="padding:80px 0 120px">${emptyStateMarkup('car', 'This vehicle is not in the showroom', error.message, '<a class="btn btn-gold" href="#/inventory">Browse the collection</a>')}</section>`, token);
    return;
  }
  if (token !== state.routeToken) return;

  const vehicle = data.vehicle;
  const reviews = data.reviews || [];
  const relatedData = await api(`/api/vehicles/${vehicle.id}/related`).catch(() => ({ vehicles: [] }));
  if (token !== state.routeToken) return;
  const related = relatedData.vehicles || [];
  const price = Number(vehicle.price) || 0;
  const msrp = Number(vehicle.msrp) || 0;
  const savings = msrp > price ? msrp - price : 0;
  const stockOut = Number(vehicle.stock) <= 0;
  const saved = state.favorites.has(Number(vehicle.id));
  const ratingValue = Number(vehicle.rating) || 0;
  const ratingCount = Number(vehicle.reviews_count) || reviews.length;
  const mileageValue = Number(vehicle.mileage) > 0 ? `${number(vehicle.mileage)} mi` : 'New';
  const galleryModes = [
    ['', 'Studio'],
    ['night', 'Night'],
    ['sunset', 'Sunset']
  ];

  const painted = paint(`
    <section class="detail-page">
      <div class="container">
        ${breadcrumb([
          { label: 'Home', href: '#/' },
          { label: 'Inventory', href: '#/inventory' },
          { label: `${vehicle.year} ${vehicle.brand_name} ${vehicle.model}` }
        ])}
        <div class="detail-top">
          <div class="detail-gallery">
            <div class="detail-art" id="detailArt">
              ${carArt(vehicle, 'detail')}
              <span class="gallery-label" id="galleryLabel">Studio · ${esc(vehicle.exterior_color)}</span>
            </div>
            <div class="gallery-thumbs">
              ${galleryModes.map(([mode, label], index) => `<button class="gallery-thumb${index === 0 ? ' active' : ''}" type="button" data-gallery-mode="${mode}" data-gallery-label="${esc(label)}" aria-label="${esc(label)} view">
                ${carArt(vehicle, 'thumb', mode)}
                <span>${esc(label)}</span>
              </button>`).join('')}
            </div>
            <p class="gallery-note">${icon('sparkle')} Presented in ${esc(vehicle.exterior_color)} · studio, evening and golden-hour views</p>
          </div>

          <aside class="detail-summary">
            <div class="detail-brandline">
              <span class="detail-brand">${esc(vehicle.brand_name)} · ${esc(vehicle.brand_country || '')}</span>
              <span class="detail-stock${stockOut ? ' out' : ''}"><i></i>${stockOut ? 'Reserved' : 'Available now'}</span>
            </div>
            <h1 class="detail-title">${esc(vehicle.year)} ${esc(vehicle.model)}</h1>
            <p class="detail-subtitle">${esc(vehicle.variant)} · ${esc(vehicle.category)} · ${esc(vehicle.condition)}</p>
            <div class="detail-rating">
              ${ratingCount ? `${stars(ratingValue)}<span><strong>${ratingValue.toFixed(1)}</strong> · ${number(ratingCount)} owner ${ratingCount === 1 ? 'review' : 'reviews'}</span>` : '<span>No owner reviews yet</span>'}
            </div>
            <div class="detail-price-block">
              <div>
                <div class="detail-price">${money(price)}</div>
                <p class="detail-price-note">AniissAuto showroom price</p>
              </div>
              ${savings ? `<div class="detail-msrp"><s>${money(msrp)}</s><strong>Save ${money(savings)}</strong></div>` : `<div class="detail-msrp">VIN ${esc(vehicle.vin)}</div>`}
            </div>
            <div class="detail-specs">
              ${detailSpec('fuel', 'Fuel', vehicle.fuel)}
              ${detailSpec('gauge', 'Power', `${number(vehicle.horsepower)} hp`)}
              ${detailSpec('gear', 'Transmission', vehicle.transmission)}
              ${detailSpec('road', 'Mileage', mileageValue)}
              ${detailSpec('users', 'Seats', `${vehicle.seats} seats`)}
              ${detailSpec('bolt', 'Drivetrain', vehicle.drivetrain)}
            </div>
            <div class="detail-actions">
              <button class="btn btn-gold" type="button" id="reserveVehicle"${stockOut ? ' disabled' : ''}>${stockOut ? 'Currently reserved' : `Reserve · ${money(price)}`}</button>
              <button class="btn btn-outline" type="button" id="testDriveVehicle">Test drive</button>
              <button class="detail-action-icon${saved ? ' saved' : ''}" type="button" data-fav="${vehicle.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved vehicles' : 'Save vehicle'}">${icon(saved ? 'heartFill' : 'heart')}</button>
              <button class="detail-action-icon" type="button" id="copyVehicle" aria-label="Share this vehicle">${icon('link')}</button>
            </div>
            <div class="detail-trust">
              <span>${icon('shield')} 172-point inspection &amp; verified history</span>
              <span>${icon('key')} Complimentary enclosed delivery</span>
              <span>${icon('refresh')} 7-day exchange promise</span>
            </div>
          </aside>
        </div>

        <div class="detail-sections">
          <section class="detail-block">
            <div class="detail-block-head">
              <div><span class="eyebrow">The vehicle</span><h2>A closer look.</h2></div>
              <p>${esc(vehicle.brand_tagline || 'Curated by AniissAuto')}</p>
            </div>
            <div class="detail-overview">
              <div>
                <p class="detail-description">${esc(vehicle.description)}</p>
                <p class="detail-description">This ${esc(vehicle.condition.toLowerCase())} ${esc(vehicle.year)} ${esc(vehicle.brand_name)} ${esc(vehicle.model)} is offered with a complete inspection report, clear title and a dedicated specialist for the duration of your ownership. Arranged viewings are available seven days a week.</p>
              </div>
              <div class="highlights">
                <div class="highlight"><span>Body style</span><strong>${esc(vehicle.category)}</strong></div>
                <div class="highlight"><span>Drivetrain</span><strong>${esc(vehicle.drivetrain)}</strong></div>
                <div class="highlight"><span>Condition</span><strong>${esc(vehicle.condition)}</strong></div>
                <div class="highlight"><span>Exterior</span><strong>${esc(vehicle.exterior_color)}</strong></div>
              </div>
            </div>
          </section>

          <section class="detail-block">
            <div class="detail-block-head">
              <div><span class="eyebrow">Specification</span><h2>The details.</h2></div>
              <p>Verified factory and listing data</p>
            </div>
            <dl class="spec-table">
              ${specRow('Model year', vehicle.year)}
              ${specRow('Engine', vehicle.engine)}
              ${specRow('Power', `${number(vehicle.horsepower)} hp`)}
              ${specRow('Torque', `${number(vehicle.torque)} lb-ft`)}
              ${specRow('Transmission', vehicle.transmission)}
              ${specRow('Drivetrain', vehicle.drivetrain)}
              ${specRow('Fuel', vehicle.fuel)}
              ${specRow('Mileage', mileageValue)}
              ${specRow('Seats', vehicle.seats)}
              ${specRow('Doors', vehicle.doors)}
              ${specRow('VIN', vehicle.vin)}
              ${specRow('Stock', `${vehicle.stock} available`)}
            </dl>
          </section>

          <section class="detail-block">
            <div class="detail-block-head">
              <div><span class="eyebrow">Equipment</span><h2>Specified with care.</h2></div>
            </div>
            <div class="feature-columns">
              <div class="feature-panel">
                <h3>${icon('sparkle')} Comfort &amp; technology</h3>
                ${featureList(vehicle.features || [])}
              </div>
              <div class="feature-panel">
                <h3>${icon('shield')} Safety &amp; assistance</h3>
                ${featureList(vehicle.safety || [])}
              </div>
            </div>
          </section>

          <section class="detail-block">
            <div class="detail-block-head">
              <div><span class="eyebrow">Finance</span><h2>Make it yours.</h2></div>
              <p>Illustrative estimate · subject to approval</p>
            </div>
            <div class="finance-panel">
              <div class="finance-copy">
                <h2>An ownership plan, tailored.</h2>
                <p>Adjust the deposit and term to see an indicative monthly payment. Our finance desk will tailor a final proposal to you.</p>
                <div class="finance-result">
                  <span>Estimated monthly payment</span>
                  <strong id="financeMonthly">—</strong>
                  <small id="financeDetail">Based on a ${money(price)} vehicle</small>
                </div>
              </div>
              <div class="finance-controls">
                <div class="finance-control">
                  <div class="finance-label"><span>Down payment</span><strong id="financeDownLabel">20% · ${money(price * 0.2)}</strong></div>
                  <input type="range" id="financeDown" min="0" max="60" step="1" value="20" aria-label="Down payment percentage">
                </div>
                <div class="finance-control">
                  <div class="finance-label"><span>Term</span><strong id="financeTermLabel">60 months</strong></div>
                  <div class="finance-terms">
                    <select id="financeTerm" aria-label="Finance term">
                      <option value="36">36 months</option>
                      <option value="48">48 months</option>
                      <option value="60" selected>60 months</option>
                      <option value="72">72 months</option>
                      <option value="84">84 months</option>
                    </select>
                    <span class="finance-disclaimer">6.49% APR representative</span>
                  </div>
                </div>
                <p class="finance-disclaimer">Estimate only. Excludes taxes, registration and optional products. A formal quote is provided by the AniissAuto finance desk.</p>
              </div>
            </div>
          </section>

          <section class="detail-block" id="reviews">
            <div class="detail-block-head">
              <div><span class="eyebrow">Owner voices</span><h2>What owners say.</h2></div>
              <p>${ratingCount ? `${number(ratingCount)} verified ${ratingCount === 1 ? 'review' : 'reviews'}` : 'No verified reviews yet'}</p>
            </div>
            <div class="reviews-layout">
              <div class="reviews-summary">
                <div class="reviews-score">${ratingCount ? ratingValue.toFixed(1) : '—'}</div>
                ${ratingCount ? stars(ratingValue) : ''}
                <p>${ratingCount ? `Based on ${number(ratingCount)} owner ${ratingCount === 1 ? 'experience' : 'experiences'}` : 'Be the first to review this vehicle.'}</p>
                ${state.user ? `<form class="review-form" id="reviewForm">
                  <h3>Share your experience</h3>
                  <div class="star-input" id="reviewStars" aria-label="Your rating">
                    ${[1, 2, 3, 4, 5].map((value) => `<button class="active" type="button" data-rating="${value}" aria-label="${value} star${value === 1 ? '' : 's'}">${icon('starFill')}</button>`).join('')}
                  </div>
                  <div class="field">
                    <label for="reviewComment" class="sr-only">Your review</label>
                    <textarea id="reviewComment" minlength="5" maxlength="800" placeholder="Tell other owners about the car and your experience…" required></textarea>
                  </div>
                  <button class="btn btn-outline btn-sm" type="submit" id="reviewSubmit">Publish review</button>
                  <p class="form-status error" id="reviewStatus" role="status"></p>
                </form>` : `<p class="review-login-prompt"><a href="#/login" id="reviewLogin">Sign in</a> to share your experience with this vehicle.</p>`}
              </div>
              <div class="review-list" id="reviewList">
                ${reviews.length ? reviews.map(reviewMarkup).join('') : emptyStateMarkup('star', 'No reviews yet', 'Be the first to share an owner experience.')}
              </div>
            </div>
          </section>

          ${related.length ? `<section class="detail-block">
            <div class="detail-block-head">
              <div><span class="eyebrow">Continue exploring</span><h2>You may also like.</h2></div>
              <a class="section-link" href="#/inventory">View all inventory ${icon('arrowRight')}</a>
            </div>
            <div class="vehicle-grid">${related.map((item, index) => vehicleCard(item, index)).join('')}</div>
          </section>` : ''}
        </div>
      </div>
    </section>
  `, token);
  if (!painted) return;

  const gallery = document.querySelector('#detailArt');
  document.querySelectorAll('[data-gallery-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-gallery-mode]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const mode = button.dataset.galleryMode || '';
      const label = button.dataset.galleryLabel;
      gallery.innerHTML = `${carArt(vehicle, 'detail', mode)}<span class="gallery-label" id="galleryLabel">${esc(label)} · ${esc(vehicle.exterior_color)}</span>`;
    });
  });

  document.querySelector('#reserveVehicle')?.addEventListener('click', () => {
    if (stockOut) {
      toast('This vehicle is currently reserved. Contact us for alternatives.', 'info');
      return;
    }
    openReserveModal(vehicle);
  });
  document.querySelector('#testDriveVehicle')?.addEventListener('click', () => openTestDriveModal(vehicle));
  document.querySelector('#copyVehicle')?.addEventListener('click', copyLink);
  document.querySelector('#reviewLogin')?.addEventListener('click', () => {
    sessionStorage.setItem('aniiss_after_login', window.location.hash);
  });

  const down = document.querySelector('#financeDown');
  const term = document.querySelector('#financeTerm');
  const monthly = document.querySelector('#financeMonthly');
  const detail = document.querySelector('#financeDetail');
  const downLabel = document.querySelector('#financeDownLabel');
  const termLabel = document.querySelector('#financeTermLabel');
  const calculate = () => {
    if (!down || !term || !monthly) return;
    const percent = Number(down.value) || 0;
    const months = Number(term.value) || 60;
    const principal = price * (1 - percent / 100);
    const rate = 0.0649 / 12;
    const payment = principal > 0 ? principal * rate / (1 - Math.pow(1 + rate, -months)) : 0;
    monthly.textContent = money(payment);
    downLabel.textContent = `${percent}% · ${money(price * percent / 100)}`;
    termLabel.textContent = `${months} months`;
    detail.textContent = `${money(principal)} financed over ${months} months at 6.49% APR`;
    down.style.setProperty('--fill', `${(percent / 60) * 100}%`);
  };
  down?.addEventListener('input', calculate);
  term?.addEventListener('change', calculate);
  calculate();

  let selectedRating = 5;
  const starButtons = document.querySelectorAll('#reviewStars button');
  starButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedRating = Number(button.dataset.rating);
      starButtons.forEach((item) => item.classList.toggle('active', Number(item.dataset.rating) <= selectedRating));
    });
  });

  document.querySelector('#reviewForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.querySelector('#reviewStatus');
    const submit = document.querySelector('#reviewSubmit');
    const comment = document.querySelector('#reviewComment').value.trim();
    if (comment.length < 5) {
      status.textContent = 'Please write at least 5 characters.';
      return;
    }
    status.textContent = '';
    submit.disabled = true;
    submit.textContent = 'Publishing…';
    try {
      await api(`/api/vehicles/${vehicle.id}/reviews`, {
        method: 'POST',
        body: { rating: selectedRating, comment }
      });
      toast('Thank you — your review is now live.', 'success');
      refreshCurrentRoute();
    } catch (error) {
      status.textContent = error.message;
      submit.disabled = false;
      submit.textContent = 'Publish review';
    }
  });
}
