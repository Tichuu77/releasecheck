const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS releases (
      id        SERIAL PRIMARY KEY,
      name      VARCHAR(255) NOT NULL,
      date      TIMESTAMPTZ  NOT NULL,
      additional_info TEXT,
      steps_completed JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Database initialised');
};

module.exports = { pool, initDb };
