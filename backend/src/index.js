require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path'); // 👈 ADD THIS
const { initDb } = require('./db');
const releasesRouter = require('./routes/releases');

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── Middleware ─────────────────────────────────────────────────── */

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));

app.use(express.json());

/* ── API Routes ─────────────────────────────────────────────────── */

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/releases', releasesRouter);

/* ── Serve Frontend (ADD THIS BLOCK) ────────────────────────────── */

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── Start ──────────────────────────────────────────────────────── */

if (require.main === module) {
  initDb()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to initialise database', err);
      process.exit(1);
    });
}

module.exports = app;