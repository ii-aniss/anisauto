import {
  state, api, esc, safeHex, number, icon, carArt, brandMonogram, toast
} from '../utils.js';
import { paint, pageHero, heroStat, sectionHead, emptyStateMarkup } from './shared.js';

export async function renderBrands(_params, token) {
  const brands = state.brands || [];
  const stats = state.stats || {};
  const painted = paint(`
    ${pageHero({
      eyebrow: 'The marques',
      title: 'Forty houses. <em>One address.</em>',
      lede: 'From the first sports car to the modern hypercar, explore every marque represented in the AniissAuto collection.',
      aside: `${heroStat(number(stats.brands || brands.length), 'Marques')}<span class="page-hero-divider"></span>${heroStat(number(stats.vehicles || 0), 'Automobiles')}`
    })}
    <section class="brands-page">
      <div class="container">
        ${brands.length ? `<div class="brands-page-grid">
          ${brands.map((brand) => `<a class="brand-tile" href="#/inventory?brand=${brand.id}" style="--brand:${safeHex(brand.logo_color)}">
            <div class="brand-tile-top">
              ${brandMonogram(brand)}
              <span class="brand-tile-country">${esc(brand.country)}</span>
            </div>
            <h3>${esc(brand.name)}</h3>
            <p>${esc(brand.tagline || 'An exceptional marque, curated by AniissAuto.')}</p>
            <div class="brand-tile-foot">
              <span><strong>${number(brand.vehicles)}</strong> vehicles · ${number(brand.available)} available</span>
              <span class="brand-tile-arrow">${icon('arrowUpRight')}</span>
            </div>
          </a>`).join('')}
        </div>` : emptyStateMarkup('car', 'The marque directory is being prepared', 'Please return shortly for the full collection.')}
      </div>
    </section>
  `, token);
  return painted;
}

export async function renderAbout(_params, token) {
  const stats = state.stats || {};
  const heroCar = {
    category: 'Sports',
    brand_name: 'AniissAuto',
    color_hex: '#7C8288',
    logo_color: '#D8AA5B'
  };
  const painted = paint(`
    ${pageHero({
      eyebrow: 'Our story',
      title: 'Automobiles. <em>Properly presented.</em>',
      lede: 'An independent showroom built on a simple belief: acquiring an exceptional car should feel every bit as exceptional as driving it.',
      aside: `${heroStat('2008', 'Established')}<span class="page-hero-divider"></span>${heroStat(number(stats.brands || 40), 'Marques')}<span class="page-hero-divider"></span>${heroStat('17', 'Specialists')}`
    })}
    <section class="about-page">
      <div class="container">
        <div class="about-story">
          <div class="about-story-art">
            ${carArt(heroCar, 'detail')}
            <div class="about-stamp"><span>18</span><small>Years of<br>curation</small></div>
          </div>
          <div class="about-copy">
            <span class="eyebrow">An independent house</span>
            <h2 class="section-title">A quieter way to <em>buy beautifully.</em></h2>
            <p>AniissAuto began in 2008 with a single showroom, a small collection and an unfashionable idea: slow down. No pressure, no theatre, no noise. Just extraordinary automobiles, presented honestly and sold by people who genuinely love them.</p>
            <p>Today we represent forty marques and curate more than four hundred vehicles, from daily drivers to limited-run collectibles. What has not changed is the standard: every car is inspected, documented and prepared as if it were staying with us.</p>
            <div class="hero-actions">
              <a class="btn btn-gold" href="#/inventory">Explore the collection ${icon('arrowRight')}</a>
              <a class="btn btn-outline" href="#/contact">Meet the team</a>
            </div>
          </div>
        </div>

        <div class="about-values">
          <div class="value-card"><span class="num">01</span><h3>Curation, not volume</h3><p>We would rather offer one exceptional example than ten ordinary ones. Every listing earns its place.</p></div>
          <div class="value-card"><span class="num">02</span><h3>Radical transparency</h3><p>Inspection reports, provenance and pricing are shared before you ask. No surprises in the handover.</p></div>
          <div class="value-card"><span class="num">03</span><h3>Prepared to a standard</h3><p>A 172-point mechanical review and a full cosmetic detail precede every delivery, without exception.</p></div>
          <div class="value-card"><span class="num">04</span><h3>Here after the sale</h3><p>Your specialist remains available for servicing, collection care and the next acquisition.</p></div>
        </div>

        <div class="about-numbers">
          <div class="about-number"><strong>${number(stats.vehicles || 0)}</strong><span>Automobiles curated</span></div>
          <div class="about-number"><strong>${number(stats.brands || 0)}</strong><span>World marques</span></div>
          <div class="about-number"><strong>${Number(stats.reviews) && stats.avgRating != null ? Number(stats.avgRating).toFixed(1) : '—'}</strong><span>Average owner rating</span></div>
          <div class="about-number"><strong>${number(stats.reviews || 0)}</strong><span>Verified experiences</span></div>
        </div>

        <div id="team">
          ${sectionHead({
            eyebrow: 'The people',
            title: 'Specialists, <em>not salespeople.</em>',
            sub: 'A small team of marque experts, finance specialists and delivery concierges.'
          })}
          <div class="team-grid">
            <article class="team-card"><div class="team-avatar">AA</div><h3>Amir Aniiss</h3><span>Founder &amp; Curator</span><p>Three decades of collecting and an unreasonable eye for patina.</p></article>
            <article class="team-card"><div class="team-avatar">NL</div><h3>Nadia Laurent</h3><span>Head of Client Experience</span><p>Formerly of two European ateliers. Believes the handover is part of the car.</p></article>
            <article class="team-card"><div class="team-avatar">JM</div><h3>James Mercer</h3><span>Master Technician</span><p>Leads the 172-point inspection programme and our preparation workshop.</p></article>
            <article class="team-card"><div class="team-avatar">SK</div><h3>Sara Khoury</h3><span>Finance Director</span><p>Structures considered ownership plans for collectors and first-time buyers alike.</p></article>
          </div>
        </div>
      </div>
    </section>
    <section class="section cta-wrap" style="padding-top:20px">
      <div class="container">
        <div class="cta-band">
          <div class="cta-copy">
            <span class="eyebrow no-line">Visit us</span>
            <h2>Experience the collection <em>in person.</em></h2>
            <p>Private appointments seven days a week. Tell us what you are looking for and we will have it waiting.</p>
          </div>
          <div class="cta-actions">
            <button class="btn btn-gold btn-lg" type="button" data-testdrive>Book an appointment ${icon('arrowRight')}</button>
            <a class="btn btn-outline btn-lg" href="#/contact">Plan your visit</a>
          </div>
        </div>
      </div>
    </section>
  `, token);
  return painted;
}

export async function renderContact(_params, token) {
  const settings = state.settings || {};
  const user = state.user;
  const phone = String(settings.phone || '');
  const email = String(settings.email || 'hello@aniissauto.com');
  const address = String(settings.address || '88 Velocity Boulevard, Beverly Hills, CA');
  const painted = paint(`
    ${pageHero({
      eyebrow: 'Concierge',
      title: 'A conversation, <em>not a transaction.</em>',
      lede: 'Tell us what you are considering, and a specialist will respond personally — usually within one business hour.'
    })}
    <section class="contact-page">
      <div class="container contact-layout">
        <div class="contact-info">
          <span class="eyebrow">The showroom</span>
          <h2 class="section-title" style="margin-top:12px">Come and see <em>for yourself.</em></h2>
          <p>Private viewings, trade-in appraisals, finance conversations and collection consultations. By appointment, seven days a week.</p>
          <div class="contact-cards">
            <div class="contact-card"><span class="contact-card-icon">${icon('pin')}</span><div><h3>Address</h3><p>${esc(address)}</p></div></div>
            <div class="contact-card"><span class="contact-card-icon">${icon('phone')}</span><div><h3>Telephone</h3><a href="tel:${esc(phone.replace(/[^\d+]/g, ''))}">${esc(phone)}</a></div></div>
            <div class="contact-card"><span class="contact-card-icon">${icon('mail')}</span><div><h3>Email</h3><a href="mailto:${esc(email)}">${esc(email)}</a></div></div>
            <div class="contact-card"><span class="contact-card-icon">${icon('clock')}</span><div><h3>Hours</h3><p>${esc(settings.hours || 'Mon–Sat 9–8 · Sun 10–5')}</p></div></div>
          </div>
          <div class="contact-map"><span>${esc(address)}</span></div>
        </div>
        <div class="contact-form-panel">
          <h2>Send a private enquiry</h2>
          <p>Every message is read by a specialist, not a queue.</p>
          <form id="contactForm" novalidate>
            <div class="form-grid">
              <div class="field">
                <label for="contactName">Full name</label>
                <input id="contactName" name="name" type="text" value="${esc(user?.name || '')}" autocomplete="name" required>
              </div>
              <div class="field">
                <label for="contactEmail">Email</label>
                <input id="contactEmail" name="email" type="email" value="${esc(user?.email || '')}" autocomplete="email" required>
              </div>
              <div class="field">
                <label for="contactPhone">Phone <span class="field-hint">(optional)</span></label>
                <input id="contactPhone" name="phone" type="tel" value="${esc(user?.phone || '')}" autocomplete="tel">
              </div>
              <div class="field">
                <label for="contactSubject">How can we help?</label>
                <select id="contactSubject" name="subject" required>
                  <option value="General enquiry">General enquiry</option>
                  <option value="Vehicle availability">Vehicle availability</option>
                  <option value="Book a private viewing">Book a private viewing</option>
                  <option value="Trade-in appraisal">Trade-in appraisal</option>
                  <option value="Finance and ownership">Finance and ownership</option>
                  <option value="Concierge delivery">Concierge delivery</option>
                  <option value="Aftercare and servicing">Aftercare and servicing</option>
                </select>
              </div>
              <div class="field full">
                <label for="contactMessage">Your message</label>
                <textarea id="contactMessage" name="message" minlength="5" maxlength="2000" placeholder="Tell us about the vehicle or experience you have in mind…" required></textarea>
              </div>
            </div>
            <label class="form-consent"><input type="checkbox" id="contactConsent" required> I agree to be contacted by AniissAuto about this enquiry. My details will never be sold.</label>
            <button class="btn btn-gold" type="submit" id="contactSubmit">Send enquiry ${icon('send')}</button>
            <p class="form-status" id="contactStatus" role="status"></p>
          </form>
        </div>
      </div>
    </section>
  `, token);
  if (!painted) return false;

  document.querySelector('#contactForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector('#contactStatus');
    const button = document.querySelector('#contactSubmit');
    if (!form.reportValidity()) return;
    if (!document.querySelector('#contactConsent').checked) {
      status.classList.add('error');
      status.textContent = 'Please agree to be contacted so we can reply.';
      return;
    }
    status.classList.remove('error');
    status.textContent = '';
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const data = await api('/api/contact', {
        method: 'POST',
        body: {
          name: document.querySelector('#contactName').value.trim(),
          email: document.querySelector('#contactEmail').value.trim(),
          phone: document.querySelector('#contactPhone').value.trim(),
          subject: document.querySelector('#contactSubject').value,
          message: document.querySelector('#contactMessage').value.trim()
        }
      });
      status.textContent = data.message;
      toast('Your message has been received.', 'success');
      document.querySelector('#contactMessage').value = '';
      document.querySelector('#contactConsent').checked = false;
    } catch (error) {
      status.classList.add('error');
      status.textContent = error.message;
    } finally {
      button.disabled = false;
      button.innerHTML = `Send enquiry ${icon('send')}`;
    }
  });
  return true;
}
