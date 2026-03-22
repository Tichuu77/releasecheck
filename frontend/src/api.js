const BASE = import.meta.env.VITE_API_URL || '/api';

const handle = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
};

export const api = {
  getReleases:  ()           => fetch(`${BASE}/releases`).then(handle),
  getRelease:   (id)         => fetch(`${BASE}/releases/${id}`).then(handle),
  getSteps:     ()           => fetch(`${BASE}/releases/steps`).then(handle),
  createRelease:(body)       => fetch(`${BASE}/releases`, { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
  updateRelease:(id, body)   => fetch(`${BASE}/releases/${id}`, { method: 'PUT',    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handle),
  deleteRelease:(id)         => fetch(`${BASE}/releases/${id}`, { method: 'DELETE' }).then(handle),
};
