import { useState } from 'react';
import type { AppSettings } from '../utils/storage';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [apiBaseUrl, setApiBaseUrl] = useState(settings.apiBaseUrl);
  const [model, setModel] = useState(settings.model);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ apiKey: apiKey.trim(), apiBaseUrl: apiBaseUrl.trim(), model: model.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-panel">
      <div className="section-header">
        <h2>Settings</h2>
      </div>

      <p className="section-hint">
        Configure your AI provider. Your API key is stored only in your browser's local storage and
        is never sent to any server other than your configured API base URL.
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

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
