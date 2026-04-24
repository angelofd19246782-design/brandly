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

const renderStars = (score, count) => {
  if (!score) return `<span class="no-rating">No reviews yet</span>`;
  const full = Math.round(score);
  const stars = '★'.repeat(full) + '☆'.repeat(5 - full);
  return `<span class="stars">${stars}</span>`;
};

const escHtml = (s) => {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

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

// ── Init nav on every page ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await getUser();
  renderNav(user);
});
