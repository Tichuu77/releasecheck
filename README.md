# ReleaseCheck

> Your all-in-one release checklist tool — track every step of your software releases in one clean interface.

![ReleaseCheck screenshot](./releasecheck.png)

---

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Running locally](#running-locally)
  - [Option A — Docker Compose (recommended)](#option-a--docker-compose-recommended)
  - [Option B — Manual setup](#option-b--manual-setup)
- [Running tests](#running-tests)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Project structure](#project-structure)

---

## Overview

ReleaseCheck is a single-page application that helps developers manage their release process. Each **release** tracks a fixed checklist of 10 steps. The release status (`planned` / `ongoing` / `done`) is computed automatically from the steps:

| Steps completed | Status    |
|-----------------|-----------|
| 0               | `planned` |
| 1–9             | `ongoing` |
| 10/10           | `done`    |

**Features:**
- View all releases with live status badges and progress bars
- Create a release (name, due date, optional notes)
- Check / uncheck individual steps — status updates instantly
- Edit additional remarks at any time
- Delete a release
- Fully responsive UI

---

## Tech stack

| Layer    | Technology                            |
|----------|---------------------------------------|
| Frontend | React 18 + Vite, plain CSS            |
| Backend  | Node.js + Express                     |
| Database | PostgreSQL 16                         |
| Hosting  | Vercel (frontend) + Render (backend)  |
| CI       | GitHub Actions (optional)             |

---

## Running locally

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **Docker + Docker Compose** (for Option A) OR a running PostgreSQL instance (for Option B)

---

### Option A — Docker Compose (recommended)

```bash
# Clone the repo
git clone https://github.com/your-username/releasecheck.git
cd releasecheck

# Start everything (database + API + frontend dev server)
docker compose up --build
```

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:5173     |
| API      | http://localhost:4000/api |
| Postgres | localhost:5432            |

The database schema is created automatically on first run.

---

### Option B — Manual setup

#### 1. Database

Create a PostgreSQL database and note the connection string:

```
postgresql://user:password@localhost:5432/releasecheck
```

#### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and optionally PORT / FRONTEND_URL

# Start the API (auto-creates the database table)
npm run dev          # development (nodemon)
# or
npm start            # production
```

The API will be available at `http://localhost:4000`.

#### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# (Optional) set the API base URL — defaults to /api proxied by Vite
# Create frontend/.env.local with:
# VITE_API_URL=http://localhost:4000/api

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Running tests

The backend has an integration test suite using **Jest** + **Supertest**.

```bash
cd backend
npm install

# Point to a real Postgres instance (can be the same as dev or a separate test DB)
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/releasecheck_test npm test
```

Tests cover:
- Health endpoint
- Step definitions endpoint
- Full CRUD lifecycle (create → read → update steps → status transitions → delete)

---

## Database schema

### `releases`

| Column            | Type         | Notes                                      |
|-------------------|--------------|--------------------------------------------|
| `id`              | `SERIAL`     | Primary key                                |
| `name`            | `VARCHAR(255)` | Mandatory                                |
| `date`            | `TIMESTAMPTZ` | Due date, mandatory                       |
| `additional_info` | `TEXT`       | Optional free-text notes                   |
| `steps_completed` | `JSONB`      | Map of step key → boolean, default `{}`   |
| `created_at`      | `TIMESTAMPTZ` | Set on insert                             |
| `updated_at`      | `TIMESTAMPTZ` | Updated on every write                    |

Steps are **not** stored in a separate table — they are a fixed, ordered list defined in `backend/src/steps.js`. The `steps_completed` column stores only the completion flags (e.g. `{"prs_merged": true, "tests_passing": true}`). This avoids migration complexity while keeping the data fully queryable.

### Step keys

| # | Key                    | Label                                              |
|---|------------------------|----------------------------------------------------|
| 1 | `prs_merged`           | All relevant GitHub pull requests have been merged |
| 2 | `changelog_updated`    | CHANGELOG.md files have been updated               |
| 3 | `tests_passing`        | All tests are passing                              |
| 4 | `github_release`       | Release created on GitHub                          |
| 5 | `deployed_demo`        | Deployed in demo environment                       |
| 6 | `tested_demo`          | Tested thoroughly in demo                          |
| 7 | `deployed_prod`        | Deployed in production                             |
| 8 | `docs_updated`         | Documentation updated                              |
| 9 | `stakeholders_notified`| Stakeholders notified                              |
|10 | `monitoring_set`       | Post-release monitoring confirmed                  |

---

## API reference

Base URL: `/api`

All requests and responses use `Content-Type: application/json`.

---

### `GET /api/health`

Returns `{ "ok": true }`. Use for uptime checks.

---

### `GET /api/releases/steps`

Returns the ordered list of step definitions shared by all releases.

**Response 200**
```json
[
  { "key": "prs_merged", "label": "All relevant GitHub pull requests have been merged" },
  { "key": "changelog_updated", "label": "CHANGELOG.md files have been updated" }
]
```

---

### `GET /api/releases`

Returns all releases, newest first.

**Response 200** — array of release objects (see shape below).

---

### `GET /api/releases/:id`

Returns a single release.

**Response 200**
```json
{
  "id": 1,
  "name": "Version 1.0.1",
  "date": "2022-09-20T00:00:00.000Z",
  "additional_info": "Hotfix for login bug",
  "steps_completed": {
    "prs_merged": true,
    "changelog_updated": true,
    "tests_passing": false
  },
  "status": "ongoing",
  "created_at": "2022-09-01T10:00:00.000Z",
  "updated_at": "2022-09-18T14:30:00.000Z"
}
```

**Response 404** — release not found.

---

### `POST /api/releases`

Creates a new release.

**Request body**
```json
{
  "name": "Version 2.0.0",
  "date": "2026-06-01T09:00:00Z",
  "additional_info": "Major rewrite"
}
```

| Field             | Type     | Required |
|-------------------|----------|----------|
| `name`            | `string` | ✅       |
| `date`            | `string` (ISO 8601) | ✅ |
| `additional_info` | `string` | ❌       |

**Response 201** — the created release object.  
**Response 400** — validation error.

---

### `PUT /api/releases/:id`

Updates any combination of fields. All fields are optional — only provided fields are changed.

**Request body** (any subset)
```json
{
  "name": "Version 2.0.1",
  "date": "2026-06-15T09:00:00Z",
  "additional_info": "Patch notes",
  "steps_completed": {
    "prs_merged": true,
    "tests_passing": true
  }
}
```

**Response 200** — the updated release object (including recomputed `status`).  
**Response 404** — release not found.

---

### `DELETE /api/releases/:id`

Permanently deletes a release.

**Response 204** — no content.  
**Response 404** — release not found.

---

## Deployment

### Backend on Render

1. Push the repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set the root directory to `backend`.
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variable `DATABASE_URL` pointing to your Render Postgres instance.
7. Add `FRONTEND_URL` pointing to your deployed frontend URL.

### Frontend on Vercel

1. Import the repository on [Vercel](https://vercel.com).
2. Set the root directory to `frontend`.
3. Add environment variable `VITE_API_URL=https://your-api.onrender.com/api`.
4. Deploy — Vercel auto-detects Vite.

---

## Project structure

```
releasecheck/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express app entry point
│   │   ├── db.js             # PostgreSQL pool + schema init
│   │   ├── steps.js          # Step definitions + status logic
│   │   └── routes/
│   │       └── releases.js   # CRUD endpoints
│   ├── tests/
│   │   └── releases.test.js  # Integration tests (Jest + Supertest)
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx          # React entry point
│   │   ├── App.jsx           # Root component + routing state
│   │   ├── api.js            # Fetch wrapper for all API calls
│   │   ├── index.css         # Global styles + design tokens
│   │   └── components/
│   │       ├── ReleaseList.jsx    # List view + New Release modal
│   │       └── ReleaseDetail.jsx  # Detail / checklist view
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```
