require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const { initDb } = require('./db');
const releasesRouter = require('./routes/releases');

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── Middleware ─────────────────────────────────────────────────── */

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));
app.use(express.json());

/* ── Routes ─────────────────────────────────────────────────────── */

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/releases', releasesRouter);

/* ── 404 handler ────────────────────────────────────────────────── */

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

/* ── Start ──────────────────────────────────────────────────────── */

if (require.main === module) {
  initDb()
    .then(() => {
      app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to initialise database', err);
      process.exit(1);
    });
}

module.exports = app; // exported for tests
