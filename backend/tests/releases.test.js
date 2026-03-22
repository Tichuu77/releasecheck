/**
 * Integration tests for the releases API.
 * Requires a running PostgreSQL instance (set TEST_DATABASE_URL env var).
 * Run with: npm test
 */

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app     = require('../src/index');
const { pool, initDb } = require('../src/db');

beforeAll(async () => {
  await initDb();
  await pool.query('DELETE FROM releases'); // clean slate
});

afterAll(async () => {
  await pool.query('DELETE FROM releases');
  await pool.end();
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('GET /api/releases/steps', () => {
  it('returns step definitions', async () => {
    const res = await request(app).get('/api/releases/steps');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('key');
    expect(res.body[0]).toHaveProperty('label');
  });
});

describe('Releases CRUD', () => {
  let createdId;

  it('POST /api/releases — creates a release', async () => {
    const res = await request(app).post('/api/releases').send({
      name: 'Version 1.0.0',
      date: '2026-04-01T10:00:00Z',
      additional_info: 'Initial release',
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Version 1.0.0');
    expect(res.body.status).toBe('planned');
    createdId = res.body.id;
  });

  it('POST /api/releases — rejects missing fields', async () => {
    const res = await request(app).post('/api/releases').send({ name: 'No date' });
    expect(res.status).toBe(400);
  });

  it('GET /api/releases — lists releases', async () => {
    const res = await request(app).get('/api/releases');
    expect(res.status).toBe(200);
    expect(res.body.some(r => r.id === createdId)).toBe(true);
  });

  it('GET /api/releases/:id — fetches one release', async () => {
    const res = await request(app).get(`/api/releases/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  it('PUT /api/releases/:id — updates steps → status becomes ongoing', async () => {
    const res = await request(app).put(`/api/releases/${createdId}`).send({
      steps_completed: { prs_merged: true },
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ongoing');
  });

  it('PUT /api/releases/:id — all steps done → status becomes done', async () => {
    const allSteps = {
      prs_merged: true, changelog_updated: true, tests_passing: true,
      github_release: true, deployed_demo: true, tested_demo: true,
      deployed_prod: true, docs_updated: true, stakeholders_notified: true,
      monitoring_set: true,
    };
    const res = await request(app).put(`/api/releases/${createdId}`).send({
      steps_completed: allSteps,
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  it('DELETE /api/releases/:id — removes the release', async () => {
    const res = await request(app).delete(`/api/releases/${createdId}`);
    expect(res.status).toBe(204);
  });

  it('GET /api/releases/:id — 404 after delete', async () => {
    const res = await request(app).get(`/api/releases/${createdId}`);
    expect(res.status).toBe(404);
  });
});
