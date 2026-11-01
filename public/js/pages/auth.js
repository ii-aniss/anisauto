import { state, api, esc, icon, carArt, toast } from '../utils.js';
import { paint } from './shared.js';

function authVisual() {
  const car = {
    category: 'Sports',
    brand_name: 'AniissAuto',
    color_hex: '#8B929B',
    logo_color: '#D8AA5B'
  };
  return `<div class="auth-visual">
    <div class="auth-visual-car">${carArt(car, 'detail')}</div>
    <div class="auth-visual-content">
      <p class="auth-quote">“The right car is not a purchase. It is <em>a relationship.</em>”</p>
      <p>ANISSAUTO · BEVERLY HILLS · EST. 2008</p>
      <div class="auth-visual-badges">
        <span class="auth-badge">${icon('shield')} 172-point inspection</span>
        <span class="auth-badge">${icon('key')} Concierge handover</span>
        <span class="auth-badge">${icon('refresh')} 7-day exchange</span>
      </div>
    </div>
  </div>`;
}

export async function renderAuth(mode, _params, token) {
  const isLogin = mode === 'login';
  const title = isLogin ? 'Welcome back.' : 'Join the inner circle.';
  const subtitle = isLogin
    ? 'Sign in to manage reservations, save vehicles and follow your test drives.'
    : 'Create an account to reserve vehicles, build your garage and arrange private viewings.';

  const painted = paint(`
    <section class="auth-page">
      ${authVisual()}
      <div class="auth-main">
        <div class="auth-card">
          <span class="eyebrow">${isLogin ? 'Client access' : 'New account'}</span>
          <h1 class="auth-title">${title}</h1>
          <p class="auth-sub">${subtitle}</p>
          <form class="auth-form" id="authForm" data-mode="${mode}" novalidate>
            ${!isLogin ? `<div class="field">
              <label for="authName">Full name</label>
              <input id="authName" name="name" type="text" autocomplete="name" placeholder="Your full name" required>
            </div>` : ''}
            ${!isLogin ? `<div class="field">
              <label for="authPhone">Phone <span class="field-hint">(optional)</span></label>
              <input id="authPhone" name="phone" type="tel" autocomplete="tel" placeholder="+1 555 000 0000">
            </div>` : ''}
            <div class="field">
              <label for="authEmail">${isLogin ? 'Email or username' : 'Email'}</label>
              <input id="authEmail" name="email" type="${isLogin ? 'text' : 'email'}" autocomplete="${isLogin ? 'username' : 'email'}" placeholder="${isLogin ? 'you@domain.com or username' : 'you@domain.com'}" required>
            </div>
            <div class="field">
              <label for="authPassword">Password</label>
              <div class="password-wrap">
                <input id="authPassword" name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" placeholder="${isLogin ? 'Your password' : 'At least 8 characters'}" minlength="8" required>
                <button class="password-toggle" type="button" data-password-toggle="authPassword" aria-label="Show password">${icon('eye')}</button>
              </div>
            </div>
            ${!isLogin ? `<div class="field">
              <label for="authPasswordConfirm">Confirm password</label>
              <div class="password-wrap">
                <input id="authPasswordConfirm" name="passwordConfirm" type="password" autocomplete="new-password" placeholder="Repeat your password" minlength="8" required>
                <button class="password-toggle" type="button" data-password-toggle="authPasswordConfirm" aria-label="Show password">${icon('eye')}</button>
              </div>
            </div>` : ''}
            <button class="btn btn-gold" type="submit" id="authSubmit">${isLogin ? 'Sign in' : 'Create account'} ${icon('arrowRight')}</button>
            <p class="form-status error" id="authStatus" role="status"></p>
          </form>
          <p class="auth-switch">${isLogin
            ? 'New to AniissAuto? <a href="#/register">Create an account</a>'
            : 'Already have an account? <a href="#/login">Sign in</a>'}</p>
          <p class="auth-demo-note">${icon('lock')} Passwords are salted and hashed. Your session uses a secure, HttpOnly cookie and expires automatically.</p>
          <p class="auth-switch" style="border:0;padding-top:10px;margin-top:10px">Showroom staff? <a href="/admin">Open the admin portal</a></p>
        </div>
      </div>
    </section>
  `, token);
  if (!painted) return;

  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.querySelector(`#${button.dataset.passwordToggle}`);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.innerHTML = icon(show ? 'eyeOff' : 'eye');
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  document.querySelector('#authForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const status = document.querySelector('#authStatus');
    const submit = document.querySelector('#authSubmit');
    const email = document.querySelector('#authEmail').value.trim();
    const password = document.querySelector('#authPassword').value;
    const name = document.querySelector('#authName')?.value.trim();
    const phone = document.querySelector('#authPhone')?.value.trim();
    const confirm = document.querySelector('#authPasswordConfirm')?.value;

    if (!isLogin && password !== confirm) {
      status.textContent = 'Those passwords do not match.';
      return;
    }

    status.textContent = '';
    submit.disabled = true;
    submit.textContent = isLogin ? 'Signing in…' : 'Creating account…';

    try {
      const data = isLogin
        ? await api('/api/login', { method: 'POST', body: { identifier: email, password } })
        : await api('/api/register', { method: 'POST', body: { name, email, phone, password } });
      state.user = data.user;
      state.favorites = new Set((data.favorites || []).map(Number));
      const after = sessionStorage.getItem('aniiss_after_login');
      sessionStorage.removeItem('aniiss_after_login');
      toast(isLogin ? `Welcome back, ${data.user.name.split(' ')[0]}.` : 'Welcome to AniissAuto.', 'success');
      window.location.hash = after && after !== '#/login' && after !== '#/register' ? after : '#/account';
    } catch (error) {
      status.textContent = error.message;
      submit.disabled = false;
      submit.innerHTML = `${isLogin ? 'Sign in' : 'Create account'} ${icon('arrowRight')}`;
    }
  });
}
