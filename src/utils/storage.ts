import type { Template, AssessmentResult } from '../types';

const TEMPLATES_KEY = 'hs_assessment_templates';
const HISTORY_KEY = 'hs_assessment_history';
const SETTINGS_KEY = 'hs_assessment_settings';

// ── Templates ────────────────────────────────────────────────────────────────

export function getTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

export function saveTemplate(template: Template): void {
  const templates = getTemplates().filter((t) => t.id !== template.id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify([...templates, template]));
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ── History ───────────────────────────────────────────────────────────────────

export function getHistory(): AssessmentResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AssessmentResult[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(result: AssessmentResult): void {
  const history = getHistory();
  // Keep last 50 entries
  const trimmed = [result, ...history].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface AppSettings {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiBaseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
};

// The API key is kept only in sessionStorage (cleared on tab close) so it is
// not written to the more persistent localStorage alongside other settings.
const API_KEY_SESSION_KEY = 'hs_assessment_api_key';

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const stored = raw ? (JSON.parse(raw) as Omit<AppSettings, 'apiKey'>) : {};
    const apiKey = sessionStorage.getItem(API_KEY_SESSION_KEY) ?? '';
    return { ...DEFAULT_SETTINGS, ...stored, apiKey };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  // Persist non-sensitive fields to localStorage.
  const { apiKey, ...rest } = settings;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
  // Store the API key only in sessionStorage so it is cleared when the tab is closed.
  sessionStorage.setItem(API_KEY_SESSION_KEY, apiKey);
}

