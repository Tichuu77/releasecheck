const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const { STEPS, computeStatus } = require('../steps');

/* ── helpers ──────────────────────────────────────────────────── */

const formatRelease = (row) => ({
  id:              row.id,
  name:            row.name,
  date:            row.date,
  additional_info: row.additional_info,
  steps_completed: row.steps_completed || {},
  status:          computeStatus(row.steps_completed),
  created_at:      row.created_at,
  updated_at:      row.updated_at,
});

/* ── GET /api/releases ─────────────────────────────────────────── */

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM releases ORDER BY date DESC'
    );
    res.json(rows.map(formatRelease));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

/* ── GET /api/releases/steps ───────────────────────────────────── */
// Return the step definitions so the frontend stays in sync

router.get('/steps', (_req, res) => {
  res.json(STEPS);
});

/* ── GET /api/releases/:id ─────────────────────────────────────── */

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM releases WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Release not found' });
    res.json(formatRelease(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch release' });
  }
});

/* ── POST /api/releases ────────────────────────────────────────── */

router.post('/', async (req, res) => {
  const { name, date, additional_info } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: 'name and date are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO releases (name, date, additional_info, steps_completed)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), date, additional_info || null, '{}']
    );
    res.status(201).json(formatRelease(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create release' });
  }
});

/* ── PUT /api/releases/:id ─────────────────────────────────────── */

router.put('/:id', async (req, res) => {
  const { name, date, additional_info, steps_completed } = req.body;

  try {
    // Fetch current record first
    const current = await pool.query('SELECT * FROM releases WHERE id = $1', [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: 'Release not found' });

    const cur = current.rows[0];

    const newName    = name            !== undefined ? name.trim()        : cur.name;
    const newDate    = date            !== undefined ? date               : cur.date;
    const newInfo    = additional_info !== undefined ? additional_info    : cur.additional_info;
    const newSteps   = steps_completed !== undefined ? steps_completed    : cur.steps_completed;

    const { rows } = await pool.query(
      `UPDATE releases
       SET name = $1, date = $2, additional_info = $3,
           steps_completed = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [newName, newDate, newInfo, JSON.stringify(newSteps), req.params.id]
    );
    res.json(formatRelease(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update release' });
  }
});

/* ── DELETE /api/releases/:id ──────────────────────────────────── */

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM releases WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Release not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete release' });
  }
});

module.exports = router;
