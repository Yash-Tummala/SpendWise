// src/pages/Settings/Settings.jsx
import { Download, Upload, Sun, Moon, RotateCcw, ShieldCheck, DatabaseZap } from 'lucide-react';
import { useRef } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { exportData, importData, resetData, setSetting } from '../../services/database/financeService';
import './Settings.css';

export default function Settings() {
  const { theme, setTheme, refresh, notify, clearDefaultData } = useFinance();
  const file = useRef();

  async function download() {
    const blob = new Blob([JSON.stringify(await exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Your backup has been exported.');
  }

  async function upload(e) {
    try {
      await importData(JSON.parse(await e.target.files[0].text()));
      await refresh();
      notify('Backup restored successfully.');
    } catch {
      notify('Could not import that backup.');
    }
    e.target.value = '';
  }

  async function reset() {
    if (confirm('Reset all SpendWise data? This cannot be undone.')) {
      await resetData();
      await refresh();
      notify('All data has been reset.');
    }
  }

  async function loadDemo() {
    // Persist a flag that FinanceProvider reads to seed demo data.
    await setSetting('loadDemo', true);
    // Open a new tab so the current view stays intact.
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
    notify('Demo data will be loaded in the new window.');
  }

  async function clearDemo() {
    if (confirm('Remove only the default demo entries? Your own data will stay unchanged.')) {
      await clearDefaultData();
    }
  }

  return (
    <div className="page settings">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Personalize SpendWise and manage your on‑device data.</p>

      <section className="panel setting-section">
        <div>
          <h2>Appearance</h2>
          <p>Choose the interface that feels right for you.</p>
        </div>
        <div className="theme-toggle">
          <button className={theme === 'light' ? 'chosen' : ''} onClick={() => setTheme('light')}>
            <Sun size={16} /> Light
          </button>
          <button className={theme === 'dark' ? 'chosen' : ''} onClick={() => setTheme('dark')}>
            <Moon size={16} /> Dark
          </button>
        </div>
      </section>

      <section className="panel setting-section">
        <div>
          <h2>Demo data</h2>
          <p>Explore the complete SpendWise experience without changing your personal records.</p>
        </div>
        <div className="settings-actions">
          <button className="button button-soft" onClick={loadDemo}>
            <DatabaseZap size={15} /> Load demo data (new window)
          </button>
          <button className="button button-danger" onClick={clearDemo}>
            <DatabaseZap size={15} /> Clear default data
          </button>
        </div>
      </section>

      <section className="panel setting-section">
        <div>
          <h2>Backup &amp; restore</h2>
          <p>Export a complete copy or restore a previous SpendWise backup.</p>
        </div>
        <div className="settings-actions">
          <button className="button button-soft" onClick={download}>
            <Download size={15} /> Export JSON
          </button>
          <button className="button button-soft" onClick={() => file.current.click()}>
            <Upload size={15} /> Import JSON
          </button>
          <input ref={file} type="file" accept="application/json" hidden onChange={upload} />
        </div>
      </section>

      <section className="panel setting-section">
        <div>
          <h2>Storage &amp; privacy</h2>
          <p>
            <ShieldCheck size={15} /> All data is stored securely in Supabase.
          </p>
        </div>
        <button className="button button-danger" onClick={reset}>
          <RotateCcw size={15} /> Reset application
        </button>
      </section>
    </div>
  );
}
