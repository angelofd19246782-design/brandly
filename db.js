require('dotenv').config();
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    })
  : new Pool({
      host:     process.env.PGHOST,
      port:     parseInt(process.env.PGPORT || '5432'),
      user:     process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });

pool.on('error', (err) => console.error('Idle client error:', err.message));

const query = (text, params) => pool.query(text, params);

const checkConnection = async () => {
  const client = await pool.connect();
  client.release();
};

module.exports = { query, pool, checkConnection };
