/* ═══════════════════════════════════════════════════════════════
   AUTH & PREFERENCES — 4Chartz
   Handles login, session, per-user preferences, admin panel
═══════════════════════════════════════════════════════════════ */

const AUTH = {
  user: null,
  token: null,
};

// ── Token storage ─────────────────────────────────────────────────
function authSaveToken(token) { localStorage.setItem('4chartz_token', token); }
function authGetToken() { return localStorage.getItem('4chartz_token') || ''; }
function authClearToken() { localStorage.removeItem('4chartz_token'); }

// ── Authenticated fetch helper ────────────────────────────────────
async function authFetch(url, opts = {}) {
  const token = authGetToken();
  opts.headers = { ...(opts.headers || {}), 'Authorization': `Bearer ${token}` };
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  return fetch(url, opts);
}

// ── Apply preferences to UI ───────────────────────────────────────
function applyPreferences(prefs) {
  if (!prefs) return;

  // Theme
  if (prefs.theme && window.selectPalette) {
    window.selectPalette(prefs.theme);
  }
  if (prefs.customPalette && state) {
    state.customPalette = { ...state.customPalette, ...prefs.customPalette };
  }

  // Checkboxes
  const setCheck = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = val;
  };
  setCheck('toggle-callouts', prefs.showCallouts ?? true);
  setCheck('toggle-auditor', prefs.showAuditor ?? true);
  setCheck('toggle-alpha', prefs.exportAlpha ?? false);
  setCheck('toggle-zoom', prefs.zoomEnabled ?? false);

  // Upload mode
  if (prefs.uploadMode && state) {
    state.uploadMode = prefs.uploadMode;
    if (window.updateUploadUI) updateUploadUI();
  }
}

// ── Collect current UI state as preferences ───────────────────────
function collectPreferences() {
  return {
    theme: document.getElementById('chart-theme')?.value || 'original',
    showCallouts: document.getElementById('toggle-callouts')?.checked ?? true,
    showAuditor: document.getElementById('toggle-auditor')?.checked ?? true,
    exportAlpha: document.getElementById('toggle-alpha')?.checked ?? false,
    zoomEnabled: document.getElementById('toggle-zoom')?.checked ?? false,
    uploadMode: (typeof state !== 'undefined' ? state.uploadMode : null) || 'vision',
    customPalette: typeof state !== 'undefined' ? state.customPalette : null,
  };
}

// ── Debounced preference save ─────────────────────────────────────
let _prefSaveTimer = null;
function schedulePrefSave() {
  if (!AUTH.token) return;
  clearTimeout(_prefSaveTimer);
  _prefSaveTimer = setTimeout(async () => {
    const prefs = collectPreferences();
    try { await authFetch('/prefs', { method: 'PUT', body: prefs }); } catch (_) {}
  }, 1200);
}

// ── Watch UI changes to auto-save preferences ─────────────────────
function hookPrefSave() {
  const ids = ['toggle-callouts', 'toggle-auditor', 'toggle-alpha', 'toggle-zoom'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', schedulePrefSave);
  });

  // Theme changes are hooked via selectPalette override below
  const origSelect = window.selectPalette;
  window.selectPalette = function(id) {
    if (origSelect) origSelect(id);
    schedulePrefSave();
  };

  // Mode button clicks
  document.getElementById('btn-mode-vision')?.addEventListener('click', schedulePrefSave);
  document.getElementById('btn-mode-data')?.addEventListener('click', schedulePrefSave);
}

// ── Update header user badge ──────────────────────────────────────
function renderUserBadge(user) {
  const badge = document.getElementById('user-badge');
  const letter = document.getElementById('user-avatar-letter');
  const name = document.getElementById('user-badge-name');
  const adminBtn = document.getElementById('btn-open-admin');

  if (!badge) return;
  badge.style.display = 'flex';
  if (letter) letter.textContent = (user.name || user.email).charAt(0).toUpperCase();
  if (name) name.textContent = user.name || user.email.split('@')[0];
  if (adminBtn) adminBtn.style.display = user.role === 'admin' ? 'flex' : 'none';
}

// ── Tab switcher ─────────────────────────────────────────────────
window.switchLoginTab = function(tab) {
  document.getElementById('form-login').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'flex' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
};

// ── Remember me ───────────────────────────────────────────────────
function loadRememberedEmail() {
  const email = localStorage.getItem('4chartz_remember_email');
  const remember = !!email;
  if (email) document.getElementById('login-email').value = email;
  const cb = document.getElementById('login-remember');
  if (cb) cb.checked = remember;
}

function saveRememberedEmail(email, remember) {
  if (remember) localStorage.setItem('4chartz_remember_email', email);
  else localStorage.removeItem('4chartz_remember_email');
}

// ── Register flow ─────────────────────────────────────────────────
async function doRegister() {
  const name = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const errEl = document.getElementById('reg-error');
  const btnLabel = document.getElementById('btn-register-label');
  const btn = document.getElementById('btn-register');

  errEl.style.display = 'none';
  if (!name || !email || !password) {
    errEl.textContent = 'Preencha todos os campos.'; errEl.style.display = 'block'; return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Senha deve ter ao menos 6 caracteres.'; errEl.style.display = 'block'; return;
  }

  btnLabel.textContent = 'Criando...';
  btn.disabled = true;

  try {
    const resp = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      errEl.textContent = data.error || 'Erro ao criar conta.'; errEl.style.display = 'block';
      btnLabel.textContent = 'Criar Conta'; btn.disabled = false; return;
    }
    // Auto-login após registro
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    switchLoginTab('login');
    await doLogin();
  } catch (_) {
    errEl.textContent = 'Erro de conexão.'; errEl.style.display = 'block';
    btnLabel.textContent = 'Criar Conta'; btn.disabled = false;
  }
}

// ── Login flow ────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const errorEl = document.getElementById('login-error');
  const btnLabel = document.getElementById('btn-login-label');

  if (!email || !password) {
    if (errorEl) { errorEl.textContent = 'Preencha e-mail e senha.'; errorEl.style.display = 'block'; }
    return;
  }

  if (btnLabel) btnLabel.textContent = 'Entrando...';
  const btn = document.getElementById('btn-login');
  if (btn) btn.disabled = true;

  try {
    const resp = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      if (errorEl) { errorEl.textContent = data.error || 'Falha no login.'; errorEl.style.display = 'block'; }
      if (btnLabel) btnLabel.textContent = 'Entrar';
      if (btn) btn.disabled = false;
      return;
    }

    AUTH.user = data.user;
    AUTH.token = data.token;
    authSaveToken(data.token);
    saveRememberedEmail(email, document.getElementById('login-remember')?.checked);

    // Hide login screen
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.add('login-hidden');

    renderUserBadge(data.user);

    // Load preferences and apply
    try {
      const prefsResp = await authFetch('/prefs');
      if (prefsResp.ok) {
        const prefs = await prefsResp.json();
        applyPreferences(prefs);
      }
    } catch (_) {}

    hookPrefSave();

  } catch (err) {
    if (errorEl) { errorEl.textContent = 'Erro de conexão.'; errorEl.style.display = 'block'; }
    if (btnLabel) btnLabel.textContent = 'Entrar';
    if (btn) btn.disabled = false;
  }
}

// ── Auto-login from stored token ──────────────────────────────────
async function tryAutoLogin() {
  const token = authGetToken();
  if (!token) return false;

  try {
    const resp = await fetch('/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!resp.ok) { authClearToken(); return false; }
    const { user } = await resp.json();
    AUTH.user = user;
    AUTH.token = token;
    renderUserBadge(user);

    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.add('login-hidden');

    const prefsResp = await authFetch('/prefs');
    if (prefsResp.ok) {
      const prefs = await prefsResp.json();
      // Wait a tick so PALETTES are rendered
      setTimeout(() => applyPreferences(prefs), 100);
    }

    hookPrefSave();
    return true;
  } catch (_) {
    authClearToken();
    return false;
  }
}

// ── Logout ────────────────────────────────────────────────────────
async function doLogout() {
  try { await authFetch('/auth/logout', { method: 'POST' }); } catch (_) {}
  authClearToken();
  AUTH.user = null;
  AUTH.token = null;
  const badge = document.getElementById('user-badge');
  if (badge) badge.style.display = 'none';
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.classList.remove('login-hidden');
}

// ── Profile modal ─────────────────────────────────────────────────
function openProfileModal() {
  if (!AUTH.user) return;
  const u = AUTH.user;
  document.getElementById('profile-avatar-letter').textContent = (u.name || u.email).charAt(0).toUpperCase();
  document.getElementById('profile-name').textContent = u.name;
  document.getElementById('profile-email').textContent = u.email;
  document.getElementById('profile-role').textContent = u.role === 'admin' ? '⚡ Administrador' : 'Usuário';
  document.getElementById('pw-current').value = '';
  document.getElementById('pw-new').value = '';
  document.getElementById('pw-error').style.display = 'none';
  document.getElementById('pw-success').style.display = 'none';
  document.getElementById('profile-overlay').style.display = 'flex';
}

async function savePassword() {
  const cur = document.getElementById('pw-current').value;
  const nw = document.getElementById('pw-new').value;
  const errEl = document.getElementById('pw-error');
  const okEl = document.getElementById('pw-success');
  errEl.style.display = 'none';
  okEl.style.display = 'none';

  if (!cur || !nw) { errEl.textContent = 'Preencha os campos.'; errEl.style.display = 'block'; return; }
  if (nw.length < 6) { errEl.textContent = 'Mínimo 6 caracteres.'; errEl.style.display = 'block'; return; }

  const resp = await authFetch('/auth/change-password', {
    method: 'POST',
    body: { currentPassword: cur, newPassword: nw },
  });
  const data = await resp.json();
  if (!resp.ok) { errEl.textContent = data.error || 'Erro.'; errEl.style.display = 'block'; return; }
  okEl.style.display = 'block';
  document.getElementById('pw-current').value = '';
  document.getElementById('pw-new').value = '';
  // Token was invalidated; need to re-login
  setTimeout(doLogout, 2000);
}

// ── Admin panel ───────────────────────────────────────────────────
async function openAdminPanel() {
  document.getElementById('admin-overlay').style.display = 'flex';
  await loadAdminData();
}

async function loadAdminData() {
  try {
    const resp = await authFetch('/admin/stats');
    if (!resp.ok) return;
    const stats = await resp.json();
    renderAdminKPIs(stats);
    renderRendersPerUser(stats);
    renderThemeDonut(stats);
    renderEngineDonut(stats);
    renderUsersTable(stats);
  } catch (_) {}
}

function renderAdminKPIs(stats) {
  const totalUsers = stats.length;
  const totalRenders = stats.reduce((s, u) => s + u.totalJobs, 0);
  const activeToday = stats.filter(u => {
    if (!u.lastActivity) return false;
    const d = new Date(u.lastActivity);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const wrap = document.getElementById('admin-kpi-row');
  wrap.innerHTML = [
    { label: 'Usuários', value: totalUsers, icon: '👥' },
    { label: 'Renders Totais', value: totalRenders, icon: '🎬' },
    { label: 'Ativos Hoje', value: activeToday, icon: '⚡' },
  ].map(k => `
    <div class="admin-kpi">
      <div class="admin-kpi-icon">${k.icon}</div>
      <div class="admin-kpi-value" data-target="${k.value}">0</div>
      <div class="admin-kpi-label">${k.label}</div>
    </div>
  `).join('');

  // Animate counters
  wrap.querySelectorAll('.admin-kpi-value').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let cur = 0;
    const step = Math.ceil(target / 30) || 1;
    const tick = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(tick);
    }, 30);
  });
}

function renderRendersPerUser(stats) {
  const container = document.getElementById('chart-renders-per-user');
  if (!stats.length) { container.innerHTML = '<div class="admin-empty">Sem dados</div>'; return; }

  const max = Math.max(...stats.map(u => u.totalJobs), 1);
  container.innerHTML = stats.map(u => {
    const pct = Math.round((u.totalJobs / max) * 100);
    const initials = (u.name || u.email).charAt(0).toUpperCase();
    return `
      <div class="admin-bar-row">
        <div class="admin-bar-avatar">${initials}</div>
        <div class="admin-bar-info">
          <div class="admin-bar-label">${u.name}</div>
          <div class="admin-bar-track">
            <div class="admin-bar-fill" style="width:0%" data-pct="${pct}%"></div>
          </div>
        </div>
        <div class="admin-bar-count">${u.totalJobs}</div>
      </div>
    `;
  }).join('');

  // Animate bars after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      container.querySelectorAll('.admin-bar-fill').forEach(el => {
        el.style.width = el.dataset.pct;
      });
    }, 80);
  });
}

function renderThemeDonut(stats) {
  const counts = {};
  stats.forEach(u => {
    Object.entries(u.themeCounts || {}).forEach(([theme, n]) => {
      counts[theme] = (counts[theme] || 0) + n;
    });
  });
  renderDonut('donut-themes', 'donut-themes-legend', counts, PALETTE_COLORS);
}

function renderEngineDonut(stats) {
  const counts = {};
  stats.forEach(u => {
    Object.entries(u.engineCounts || {}).forEach(([eng, n]) => {
      counts[eng] = (counts[eng] || 0) + n;
    });
  });
  renderDonut('donut-engines', 'donut-engines-legend', counts, ENGINE_COLORS);
}

const PALETTE_COLORS = {
  original: '#7c3aed', midnight: '#8B5CF6', sunset: '#F59E0B',
  ocean: '#06B6D4', minimal: '#94A3B8', corporate: '#3B82F6',
  cyber: '#F472B6', neon: '#FF00FF', emerald: '#059669',
  volcano: '#DC2626', frost: '#0EA5E9', custom: '#00c9a7',
};
const ENGINE_COLORS = { remotion: '#00c9a7', hyperframes: '#0ea5e9' };

function renderDonut(svgId, legendId, counts, colorMap) {
  const svg = document.getElementById(svgId);
  const legend = document.getElementById(legendId);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0);

  if (!total) {
    svg.innerHTML = '<text x="50" y="54" text-anchor="middle" fill="#555" font-size="10">Sem dados</text>';
    legend.innerHTML = '';
    return;
  }

  const cx = 50, cy = 50, r = 35, gap = 0.03;
  let angle = -Math.PI / 2;
  let paths = '';
  const defaultColors = ['#7c3aed','#06b6d4','#f59e0b','#22c55e','#ef4444','#0ea5e9'];

  entries.forEach(([key, val], i) => {
    const slice = (val / total) * (2 * Math.PI) - gap;
    const x1 = cx + r * Math.cos(angle + gap / 2);
    const y1 = cy + r * Math.sin(angle + gap / 2);
    const x2 = cx + r * Math.cos(angle + slice);
    const y2 = cy + r * Math.sin(angle + slice);
    const large = slice > Math.PI ? 1 : 0;
    const color = colorMap[key] || defaultColors[i % defaultColors.length];

    paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z"
      fill="${color}" opacity="0" style="transition:opacity 0.4s ${i * 0.07}s">
      <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${i * 0.07}s" fill="freeze"/>
    </path>`;

    angle += slice + gap;
  });

  // Inner circle (donut hole)
  paths += `<circle cx="${cx}" cy="${cy}" r="20" fill="#18181b"/>`;
  paths += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#f2f2f3" font-size="9" font-family="Inter,sans-serif">${total}</text>`;
  svg.innerHTML = paths;

  legend.innerHTML = entries.slice(0, 6).map(([key, val], i) => {
    const color = colorMap[key] || defaultColors[i % defaultColors.length];
    const pct = Math.round((val / total) * 100);
    return `<div class="donut-legend-item">
      <div class="donut-legend-dot" style="background:${color}"></div>
      <span>${key}</span>
      <span class="donut-legend-pct">${pct}%</span>
    </div>`;
  }).join('');
}

function renderUsersTable(stats) {
  const container = document.getElementById('admin-users-table');
  if (!stats.length) { container.innerHTML = '<div class="admin-empty">Nenhum usuário</div>'; return; }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Usuário</th>
          <th>Renders</th>
          <th>Estilo Fav.</th>
          <th>Engine</th>
          <th>Última atividade</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${stats.map(u => {
          const last = u.lastActivity
            ? new Date(u.lastActivity).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
            : '—';
          const isMe = AUTH.user && u.userId === AUTH.user.id;
          return `<tr>
            <td>
              <div class="admin-user-cell">
                <div class="admin-bar-avatar" style="width:28px;height:28px;font-size:12px;">${(u.name||u.email).charAt(0).toUpperCase()}</div>
                <div>
                  <div style="font-weight:600;font-size:13px;">${u.name}</div>
                  <div style="color:var(--text-muted);font-size:11px;">${u.email}</div>
                </div>
              </div>
            </td>
            <td><span class="admin-badge">${u.totalJobs}</span></td>
            <td style="font-size:12px;">${u.favoriteTheme || '—'}</td>
            <td style="font-size:12px;">${u.favoriteEngine || '—'}</td>
            <td style="font-size:12px;color:var(--text-muted);">${last}</td>
            <td>
              ${isMe ? '' : `<button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;" onclick="adminResetPw('${u.userId}','${u.name}')">Reset senha</button>`}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

window.adminResetPw = async function(userId, name) {
  const pw = prompt(`Nova senha para ${name}:`);
  if (!pw || pw.length < 6) { alert('Mínimo 6 caracteres.'); return; }
  const resp = await authFetch(`/admin/users/${userId}/reset-password`, { method: 'POST', body: { newPassword: pw } });
  if (resp.ok) toast('Senha redefinida.', 'success');
  else { const d = await resp.json(); toast(d.error || 'Erro', 'error'); }
};


// ── First-run bootstrap mode ──────────────────────────────────────
async function checkBootstrapMode() {
  // If admin password is still placeholder, show setup form instead of login
  try {
    const resp = await fetch('/auth/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '__probe__' }),
    });
    // If we get 400 "Mínimo 6 caracteres" → bootstrap route exists (not yet set)
    // If we get 200 → that should not happen with __probe__ (too short)
    // If the user already has a real password hash, bootstrapAdmin() is a no-op
    // So we don't need to detect anything here — the bootstrap route is idempotent
    return false;
  } catch (_) {
    return false;
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadRememberedEmail();

  // Login button
  document.getElementById('btn-login')?.addEventListener('click', doLogin);
  document.getElementById('btn-register')?.addEventListener('click', doRegister);
  document.getElementById('login-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('login-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-password')?.focus(); });
  document.getElementById('reg-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

  // Header buttons
  document.getElementById('btn-logout')?.addEventListener('click', doLogout);
  document.getElementById('btn-open-profile')?.addEventListener('click', openProfileModal);
  document.getElementById('btn-open-admin')?.addEventListener('click', openAdminPanel);

  // Profile modal
  document.getElementById('btn-close-profile')?.addEventListener('click', () => document.getElementById('profile-overlay').style.display = 'none');
  document.getElementById('btn-close-profile-cancel')?.addEventListener('click', () => document.getElementById('profile-overlay').style.display = 'none');
  document.getElementById('btn-save-password')?.addEventListener('click', savePassword);

  // Admin modal
  document.getElementById('btn-close-admin')?.addEventListener('click', () => document.getElementById('admin-overlay').style.display = 'none');
  document.getElementById('btn-admin-refresh')?.addEventListener('click', loadAdminData);

  // Close modals on backdrop click
  ['profile-overlay', 'admin-overlay'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      if (e.target.id === id) document.getElementById(id).style.display = 'none';
    });
  });

  // Try auto-login
  await tryAutoLogin();
});
