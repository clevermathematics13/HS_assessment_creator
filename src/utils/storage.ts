import type { Template, AssessmentResult } from '../types';
import {
  initSupabase,
  dbTemplateToTemplate,
  templateToDbTemplate,
  dbAssessmentToAssessment,
  assessmentToDbAssessment,
} from '../services/supabaseClient';
import { DEFAULT_TEMPLATES } from './defaultTemplates';

const TEMPLATES_KEY = 'hs_assessment_templates';
const HISTORY_KEY = 'hs_assessment_history';
const SETTINGS_KEY = 'hs_assessment_settings';

// ── Templates ────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<Template[]> {
  const settings = getSettings();
  
  if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
    try {
      const supabase = initSupabase(settings.supabaseUrl, settings.supabaseKey);
      const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        // Seed default templates on first use
        await seedDefaultTemplates();
        const { data: seededData } = await supabase.from('templates').select('*').order('created_at', { ascending: true });
        return (seededData || []).map(dbTemplateToTemplate);
      }
      
      return data.map(dbTemplateToTemplate);
    } catch (error) {
      console.error('Failed to fetch templates from Supabase, falling back to localStorage:', error);
      // Fallback to localStorage on error
    }
  }
  
  // Use localStorage
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

export async function saveTemplate(template: Template): Promise<void> {
  const settings = getSettings();
  
  if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
    try {
      const supabase = initSupabase(settings.supabaseUrl, settings.supabaseKey);
      const dbTemplate = templateToDbTemplate(template);
      // Type cast to work around Supabase typing issues
      const { error } = await (supabase.from('templates') as any).upsert([dbTemplate], { onConflict: 'id' });
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Failed to save template to Supabase, falling back to localStorage:', error);
      // Fallback to localStorage on error
    }
  }
  
  // Use localStorage
  const templates = await getTemplatesSync();
  const filtered = templates.filter((t) => t.id !== template.id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify([...filtered, template]));
}

export async function deleteTemplate(id: string): Promise<void> {
  const settings = getSettings();
  
  if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
    try {
      const supabase = initSupabase(settings.supabaseUrl, settings.supabaseKey);
      const { error } = await supabase.from('templates').delete().eq('id', id);
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Failed to delete template from Supabase, falling back to localStorage:', error);
      // Fallback to localStorage on error
    }
  }
  
  // Use localStorage
  const templates = await getTemplatesSync();
  const filtered = templates.filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
}

// Helper: Synchronous template getter for localStorage fallback
function getTemplatesSync(): Template[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

// Helper: Seed default templates to Supabase
async function seedDefaultTemplates(): Promise<void> {
  const settings = getSettings();
  if (!settings.useSupabase || !settings.supabaseUrl || !settings.supabaseKey) return;
  
  try {
    const supabase = initSupabase(settings.supabaseUrl, settings.supabaseKey);
    const dbTemplates = DEFAULT_TEMPLATES.map(templateToDbTemplate);
    // Type cast to work around Supabase typing issues
    const { error } = await (supabase.from('templates') as any).insert(dbTemplates);
    if (error) throw error;
  } catch (error) {
    console.error('Failed to seed default templates:', error);
  }
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<AssessmentResult[]> {
  const settings = getSettings();
  
  if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
    try {
      const supabase = initSupabase(settings.supabaseUrl, settings.supabaseKey);
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []).map(dbAssessmentToAssessment);
    } catch (error) {
      console.error('Failed to fetch history from Supabase, falling back to localStorage:', error);
      // Fallback to localStorage on error
    }
  }
  
  // Use localStorage
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AssessmentResult[]) : [];
  } catch {
    return [];
  }
}

export async function saveToHistory(result: AssessmentResult): Promise<void> {
  const settings = getSettings();
  
  if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
    try {
      const supabase = initSupabase(settings.supabaseUrl, settings.supabaseKey);
      const dbAssessment = assessmentToDbAssessment(result);
      // Type cast to work around Supabase typing issues
      const { error } = await (supabase.from('assessments') as any).insert([dbAssessment]);
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Failed to save assessment to Supabase, falling back to localStorage:', error);
      // Fallback to localStorage on error
    }
  }
  
  // Use localStorage
  const history = await getHistorySync();
  // Keep last 50 entries
  const trimmed = [result, ...history].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export async function clearHistory(): Promise<void> {
  const settings = getSettings();
  
  if (settings.useSupabase && settings.supabaseUrl && settings.supabaseKey) {
    try {
      const supabase = initSupabase(settings.supabaseUrl, settings.supabaseKey);
      // Delete all assessments
      const { error } = await supabase.from('assessments').delete().neq('id', '');
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Failed to clear history from Supabase, falling back to localStorage:', error);
      // Fallback to localStorage on error
    }
  }
  
  // Use localStorage
  localStorage.removeItem(HISTORY_KEY);
}

// Helper: Synchronous history getter for localStorage fallback
function getHistorySync(): AssessmentResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AssessmentResult[]) : [];
  } catch {
    return [];
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface AppSettings {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  supabaseUrl: string;
  supabaseKey: string;
  useSupabase: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiBaseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  supabaseUrl: '',
  supabaseKey: '',
  useSupabase: false,
};

// The API key and Supabase key are kept only in sessionStorage (cleared on tab close) 
// so they are not written to the more persistent localStorage alongside other settings.
const API_KEY_SESSION_KEY = 'hs_assessment_api_key';
const SUPABASE_KEY_SESSION_KEY = 'hs_assessment_supabase_key';

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const stored = raw ? (JSON.parse(raw) as Omit<AppSettings, 'apiKey' | 'supabaseKey'>) : {};
    const apiKey = sessionStorage.getItem(API_KEY_SESSION_KEY) ?? '';
    const supabaseKey = sessionStorage.getItem(SUPABASE_KEY_SESSION_KEY) ?? '';
    return { ...DEFAULT_SETTINGS, ...stored, apiKey, supabaseKey };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  // Persist non-sensitive fields to localStorage.
  const { apiKey, supabaseKey, ...rest } = settings;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
  // Store the API key and Supabase key only in sessionStorage so they are cleared when the tab is closed.
  sessionStorage.setItem(API_KEY_SESSION_KEY, apiKey);
  sessionStorage.setItem(SUPABASE_KEY_SESSION_KEY, supabaseKey);
}

