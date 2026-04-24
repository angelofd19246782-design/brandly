// ── API wrapper ───────────────────────────────────────────────────────────────
const api = async (method, url, body) => {
  const opts = { method, headers: {} };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ── Formatting ────────────────────────────────────────────────────────────────
const formatFollowers = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
};

const formatDate = (s) => {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (s) => {
  if (!s) return '';
  const d = new Date(s), now = new Date(), diff = now - d;
  if (diff < 60_000)   return 'just now';
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago';
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const renderStars = (score) => {
  if (!score) return `<span class="no-rating">No reviews yet</span>`;
  return starsSvg(Math.round(score));
};

const escHtml = (s) => {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// ── Icon helpers ──────────────────────────────────────────────────────────────
const _ip = {
  arrowLeft:  `<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`,
  refreshCw:  `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`,
  check:      `<path d="M20 6 9 17l-5-5"/>`,
  send:       `<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>`,
  search:     `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
  msgCircle:  `<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>`,
  frown:      `<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>`,
  mapPin:     `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`,
  tiktok:     `<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>`,
  youtube:    `<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>`,
  instagram:  `<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>`,
  users:      `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  sparkles:   `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>`,
  building:   `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 0-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>`,
  mail:       `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
  star:       `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  barChart:   `<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>`,
  target:     `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
  lock:       `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
};

const icon = (name, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0">${_ip[name]}</svg>`;

const starsSvg = (score, total = 5) =>
  `<span class="stars">${Array.from({length: total}, (_, i) =>
    i < score
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:middle"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:middle;opacity:.3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  ).join('')}</span>`;

// ── Auth state ────────────────────────────────────────────────────────────────
let _user = undefined;

const getUser = async () => {
  if (_user !== undefined) return _user;
  try {
    const d = await api('GET', '/api/auth/me');
    _user = d.user;
  } catch (_) {
    _user = null;
  }
  return _user;
};

const logout = async () => {
  await api('POST', '/api/auth/logout');
  _user = null;
  window.location.href = '/';
};

// ── Nav ───────────────────────────────────────────────────────────────────────
const renderNav = (user) => {
  const el = document.getElementById('navbarNav');
  if (!el) return;

  const page = window.location.pathname;
  const link = (href, label) =>
    `<a href="${href}" class="nav-link${page === href ? ' active' : ''}">${label}</a>`;

  let links = '', auth = '';

  if (!user) {
    links = link('/catalog.html', 'Browse Bloggers');
    auth  = `${link('/login.html','Log In').replace('nav-link','btn btn-ghost btn-sm')}
             ${link('/register.html','Sign Up').replace('nav-link','btn btn-primary btn-sm')}`;
  } else if (user.role === 'advertiser') {
    links = link('/catalog.html','Browse Bloggers') + link('/chat.html','Messages');
    auth  = `<span class="nav-user">${escHtml(user.display_name)}</span>
             <button class="btn btn-ghost btn-sm" onclick="logout()">Log Out</button>`;
  } else if (user.role === 'blogger') {
    links = link('/catalog.html','Browse') + link('/edit-profile.html','My Profile') + link('/chat.html','Messages');
    auth  = `<span class="nav-user">${escHtml(user.display_name)}</span>
             <button class="btn btn-ghost btn-sm" onclick="logout()">Log Out</button>`;
  } else if (user.role === 'admin') {
    links = link('/catalog.html','Browse') + link('/admin.html','Admin Panel');
    auth  = `<span class="nav-user">Admin</span>
             <button class="btn btn-ghost btn-sm" onclick="logout()">Log Out</button>`;
  }

  el.innerHTML = `<div class="nav-links">${links}</div><div class="nav-auth">${auth}</div>`;
};

// ── Guard helpers ─────────────────────────────────────────────────────────────
const requireAuth = async (redirect) => {
  const user = await getUser();
  if (!user) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(redirect || window.location.href)}`;
    return null;
  }
  return user;
};

const requireRole = async (role) => {
  const user = await requireAuth();
  if (!user) return null;
  if (user.role !== role) { window.location.href = '/'; return null; }
  return user;
};

// ── Alert helpers ─────────────────────────────────────────────────────────────
const showAlert = (containerId, msg, type = 'error') => {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${escHtml(msg)}</div>`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

const clearAlert = (containerId) => {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '';
};

// ── Custom select component ───────────────────────────────────────────────────
function initCustomSelect(selectEl) {
  if (selectEl._csInit) return;
  selectEl._csInit = true;

  // Wrap
  const wrap = document.createElement('div');
  wrap.className = 'cs-wrap';
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(selectEl);
  selectEl.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden';

  // Trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cs-trigger';

  const valueSpan = document.createElement('span');
  valueSpan.className = 'cs-value';

  const arrow = document.createElement('span');
  arrow.className = 'cs-arrow';
  arrow.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

  trigger.appendChild(valueSpan);
  trigger.appendChild(arrow);
  wrap.appendChild(trigger);

  // Menu
  const menu = document.createElement('div');
  menu.className = 'cs-menu';
  wrap.appendChild(menu);

  const buildMenu = () => {
    menu.innerHTML = '';
    Array.from(selectEl.options).forEach((opt, idx) => {
      const item = document.createElement('div');
      item.className = 'cs-option';
      item.textContent = opt.text;
      item.dataset.value = opt.value;
      if (opt.value === selectEl.value) item.classList.add('selected');
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent blur before click registers
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        syncDisplay();
        close();
      });
      menu.appendChild(item);
    });
  };

  const syncDisplay = () => {
    const sel = selectEl.options[selectEl.selectedIndex];
    valueSpan.textContent = sel ? sel.text : '';
    menu.querySelectorAll('.cs-option').forEach(item => {
      item.classList.toggle('selected', item.dataset.value === selectEl.value);
    });
  };

  const open = () => {
    // Close all other open dropdowns first
    document.querySelectorAll('.cs-wrap.cs-open').forEach(w => {
      if (w !== wrap) w.classList.remove('cs-open');
    });
    wrap.classList.add('cs-open');
    // Flip above if not enough space below
    const rect = wrap.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    if (below < 260 && rect.top > 260) {
      menu.style.top    = 'auto';
      menu.style.bottom = '100%';
      menu.style.marginTop    = '0';
      menu.style.marginBottom = '4px';
    } else {
      menu.style.top    = '';
      menu.style.bottom = '';
      menu.style.marginTop    = '';
      menu.style.marginBottom = '';
    }
  };

  const close  = () => wrap.classList.remove('cs-open');
  const toggle = () => wrap.classList.contains('cs-open') ? close() : open();

  trigger.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape')            { close(); trigger.blur(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = selectEl.selectedIndex;
      const next = e.key === 'ArrowDown'
        ? Math.min(idx + 1, selectEl.options.length - 1)
        : Math.max(idx - 1, 0);
      selectEl.selectedIndex = next;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      syncDisplay();
    }
  });

  // Intercept programmatic el.value = ... (e.g. edit-profile.html loads saved value)
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  Object.defineProperty(selectEl, 'value', {
    get: function ()  { return desc.get.call(this); },
    set: function (v) { desc.set.call(this, v); syncDisplay(); },
    configurable: true,
  });

  // Observe option additions (catalog.html loads categories/countries via API)
  new MutationObserver(() => { buildMenu(); syncDisplay(); })
    .observe(selectEl, { childList: true });

  buildMenu();
  syncDisplay();
}

function initAllCustomSelects() {
  document.querySelectorAll('select:not([data-no-custom])').forEach(initCustomSelect);
}

// Close on outside click or Escape
document.addEventListener('click', () => {
  document.querySelectorAll('.cs-wrap.cs-open').forEach(w => w.classList.remove('cs-open'));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.cs-wrap.cs-open').forEach(w => w.classList.remove('cs-open'));
  }
});

// ── Init nav on every page ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await getUser();
  renderNav(user);
  initAllCustomSelects();
});
