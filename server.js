require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const bcrypt   = require('bcrypt');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const db                    = require('./db');
const { pool, checkConnection } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Schema init ───────────────────────────────────────────────────────────────
async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL CHECK(role IN ('advertiser','blogger','admin')),
      display_name  TEXT    NOT NULL,
      is_blocked    BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS blogger_profiles (
      id             SERIAL PRIMARY KEY,
      user_id        INTEGER UNIQUE NOT NULL REFERENCES users(id),
      display_name   TEXT,
      avatar_url     TEXT,
      bio            TEXT,
      tiktok_url     TEXT,
      youtube_url    TEXT,
      instagram_url  TEXT,
      category       TEXT,
      country        TEXT,
      city           TEXT,
      follower_count INTEGER DEFAULT 0,
      price_min      INTEGER,
      price_max      INTEGER,
      contact_info   TEXT
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id            SERIAL PRIMARY KEY,
      advertiser_id INTEGER NOT NULL REFERENCES users(id),
      blogger_id    INTEGER NOT NULL REFERENCES users(id),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(advertiser_id, blogger_id)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id              SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id),
      sender_id       INTEGER NOT NULL REFERENCES users(id),
      content         TEXT    NOT NULL,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id            SERIAL PRIMARY KEY,
      advertiser_id INTEGER NOT NULL REFERENCES users(id),
      blogger_id    INTEGER NOT NULL REFERENCES users(id),
      score         INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
      review        TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(advertiser_id, blogger_id)
    )
  `);

  const { rows } = await db.query("SELECT id FROM users WHERE role='admin'");
  if (!rows.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.query(
      'INSERT INTO users (email,password_hash,role,display_name) VALUES ($1,$2,$3,$4)',
      ['admin@brandly.com', hash, 'admin', 'Administrator']
    );
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'brandly-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// ── File upload ───────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.session.userId}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ── Auth helpers ──────────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [req.session.userId]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (user.is_blocked) return res.status(403).json({ error: 'Account is blocked' });
    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    await requireAuth(req, res, () => {
      if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
      next();
    });
  };
}

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, role, display_name } = req.body;

  if (!email || !password || !role || !display_name)
    return res.status(400).json({ error: 'All fields are required' });
  if (!['advertiser', 'blogger'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });
  if (display_name.trim().length < 2)
    return res.status(400).json({ error: 'Name must be at least 2 characters' });

  try {
    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await db.query(
      'INSERT INTO users (email,password_hash,role,display_name) VALUES ($1,$2,$3,$4) RETURNING id',
      [email.toLowerCase().trim(), hash, role, display_name.trim()]
    );
    const uid = rows[0].id;

    if (role === 'blogger') {
      await db.query(
        'INSERT INTO blogger_profiles (user_id, display_name) VALUES ($1,$2)',
        [uid, display_name.trim()]
      );
    }

    req.session.userId = uid;
    res.json({ success: true, role });
  } catch (e) {
    if (e.code === '23505')
      return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid email or password' });
    if (user.is_blocked)
      return res.status(403).json({ error: 'Your account has been blocked' });

    req.session.userId = user.id;
    res.json({ success: true, role: user.role });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const { rows } = await db.query(
      'SELECT id,email,role,display_name,created_at FROM users WHERE id=$1',
      [req.session.userId]
    );
    res.json({ user: rows[0] || null });
  } catch {
    res.json({ user: null });
  }
});

// ── Blogger catalog (public) ──────────────────────────────────────────────────
app.get('/api/bloggers', async (req, res) => {
  const { search, category, country, platform, sort = 'followers' } = req.query;

  let sql = `
    SELECT bp.*,
           ROUND(AVG(r.score)::numeric, 1) AS avg_rating,
           COUNT(r.id)                     AS rating_count
    FROM   blogger_profiles bp
    JOIN   users u ON u.id = bp.user_id
    LEFT JOIN ratings r ON r.blogger_id = bp.user_id
    WHERE  u.is_blocked = false
      AND  bp.display_name IS NOT NULL AND bp.display_name != ''
  `;
  const params = [];
  let p = 1;

  if (search) {
    const like = `%${search}%`;
    sql += ` AND (bp.display_name ILIKE $${p} OR bp.category ILIKE $${p+1} OR bp.bio ILIKE $${p+2})`;
    params.push(like, like, like);
    p += 3;
  }
  if (category) { sql += ` AND bp.category = $${p}`;  params.push(category); p++; }
  if (country)  { sql += ` AND bp.country = $${p}`;   params.push(country);  p++; }
  if (platform === 'tiktok')    sql += ` AND bp.tiktok_url    IS NOT NULL AND bp.tiktok_url    != ''`;
  if (platform === 'youtube')   sql += ` AND bp.youtube_url   IS NOT NULL AND bp.youtube_url   != ''`;
  if (platform === 'instagram') sql += ` AND bp.instagram_url IS NOT NULL AND bp.instagram_url != ''`;

  sql += ` GROUP BY bp.id`;
  if (sort === 'followers') sql += ` ORDER BY bp.follower_count DESC`;
  else if (sort === 'rating') sql += ` ORDER BY avg_rating DESC NULLS LAST`;
  else if (sort === 'name')   sql += ` ORDER BY bp.display_name ASC`;

  try {
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch bloggers' });
  }
});

app.get('/api/bloggers/:userId', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT bp.*,
             ROUND(AVG(r.score)::numeric, 1) AS avg_rating,
             COUNT(r.id)                     AS rating_count
      FROM   blogger_profiles bp
      JOIN   users u ON u.id = bp.user_id
      LEFT JOIN ratings r ON r.blogger_id = bp.user_id
      WHERE  bp.user_id = $1 AND u.is_blocked = false
      GROUP  BY bp.id
    `, [req.params.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Blogger not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch blogger' });
  }
});

app.get('/api/filters/categories', async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT category FROM blogger_profiles
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `);
    res.json(rows.map(r => r.category));
  } catch {
    res.json([]);
  }
});

app.get('/api/filters/countries', async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT country FROM blogger_profiles
      WHERE country IS NOT NULL AND country != ''
      ORDER BY country
    `);
    res.json(rows.map(r => r.country));
  } catch {
    res.json([]);
  }
});

// ── Blogger profile (own) ─────────────────────────────────────────────────────
app.get('/api/profile', requireRole('blogger'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM blogger_profiles WHERE user_id=$1', [req.user.id]);
    res.json(rows[0] || {});
  } catch {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.post('/api/profile', requireRole('blogger'), async (req, res) => {
  const {
    display_name, bio, tiktok_url, youtube_url, instagram_url,
    category, country, city, price_min, price_max, contact_info,
    follower_count, avatar_url
  } = req.body;

  if (!display_name || display_name.trim().length < 2)
    return res.status(400).json({ error: 'Display name is required (min 2 chars)' });

  try {
    const { rows: existing } = await db.query(
      'SELECT id FROM blogger_profiles WHERE user_id=$1', [req.user.id]
    );

    if (existing.length) {
      await db.query(`
        UPDATE blogger_profiles
        SET display_name=$1, bio=$2, tiktok_url=$3, youtube_url=$4, instagram_url=$5,
            category=$6, country=$7, city=$8, price_min=$9, price_max=$10, contact_info=$11
        WHERE user_id=$12
      `, [
        display_name.trim(), bio || null, tiktok_url || null, youtube_url || null,
        instagram_url || null, category || null, country || null, city || null,
        price_min ? parseInt(price_min) : null, price_max ? parseInt(price_max) : null,
        contact_info || null, req.user.id
      ]);
      if (avatar_url !== undefined && avatar_url !== null) {
        await db.query(
          'UPDATE blogger_profiles SET avatar_url=$1 WHERE user_id=$2',
          [avatar_url || null, req.user.id]
        );
      }
    } else {
      await db.query(`
        INSERT INTO blogger_profiles
          (user_id, display_name, avatar_url, bio, tiktok_url, youtube_url, instagram_url,
           category, country, city, follower_count, price_min, price_max, contact_info)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      `, [
        req.user.id, display_name.trim(), avatar_url || null, bio || null,
        tiktok_url || null, youtube_url || null, instagram_url || null,
        category || null, country || null, city || null,
        follower_count ? parseInt(follower_count) : 0,
        price_min ? parseInt(price_min) : null, price_max ? parseInt(price_max) : null,
        contact_info || null
      ]);
    }

    const { rows } = await db.query('SELECT * FROM blogger_profiles WHERE user_id=$1', [req.user.id]);
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

app.post('/api/profile/avatar', requireRole('blogger'), upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  try {
    await db.query('UPDATE blogger_profiles SET avatar_url=$1 WHERE user_id=$2', [url, req.user.id]);
    res.json({ avatar_url: url });
  } catch {
    res.status(500).json({ error: 'Failed to save avatar' });
  }
});

// ── Conversations ─────────────────────────────────────────────────────────────
app.get('/api/conversations', requireAuth, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'advertiser') {
      ({ rows } = await db.query(`
        SELECT c.*,
               u.display_name  AS other_name,
               bp.avatar_url   AS other_avatar,
               (SELECT content    FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
               (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_at
        FROM conversations c
        JOIN users u ON u.id = c.blogger_id
        LEFT JOIN blogger_profiles bp ON bp.user_id = c.blogger_id
        WHERE c.advertiser_id = $1
        ORDER BY last_at DESC NULLS LAST, c.created_at DESC
      `, [req.user.id]));
    } else if (req.user.role === 'blogger') {
      ({ rows } = await db.query(`
        SELECT c.*,
               u.display_name AS other_name,
               NULL           AS other_avatar,
               (SELECT content    FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
               (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_at
        FROM conversations c
        JOIN users u ON u.id = c.advertiser_id
        WHERE c.blogger_id = $1
        ORDER BY last_at DESC NULLS LAST, c.created_at DESC
      `, [req.user.id]));
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

app.post('/api/conversations', requireRole('advertiser'), async (req, res) => {
  const { blogger_id } = req.body;
  if (!blogger_id) return res.status(400).json({ error: 'blogger_id required' });

  try {
    const { rows: bloggerRows } = await db.query(
      "SELECT id FROM users WHERE id=$1 AND role='blogger'", [blogger_id]
    );
    if (!bloggerRows.length) return res.status(404).json({ error: 'Blogger not found' });

    try {
      const { rows } = await db.query(
        'INSERT INTO conversations (advertiser_id,blogger_id) VALUES ($1,$2) RETURNING id',
        [req.user.id, blogger_id]
      );
      res.json({ id: rows[0].id });
    } catch (e) {
      if (e.code === '23505') {
        const { rows } = await db.query(
          'SELECT id FROM conversations WHERE advertiser_id=$1 AND blogger_id=$2',
          [req.user.id, blogger_id]
        );
        res.json({ id: rows[0].id });
      } else throw e;
    }
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM conversations WHERE id=$1', [req.params.id]);
    const conv = rows[0];
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (req.user.id !== conv.advertiser_id && req.user.id !== conv.blogger_id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });
    res.json(conv);
  } catch {
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const { rows: convRows } = await db.query('SELECT * FROM conversations WHERE id=$1', [req.params.id]);
    const conv = convRows[0];
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (req.user.id !== conv.advertiser_id && req.user.id !== conv.blogger_id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });

    const { rows: messages } = await db.query(`
      SELECT m.*, u.display_name AS sender_name
      FROM   messages m
      JOIN   users u ON u.id = m.sender_id
      WHERE  m.conversation_id = $1
      ORDER  BY m.created_at ASC
    `, [req.params.id]);

    res.json({ conversation: conv, messages });
  } catch {
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const { rows: convRows } = await db.query('SELECT * FROM conversations WHERE id=$1', [req.params.id]);
    const conv = convRows[0];
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (req.user.id !== conv.advertiser_id && req.user.id !== conv.blogger_id)
      return res.status(403).json({ error: 'Forbidden' });

    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const { rows: inserted } = await db.query(
      'INSERT INTO messages (conversation_id,sender_id,content) VALUES ($1,$2,$3) RETURNING id',
      [req.params.id, req.user.id, content.trim()]
    );

    const { rows } = await db.query(`
      SELECT m.*, u.display_name AS sender_name
      FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=$1
    `, [inserted[0].id]);

    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ── Ratings ───────────────────────────────────────────────────────────────────
app.get('/api/ratings/:bloggerId', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.*, u.display_name AS advertiser_name
      FROM   ratings r
      JOIN   users u ON u.id = r.advertiser_id
      WHERE  r.blogger_id = $1
      ORDER  BY r.created_at DESC
    `, [req.params.bloggerId]);
    res.json(rows);
  } catch {
    res.json([]);
  }
});

app.get('/api/ratings/:bloggerId/mine', requireRole('advertiser'), async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM ratings WHERE advertiser_id=$1 AND blogger_id=$2',
      [req.user.id, req.params.bloggerId]
    );
    res.json(rows[0] || null);
  } catch {
    res.json(null);
  }
});

app.post('/api/ratings', requireRole('advertiser'), async (req, res) => {
  const { blogger_id, score, review } = req.body;
  if (!blogger_id || !score) return res.status(400).json({ error: 'blogger_id and score required' });

  const s = parseInt(score);
  if (s < 1 || s > 5) return res.status(400).json({ error: 'Score must be between 1 and 5' });

  try {
    const { rows: bloggerRows } = await db.query(
      "SELECT id FROM users WHERE id=$1 AND role='blogger'", [blogger_id]
    );
    if (!bloggerRows.length) return res.status(404).json({ error: 'Blogger not found' });

    try {
      await db.query(
        'INSERT INTO ratings (advertiser_id,blogger_id,score,review) VALUES ($1,$2,$3,$4)',
        [req.user.id, blogger_id, s, review ? review.trim() : null]
      );
      res.json({ success: true });
    } catch (e) {
      if (e.code === '23505') {
        await db.query(
          'UPDATE ratings SET score=$1,review=$2 WHERE advertiser_id=$3 AND blogger_id=$4',
          [s, review ? review.trim() : null, req.user.id, blogger_id]
        );
        res.json({ success: true, updated: true });
      } else throw e;
    }
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: 'Failed to save rating' });
  }
});

// ── Admin ─────────────────────────────────────────────────────────────────────
app.get('/api/admin/stats', async (_req, res) => {
  try {
    const [users, bloggers, advertisers, convs, msgs, ratings] = await Promise.all([
      db.query("SELECT COUNT(*) AS n FROM users"),
      db.query("SELECT COUNT(*) AS n FROM users WHERE role='blogger'"),
      db.query("SELECT COUNT(*) AS n FROM users WHERE role='advertiser'"),
      db.query("SELECT COUNT(*) AS n FROM conversations"),
      db.query("SELECT COUNT(*) AS n FROM messages"),
      db.query("SELECT COUNT(*) AS n FROM ratings"),
    ]);
    res.json({
      total_users:         parseInt(users.rows[0].n),
      total_bloggers:      parseInt(bloggers.rows[0].n),
      total_advertisers:   parseInt(advertisers.rows[0].n),
      total_conversations: parseInt(convs.rows[0].n),
      total_messages:      parseInt(msgs.rows[0].n),
      total_ratings:       parseInt(ratings.rows[0].n),
    });
  } catch {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.get('/api/admin/users', requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT u.id, u.email, u.role, u.display_name, u.is_blocked, u.created_at,
             bp.follower_count, bp.category
      FROM   users u
      LEFT JOIN blogger_profiles bp ON bp.user_id = u.id
      ORDER  BY u.created_at DESC
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

app.put('/api/admin/users/:id/block', requireRole('admin'), async (req, res) => {
  const { blocked } = req.body;
  try {
    const { rows } = await db.query('SELECT id,role FROM users WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (rows[0].role === 'admin') return res.status(403).json({ error: 'Cannot block admin' });
    await db.query('UPDATE users SET is_blocked=$1 WHERE id=$2', [!!blocked, req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', requireRole('admin'), async (req, res) => {
  const uid = parseInt(req.params.id);
  try {
    const { rows } = await db.query('SELECT id,role FROM users WHERE id=$1', [uid]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    if (rows[0].role === 'admin') return res.status(403).json({ error: 'Cannot delete admin' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: convs } = await client.query(
        'SELECT id FROM conversations WHERE advertiser_id=$1 OR blogger_id=$1', [uid]
      );
      for (const c of convs) {
        await client.query('DELETE FROM messages WHERE conversation_id=$1', [c.id]);
      }
      await client.query('DELETE FROM conversations WHERE advertiser_id=$1 OR blogger_id=$1', [uid]);
      await client.query('DELETE FROM ratings WHERE advertiser_id=$1 OR blogger_id=$1', [uid]);
      await client.query('DELETE FROM blogger_profiles WHERE user_id=$1', [uid]);
      await client.query('DELETE FROM messages WHERE sender_id=$1', [uid]);
      await client.query('DELETE FROM users WHERE id=$1', [uid]);
      await client.query('COMMIT');
      res.json({ success: true });
    } catch {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Delete failed' });
    } finally {
      client.release();
    }
  } catch {
    if (!res.headersSent) res.status(500).json({ error: 'Delete failed' });
  }
});

app.get('/api/admin/bloggers', requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT bp.*, u.email, u.display_name AS user_name, u.is_blocked,
             ROUND(AVG(r.score)::numeric, 1) AS avg_rating, COUNT(r.id) AS rating_count
      FROM   blogger_profiles bp
      JOIN   users u ON u.id = bp.user_id
      LEFT JOIN ratings r ON r.blogger_id = bp.user_id
      GROUP  BY bp.id, u.id
      ORDER  BY u.created_at DESC
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to load bloggers' });
  }
});

app.put('/api/admin/bloggers/:userId/followers', requireRole('admin'), async (req, res) => {
  const count = parseInt(req.body.follower_count);
  if (isNaN(count) || count < 0) return res.status(400).json({ error: 'Invalid follower count' });
  try {
    await db.query('UPDATE blogger_profiles SET follower_count=$1 WHERE user_id=$2', [count, req.params.userId]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update followers' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    console.log('Connecting to database…');
    await checkConnection();
    console.log('Database connection successful.');

    await initDb();
    console.log('Schema ready.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Brandly running on port ${PORT}`);
      console.log(`Admin login: admin@brandly.com / admin123`);
    });
  } catch (e) {
    console.error('Database connection failed:', e.message);
    console.error('Failed to start server:', e.message);
    process.exit(1);
  }
}

startServer();
