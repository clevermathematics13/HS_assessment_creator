import { useState, useEffect } from 'react';
import type { Template, AssessmentResult, AppTab } from './types';
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  getHistory,
  saveToHistory,
  clearHistory,
  getSettings,
  saveSettings,
} from './utils/storage';
import { DEFAULT_TEMPLATES } from './utils/defaultTemplates';
import { AssessmentCreator } from './components/AssessmentCreator';
import { AssessmentOutput } from './components/AssessmentOutput';
import { TemplateManager } from './components/TemplateManager';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import './App.css';

function initTemplates(): Template[] {
  const stored = getTemplates();
  if (stored.length > 0) return stored;
  DEFAULT_TEMPLATES.forEach(saveTemplate);
  return DEFAULT_TEMPLATES;
}

export default function App() {
  const [tab, setTab] = useState<AppTab>('create');
  const [templates, setTemplates] = useState<Template[]>(initTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    () => initTemplates()[0]?.id ?? '',
  );
  const [history, setHistory] = useState<AssessmentResult[]>(getHistory);
  const [settings, setSettings] = useState(getSettings);
  const [viewingResult, setViewingResult] = useState<AssessmentResult | null>(null);

  // Keep selectedTemplateId valid when templates change
  useEffect(() => {
    if (!templates.find((t) => t.id === selectedTemplateId) && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const handleSaveTemplate = (tmpl: Template) => {
    saveTemplate(tmpl);
    setTemplates(getTemplates());
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(getTemplates());
  };

  const handleResult = (result: AssessmentResult) => {
    saveToHistory(result);
    setHistory(getHistory());
    setViewingResult(result);
    setTab('create');
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleSaveSettings = (s: typeof settings) => {
    saveSettings(s);
    setSettings(s);
  };

  const navItems: { id: AppTab; label: string; icon: string }[] = [
    { id: 'create', label: 'Create', icon: '✏️' },
    { id: 'templates', label: 'Templates', icon: '📋' },
    { id: 'history', label: 'History', icon: '🕑' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="app">
      {/* Sidebar nav */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-text">HS Assessment Creator</span>
        </div>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item${tab === item.id ? ' active' : ''}`}
                onClick={() => {
                  setTab(item.id);
                  if (item.id !== 'create') setViewingResult(null);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.id === 'history' && history.length > 0 && (
                  <span className="nav-badge">{history.length}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <main className="main-content">
        {tab === 'create' && (
          <>
            {viewingResult ? (
              <AssessmentOutput
                result={viewingResult}
                onClose={() => setViewingResult(null)}
              />
            ) : (
              <AssessmentCreator
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={setSelectedTemplateId}
                onResult={handleResult}
                settings={settings}
              />
            )}
          </>
        )}

        {tab === 'templates' && (
          <TemplateManager
            templates={templates}
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
            onSave={handleSaveTemplate}
            onDelete={handleDeleteTemplate}
          />
        )}

        {tab === 'history' && (
          <HistoryPanel
            history={history}
            onClear={handleClearHistory}
            onView={(result) => {
              setViewingResult(result);
              setTab('create');
            }}
          />
        )}

        {tab === 'settings' && (
          <SettingsPanel settings={settings} onSave={handleSaveSettings} />
        )}
      </main>
    </div>
  );
}
