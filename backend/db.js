const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'visitor_app',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'app_password',
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        page TEXT NOT NULL DEFAULT '/',
        visited_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

async function addVisit(page = '/') {
  const { rows } = await pool.query(
    'INSERT INTO visits (page) VALUES ($1) RETURNING id',
    [page]
  );
  return rows[0];
}

async function getVisitCount() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM visits');
  return rows[0].count;
}

async function addMessage(name, message) {
  const { rows } = await pool.query(
    'INSERT INTO messages (name, message) VALUES ($1, $2) RETURNING *',
    [name, message]
  );
  return rows[0];
}

async function getMessages(limit = 50) {
  const { rows } = await pool.query(
    'SELECT * FROM messages ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return rows;
}

module.exports = { initDb, addVisit, getVisitCount, addMessage, getMessages };
