import React, { useState } from 'react';
import { api } from '../api.js';

const STATUS_DOT = { planned: '○', ongoing: '◑', done: '●' };

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/* ── New Release Modal ───────────────────────────────────────────── */

function NewReleaseModal({ onClose, onCreate }) {
  const [form, setForm]   = useState({ name: '', date: '', additional_info: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) { setError('Name and date are required.'); return; }
    setLoading(true); setError('');
    try {
      const release = await api.createRelease({
        name: form.name.trim(),
        date: new Date(form.date).toISOString(),
        additional_info: form.additional_info || null,
      });
      onCreate(release);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card" style={modal}>
        <div style={modalHeader}>
          <h2>New release</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="close">✕</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Release name *</label>
            <input type="text" placeholder="Version 2.0.0" value={form.name} onChange={set('name')} autoFocus />
          </div>

          <div className="field">
            <label>Due date *</label>
            <input type="datetime-local" value={form.date} onChange={set('date')} />
          </div>

          <div className="field">
            <label>Additional notes</label>
            <textarea placeholder="Any important context for this release…" value={form.additional_info} onChange={set('additional_info')} />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
              Create release
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, padding: 16,
};
const modal = { width: '100%', maxWidth: 480, padding: 24 };
const modalHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 20,
};

/* ── Confirm Modal ───────────────────────────────────────────────── */

function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '28px 24px', textAlign: 'center' }}
           role="dialog" aria-modal="true">
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--danger-lt)', fontSize: '1.2rem', marginBottom: 14 }}>
          🗑
        </div>
        <h2 style={{ marginBottom: 8 }}>{title}</h2>
        <p className="text-muted text-sm" style={{ marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel} autoFocus>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ── ReleaseList ─────────────────────────────────────────────────── */

export default function ReleaseList({ releases, loading, onSelect, onCreated, onDeleted }) {
  const [showModal,     setShowModal]     = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const askDelete = (e, release) => {
    e.stopPropagation();
    setConfirmTarget({ id: release.id, name: release.name });
  };

  const doDelete = async () => {
    const { id } = confirmTarget;
    setConfirmTarget(null);
    setDeleting(id);
    try {
      await api.deleteRelease(id);
      onDeleted(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={wrapper}>
      {/* Header */}
      <div style={header}>
        <div>
          <h1>ReleaseCheck</h1>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>Your all-in-one release checklist tool</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New release
        </button>
      </div>

      {/* Table card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <span className="spinner" />
          </div>
        ) : releases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>📋</p>
            <p>No releases yet. Create your first one!</p>
          </div>
        ) : (
          <table style={table}>
            <thead>
              <tr style={theadRow}>
                <th style={th}>Release</th>
                <th style={th}>Date</th>
                <th style={th}>Status</th>
                <th style={th}>Progress</th>
                <th style={{ ...th, width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr key={r.id} style={row} onClick={() => onSelect(r.id)}>
                  <td style={td}>
                    <span className="mono" style={{ fontWeight: 500 }}>{r.name}</span>
                  </td>
                  <td style={{ ...td, color: 'var(--muted)', fontSize: '.875rem' }}>{fmtDate(r.date)}</td>
                  <td style={td}>
                    <span className={`status-badge status-${r.status}`}>
                      {STATUS_DOT[r.status]} {r.status}
                    </span>
                  </td>
                  <td style={{ ...td, minWidth: 100 }}>
                    <ProgressCell stepsCompleted={r.steps_completed} />
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
                         onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onSelect(r.id)}>View</button>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        onClick={(e) => askDelete(e, r)}
                        disabled={deleting === r.id}
                        title="Delete release"
                        aria-label="Delete"
                      >
                        {deleting === r.id
                          ? <span className="spinner" style={{ width: 12, height: 12 }} />
                          : <Trash />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <NewReleaseModal onClose={() => setShowModal(false)} onCreate={onCreated} />
      )}

      {confirmTarget && (
        <ConfirmModal
          title="Delete release?"
          message={`"${confirmTarget.name}" will be permanently deleted. This cannot be undone.`}
          confirmLabel={deleting === confirmTarget.id ? 'Deleting…' : 'Yes, delete'}
          onConfirm={doDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

function ProgressCell({ stepsCompleted }) {
  const total = 10; // keep in sync with STEPS length
  const done  = Object.values(stepsCompleted || {}).filter(Boolean).length;
  const pct   = Math.round((done / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-bar" style={{ flex: 1 }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-muted text-sm" style={{ minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {done}/{total}
      </span>
    </div>
  );
}

const Trash = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
    <path d="M2 3.5h9M5 3.5V2.5h3v1M4.5 3.5v6.5a.5.5 0 00.5.5h3a.5.5 0 00.5-.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const wrapper = { maxWidth: 860, margin: '0 auto', padding: '32px 16px 64px', display: 'flex', flexDirection: 'column', gap: 20 };
const header  = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 };
const table   = { width: '100%', borderCollapse: 'collapse' };
const theadRow = { borderBottom: '1px solid var(--border)' };
const th = { padding: '10px 16px', textAlign: 'left', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '.04em', textTransform: 'uppercase' };
const td = { padding: '13px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };
const row = { cursor: 'pointer', transition: 'background .1s' };