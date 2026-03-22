import { useState, useEffect } from 'react';
import { api } from './api.js';
import ReleaseList   from './components/ReleaseList.jsx';
import ReleaseDetail from './components/ReleaseDetail.jsx';

export default function App() {
  const [releases,   setReleases]   = useState([]);
  const [steps,      setSteps]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  /* Load releases + step definitions on mount */
  useEffect(() => {
    Promise.all([api.getReleases(), api.getSteps()])
      .then(([rels, stps]) => { setReleases(rels); setSteps(stps); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Helpers ──────────────────────────────────────────────────── */

  const refreshReleases = () =>
    api.getReleases()
      .then(setReleases)
      .catch(console.error);

  /* ── Handlers ──────────────────────────────────────────────────── */

  const handleCreated = (release) => {
    setReleases(prev => [release, ...prev]);
  };

  const handleDeleted = (id) => {
    setReleases(prev => prev.filter(r => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Called when the user navigates back from the detail view —
  // re-fetches the list so any step / notes changes are reflected.
  const handleBack = () => {
    setSelectedId(null);
    refreshReleases();
  };

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <>
      <header style={headerBar}>
        <button style={logo} onClick={selectedId ? handleBack : undefined}>
          <LogoIcon />
          ReleaseCheck
        </button>
      </header>

      <main style={{ flex: 1 }}>
        {selectedId ? (
          <ReleaseDetail
            releaseId={selectedId}
            steps={steps}
            onBack={handleBack}
          />
        ) : (
          <ReleaseList
            releases={releases}
            loading={loading}
            onSelect={setSelectedId}
            onCreated={handleCreated}
            onDeleted={handleDeleted}
          />
        )}
      </main>
    </>
  );
}

const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <rect x="2" y="2" width="16" height="16" rx="4" fill="var(--accent)" />
    <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const headerBar = {
  background: 'var(--surface)', borderBottom: '1px solid var(--border)',
  padding: '0 20px', height: 52,
  display: 'flex', alignItems: 'center',
  position: 'sticky', top: 0, zIndex: 50,
};

const logo = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1rem',
  color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer',
  letterSpacing: '-.01em',
};