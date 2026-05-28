import { useState } from 'react';
import type { AppSettings } from '../utils/storage';
import { migrateLocalToSupabase } from '../utils/migration';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [apiBaseUrl, setApiBaseUrl] = useState(settings.apiBaseUrl);
  const [model, setModel] = useState(settings.model);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl);
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseKey);
  const [useSupabase, setUseSupabase] = useState(settings.useSupabase);
  const [showKey, setShowKey] = useState(false);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string>('');

  const handleSave = () => {
    onSave({
      apiKey: apiKey.trim(),
      apiBaseUrl: apiBaseUrl.trim(),
      model: model.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseKey: supabaseKey.trim(),
      useSupabase,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleMigrate = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setMigrationResult('❌ Please enter Supabase URL and Key first');
      return;
    }

    setMigrating(true);
    setMigrationResult('');

    try {
      const result = await migrateLocalToSupabase(supabaseUrl.trim(), supabaseKey.trim());

      if (result.success) {
        setMigrationResult(
          `✅ Migration complete! Migrated ${result.templatesCount} template(s) and ${result.assessmentsCount} assessment(s).`
        );
      } else {
        setMigrationResult(`❌ Migration failed: ${result.error}`);
      }
    } catch (error) {
      setMigrationResult(`❌ Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="section-header">
        <h2>Settings</h2>
      </div>

      <p className="section-hint">
        Configure your AI provider. Your API key is stored only in <strong>sessionStorage</strong>{' '}
        (cleared automatically when you close this browser tab) and is never sent anywhere other
        than your configured API base URL.
      </p>

      <div className="form-group">
        <label htmlFor="api-key">OpenAI API Key</label>
        <div className="input-row">
          <input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            className="form-input"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowKey((v) => !v)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="api-url">API Base URL</label>
        <input
          id="api-url"
          type="text"
          className="form-input"
          placeholder="https://api.openai.com/v1"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
        />
        <span className="label-hint">
          Change this to use a compatible API (e.g. Azure OpenAI, Ollama, Groq).
        </span>
      </div>

      <div className="form-group">
        <label htmlFor="model">Model</label>
        <input
          id="model"
          type="text"
          className="form-input"
          placeholder="gpt-4o"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <span className="label-hint">
          Examples: gpt-4o, gpt-4-turbo, gpt-3.5-turbo, claude-3-opus-20240229
        </span>
      </div>

      <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

      <div className="section-header" style={{ marginTop: 0 }}>
        <h3>Cloud Storage (Supabase)</h3>
      </div>

      <p className="section-hint">
        Enable cloud storage to sync your templates and assessments across devices. Your Supabase
        credentials are stored in <strong>sessionStorage</strong> only. Create a free account at{' '}
        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
          supabase.com
        </a>{' '}
        and follow the setup instructions in the README.
      </p>

      <div className="form-group">
        <label htmlFor="use-supabase" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            id="use-supabase"
            type="checkbox"
            checked={useSupabase}
            onChange={(e) => setUseSupabase(e.target.checked)}
            style={{ width: 'auto', margin: 0 }}
          />
          Use Cloud Storage (Supabase)
        </label>
        <span className="label-hint">
          When enabled, templates and history will sync to your Supabase database instead of
          browser localStorage.
        </span>
      </div>

      {useSupabase && (
        <>
          <div className="form-group">
            <label htmlFor="supabase-url">Supabase Project URL</label>
            <input
              id="supabase-url"
              type="text"
              className="form-input"
              placeholder="https://xxxxx.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
            <span className="label-hint">
              Found in your Supabase dashboard: Settings → API → Project URL
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="supabase-key">Supabase Anon Key</label>
            <div className="input-row">
              <input
                id="supabase-key"
                type={showSupabaseKey ? 'text' : 'password'}
                className="form-input"
                placeholder="eyJ..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowSupabaseKey((v) => !v)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showSupabaseKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <span className="label-hint">
              Found in your Supabase dashboard: Settings → API → Project API keys → anon/public
            </span>
          </div>

          <div className="form-group">
            <button
              className="btn btn-ghost"
              onClick={handleMigrate}
              disabled={migrating || !supabaseUrl.trim() || !supabaseKey.trim()}
              style={{ width: 'auto' }}
            >
              {migrating ? '⏳ Migrating...' : '📤 Migrate Local Data to Cloud'}
            </button>
            <span className="label-hint">
              One-time migration: Upload your templates and assessment history from browser storage
              to Supabase. This is safe to run multiple times (won't create duplicates).
            </span>
            {migrationResult && (
              <div style={{ 
                marginTop: '10px', 
                padding: '12px', 
                borderRadius: '6px',
                background: migrationResult.startsWith('✅') ? '#d4edda' : '#f8d7da',
                color: migrationResult.startsWith('✅') ? '#155724' : '#721c24',
                fontSize: '0.9rem'
              }}>
                {migrationResult}
              </div>
            )}
          </div>
        </>
      )}

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
