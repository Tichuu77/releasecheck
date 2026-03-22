import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const STATUS_DOT = { planned: '○', ongoing: '◑', done: '●' };

/* ── ReleaseDetail ───────────────────────────────────────────────── */

export default function ReleaseDetail({ releaseId, onBack, steps: stepDefs }) {
  const [release, setRelease]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [infoText, setInfoText]   = useState('');
  const [infoChanged, setInfoChanged] = useState(false);
  const [error, setError]         = useState('');

  /* ── Load release ─────────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    api.getRelease(releaseId)
      .then(r => { setRelease(r); setInfoText(r.additional_info || ''); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [releaseId]);

  /* ── Toggle step ──────────────────────────────────────────────── */
  const toggleStep = useCallback(async (key) => {
    if (!release) return;
    const current = !!release.steps_completed[key];
    const updated = { ...release.steps_completed, [key]: !current };
    // Optimistic update
    setRelease(r => ({ ...r, steps_completed: updated, status: computeStatus(updated, stepDefs) }));
    try {
      const saved = await api.updateRelease(release.id, { steps_completed: updated });
      setRelease(saved);
    } catch (err) {
      // Rollback
      setRelease(r => ({ ...r, steps_completed: { ...r.steps_completed, [key]: current } }));
      alert(err.message);
    }
  }, [release, stepDefs]);

  /* ── Save notes ───────────────────────────────────────────────── */
  const saveNotes = async () => {
    setSaving(true);
    try {
      const saved = await api.updateRelease(release.id, { additional_info: infoText });
      setRelease(saved);
      setInfoChanged(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────────── */

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <p style={{ color: 'var(--danger)' }}>{error}</p>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={onBack}>← Back</button>
    </div>
  );

  if (!release) return null;

  const completedCount = stepDefs.filter(s => release.steps_completed[s.key]).length;
  const pct = Math.round((completedCount / stepDefs.length) * 100);

  return (
    <div style={wrapper}>
      {/* Breadcrumb + actions */}
      <div style={topBar}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.875rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px' }} onClick={onBack}>
            All releases
          </button>
          <span>›</span>
          <span className="mono" style={{ color: 'var(--text)', fontWeight: 500 }}>{release.name}</span>
        </nav>
      </div>

      {/* Main card */}
      <div className="card" style={{ padding: '28px 28px 32px' }}>
        {/* Release header */}
        <div style={releaseHeader}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-.02em' }}>
              {release.name}
            </span>
            <div style={{ display: 'flex', align: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className={`status-badge status-${release.status}`}>
                {STATUS_DOT[release.status]} {release.status}
              </span>
              <span className="text-muted text-sm">Due {fmtDate(release.date)}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: pct === 100 ? 'var(--success)' : 'var(--accent)' }}>
              {pct}%
            </span>
            <p className="text-muted text-sm">{completedCount}/{stepDefs.length} steps</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar" style={{ marginBottom: 32, height: 6 }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 8 }}>
            Checklist
          </p>
          {stepDefs.map((step, i) => {
            const checked = !!release.steps_completed[step.key];
            return (
              <label key={step.key} style={stepRow(checked)}>
                <span style={checkboxWrap(checked)}>
                  {checked && <CheckIcon />}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStep(step.key)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                </span>
                <span style={{ ...stepLabel, textDecoration: checked ? 'line-through' : 'none', color: checked ? 'var(--muted)' : 'var(--text)' }}>
                  <span style={{ fontSize: '.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', userSelect: 'none', marginRight: 6 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {step.label}
                </span>
              </label>
            );
          })}
        </div>

        {/* Additional notes */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 8 }}>
            Additional remarks / tasks
          </p>
          <textarea
            placeholder="Please enter any other important notes for the release…"
            value={infoText}
            onChange={e => { setInfoText(e.target.value); setInfoChanged(true); }}
            style={{ minHeight: 110 }}
          />
          {infoChanged && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={saveNotes} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <CheckIcon color="#fff" />}
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────── */

const computeStatus = (sc, stepDefs) => {
  const done = stepDefs.filter(s => sc[s.key] === true).length;
  if (done === 0)              return 'planned';
  if (done === stepDefs.length) return 'done';
  return 'ongoing';
};

const CheckIcon = ({ color = 'currentColor' }) => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
    <path d="M1.5 5.5l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const checkboxWrap = (checked) => ({
  position: 'relative', width: 18, height: 18, flexShrink: 0, borderRadius: 4,
  border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border-md)'}`,
  background: checked ? 'var(--accent)' : 'transparent',
  color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all .15s', cursor: 'pointer',
});

const stepLabel = { fontSize: '.9rem', lineHeight: 1.4, transition: 'color .15s', cursor: 'pointer' };

const stepRow = (checked) => ({
  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 10px',
  borderRadius: 6, cursor: 'pointer',
  background: checked ? 'var(--accent-lt)' : 'transparent',
  transition: 'background .15s',
  userSelect: 'none',
});

const wrapper  = { maxWidth: 700, margin: '0 auto', padding: '28px 16px 64px', display: 'flex', flexDirection: 'column', gap: 16 };
const topBar   = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' };
const releaseHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 };
