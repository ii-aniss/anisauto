import {
  state, api, esc, money, number, initials, icon, stars,
  carArt, vehicleCard, brandMonogram, skeletonCards
} from '../utils.js';
import { paint, sectionHead, emptyStateMarkup } from './shared.js';

const CATEGORY_COPY = {
  Sedan: 'Executive comfort and effortless long-distance pace.',
  SUV: 'Space, capability and commanding confidence.',
  Sports: 'Sharper responses, lower stance, pure intent.',
  Coupe: 'Two doors, dramatic proportions, grand touring poise.',
  Pickup: 'Work-ready strength with premium refinement.',
  Hatchback: 'Compact agility with everyday practicality.',
  Van: 'Spacious, flexible and quietly capable.',
  Convertible: 'Open-air theatre for every drive.',
  Wagon: 'Estate practicality with sporting character.'
};

export async function renderHome(_params, token) {
  const results = await Promise.allSettled([
    api('/api/vehicles?featured=1&stock=1&limit=8&sort=featured'),
    api('/api/vehicles?stock=1&limit=1&sort=price_desc'),
    api('/api/reviews/latest?limit=3')
  ]);
  if (token !== state.routeToken) return;

  const featured = results[0].status === 'fulfilled' ? results[0].value.vehicles : [];
  const heroFallback = results[1].status === 'fulfilled' ? results[1].value.vehicles[0] : null;
  const reviews = results[2].status === 'fulfilled' ? results[2].value.reviews : [];
  const hero = featured.find((vehicle) => vehicle.category === 'Sports')
    || featured.find((vehicle) => vehicle.category === 'SUV')
    || heroFallback
    || featured[0]
    || null;

  const stats = state.stats || {};
  const categories = (state.meta?.categories || []).slice(0, 6);
  const brands = state.brands || [];
  const experienceVehicle = featured.find((vehicle) => vehicle.category === 'SUV') || featured[1] || hero;
  const reviewAvatars = reviews.slice(0, 3).map((review) => `<span class="avatar">${esc(initials(review.author_name))}</span>`).join('');
  const reviewCount = Number(stats.reviews) || 0;
  const ratingDisplay = reviewCount && stats.avgRating != null ? Number(stats.avgRating).toFixed(1) : '—';

  paint(`
    <section class="hero">
      <div class="container">
        <div class="hero-grid">
          <div class="hero-copy">
            <span class="eyebrow">Established 2008 · Beverly Hills</span>
            <h1 class="hero-title">The art of<br><em>arrival.</em></h1>
            <p class="hero-lede">A privately curated collection of the world's most desirable automobiles — prepared, presented and delivered without compromise.</p>
            <div class="hero-actions">
              <a class="btn btn-gold btn-lg" href="#/inventory">Explore the collection ${icon('arrowRight')}</a>
              <button class="btn btn-outline btn-lg" type="button" data-testdrive>Book a private viewing</button>
            </div>
            <div class="hero-trust">
              ${reviewAvatars ? `<div class="avatar-stack">${reviewAvatars}</div>` : ''}
              <p>${reviewCount ? `<strong>${ratingDisplay} / 5</strong> from ${number(reviewCount)} verified ${reviewCount === 1 ? 'owner' : 'owners'}<br>` : '<strong>Owner reviews opening soon.</strong><br>'}White-glove delivery across the United States.</p>
            </div>
          </div>
          <div class="hero-stage">
            <span class="stage-ring" aria-hidden="true"></span>
            <div class="hero-car">${hero ? carArt(hero, 'hero') : ''}</div>
            ${hero ? `<div class="hero-pill pill-top">
              <span class="pill-icon">${icon('sparkle')}</span>
              <div><span>Featured arrival</span><strong>${esc(hero.brand_name)} ${esc(hero.model)}</strong></div>
            </div>
            <div class="hero-pill pill-bottom">
              <span class="pill-icon">${icon('tag')}</span>
              <div><span>Showroom price</span><strong>${money(hero.price)}</strong></div>
            </div>` : ''}
          </div>
        </div>
        <div class="hero-metrics">
          <div class="hero-metric"><strong>${number(stats.vehicles || 0)}</strong><span>Vehicles curated</span></div>
          <div class="hero-metric"><strong>${number(stats.brands || 0)}</strong><span>Marques represented</span></div>
          <div class="hero-metric"><strong>${ratingDisplay}${reviewCount ? '<em>/5</em>' : ''}</strong><span>${reviewCount ? 'Client rating' : 'No reviews yet'}</span></div>
          <div class="hero-metric"><strong>7<em> day</em></strong><span>Exchange promise</span></div>
        </div>
      </div>
    </section>

    <div class="brand-strip">
      <div class="marquee">
        <div class="marquee-track">
          ${[...brands, ...brands].map((brand) => `<a class="marquee-item" href="#/inventory?brand=${brand.id}">${esc(brand.name)}</a>`).join('')}
        </div>
      </div>
    </div>

    <section class="section">
      <div class="container">
        ${sectionHead({
          eyebrow: 'The collection',
          title: 'Exceptional, <em>by design.</em>',
          sub: 'A rotating edit of new, certified and collectible automobiles — each selected by our curators and prepared to showroom standard.',
          link: `<a class="section-link" href="#/inventory">View all ${number(stats.vehicles || 0)} vehicles ${icon('arrowRight')}</a>`
        })}
        <div class="vehicle-grid" id="featuredGrid">
          ${featured.length ? featured.map((vehicle, index) => vehicleCard(vehicle, index)).join('') : skeletonCards(8)}
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="container">
        ${sectionHead({
          eyebrow: 'Find your form',
          title: 'Built around <em>the way you move.</em>'
        })}
        <div class="category-grid">
          ${categories.map((category, index) => `<a class="category-card" href="#/inventory?category=${encodeURIComponent(category.name)}">
            <span class="category-index">${String(index + 1).padStart(2, '0')}</span>
            <div><h3>${esc(category.name)}</h3><p>${esc(CATEGORY_COPY[category.name] || 'A considered selection of exceptional automobiles.')}</p></div>
            <span class="category-arrow">${icon('arrowUpRight')}</span>
            <span class="category-count" style="position:absolute;right:26px;top:24px;color:var(--gold);font-size:9px;letter-spacing:.12em">${number(category.count)} AVAILABLE</span>
          </a>`).join('')}
        </div>
      </div>
    </section>

    <section class="section experience">
      <div class="container experience-grid">
        <div class="experience-copy">
          <span class="eyebrow">The AniissAuto standard</span>
          <h2 class="section-title">More than a showroom. <em>A standard.</em></h2>
          <p class="sub">Every automobile passes a 172-point inspection and a full detail before it meets you. Our specialists handle the paperwork, transport and aftercare — quietly, precisely, completely.</p>
          <div class="experience-list">
            <div class="experience-item">
              <span class="experience-icon">${icon('shield')}</span>
              <div><h3>Certified provenance</h3><p>A documented history check, independent inspection and mileage verification on every vehicle.</p></div>
            </div>
            <div class="experience-item">
              <span class="experience-icon">${icon('key')}</span>
              <div><h3>Private presentation</h3><p>Viewings by appointment, on your schedule, with a dedicated marque specialist.</p></div>
            </div>
            <div class="experience-item">
              <span class="experience-icon">${icon('road')}</span>
              <div><h3>Concierge delivery</h3><p>Enclosed transport nationwide and a personal handover at your home or office.</p></div>
            </div>
          </div>
          <div class="experience-actions">
            <a class="btn btn-outline" href="#/about">Our approach ${icon('arrowRight')}</a>
            <button class="btn btn-ghost" type="button" data-testdrive>Request a viewing</button>
          </div>
        </div>
        <div class="experience-stage">
          ${experienceVehicle ? carArt(experienceVehicle, 'detail') : ''}
          <span class="experience-seal">${icon('sparkle')} Curated by AniissAuto</span>
          <div class="experience-stat top"><strong>${number(stats.brands || 0)}</strong><span>World marques</span></div>
          <div class="experience-stat bottom"><strong>${number(stats.inStock || 0)}</strong><span>Ready to drive</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${sectionHead({
          eyebrow: 'The marques',
          title: 'Forty houses. <em>One address.</em>',
          link: `<a class="section-link" href="#/brands">Explore every marque ${icon('arrowRight')}</a>`
        })}
        <div class="brand-grid">
          ${brands.slice(0, 12).map((brand) => `<a class="brand-card" href="#/inventory?brand=${brand.id}">
            ${brandMonogram(brand)}
            <strong>${esc(brand.name)}</strong>
            <span>${esc(brand.country)}</span>
            <span class="brand-count">${number(brand.available)} available</span>
          </a>`).join('')}
        </div>
      </div>
    </section>

    <section class="section testimonials">
      <div class="container">
        ${sectionHead({
          eyebrow: 'Owner stories',
          title: 'The drive home, <em>remembered.</em>'
        })}
        <div class="testimonial-grid">
          ${reviews.length ? reviews.map((review) => `<article class="testimonial-card">
            <div class="testimonial-stars">${stars(review.rating)}</div>
            <blockquote>“${esc(review.comment)}”</blockquote>
            <div class="testimonial-author">
              <span class="avatar">${esc(initials(review.author_name))}</span>
              <div><strong>${esc(review.author_name)}</strong><span>${esc(review.year)} ${esc(review.brand_name)} ${esc(review.model)}</span></div>
            </div>
          </article>`).join('') : emptyStateMarkup('star', 'Owner stories coming soon', 'Our first handovers are being prepared.')}
        </div>
      </div>
    </section>

    <section class="section cta-wrap">
      <div class="container">
        <div class="cta-band">
          <div class="cta-copy">
            <span class="eyebrow no-line">A private appointment</span>
            <h2>Your next car deserves <em>an occasion.</em></h2>
            <p>Tell us what you are looking for. We will curate a shortlist, arrange the drive and take care of every detail.</p>
          </div>
          <div class="cta-actions">
            <button class="btn btn-gold btn-lg" type="button" data-testdrive>Book a test drive ${icon('arrowRight')}</button>
            <a class="btn btn-outline btn-lg" href="#/contact">Speak with a specialist</a>
          </div>
        </div>
      </div>
    </section>
  `, token);
}
