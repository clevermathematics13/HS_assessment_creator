import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Template, AssessmentResult } from '../types';

// Database schema types
export interface DbTemplate {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  format_example: string;
  created_at: string;
  updated_at: string;
}

export interface DbAssessment {
  id: string;
  template_id: string;
  template_name: string;
  content: string;
  prompt: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      templates: {
        Row: DbTemplate;
        Insert: Omit<DbTemplate, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DbTemplate, 'id'>>;
      };
      assessments: {
        Row: DbAssessment;
        Insert: Omit<DbAssessment, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<DbAssessment, 'id'>>;
      };
    };
  };
}

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Initialize or re-initialize the Supabase client with new credentials
 */
export function initSupabase(url: string, key: string): SupabaseClient<Database> {
  if (!url || !key) {
    throw new Error('Supabase URL and key are required');
  }
  supabaseInstance = createClient<Database>(url, key);
  return supabaseInstance;
}

/**
 * Get the current Supabase client instance
 * Returns null if not initialized
 */
export function getSupabase(): SupabaseClient<Database> | null {
  return supabaseInstance;
}

/**
 * Check if Supabase is initialized and configured
 */
export function isSupabaseInitialized(): boolean {
  return supabaseInstance !== null;
}

/**
 * Convert database template to app template format
 */
export function dbTemplateToTemplate(db: DbTemplate): Template {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    systemPrompt: db.system_prompt,
    formatExample: db.format_example,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Convert app template to database template format
 */
export function templateToDbTemplate(template: Template): DbTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    system_prompt: template.systemPrompt,
    format_example: template.formatExample,
    created_at: template.createdAt,
    updated_at: template.updatedAt,
  };
}

/**
 * Convert database assessment to app assessment format
 */
export function dbAssessmentToAssessment(db: DbAssessment): AssessmentResult {
  return {
    id: db.id,
    templateId: db.template_id,
    templateName: db.template_name,
    content: db.content,
    prompt: db.prompt,
    createdAt: db.created_at,
  };
}

/**
 * Convert app assessment to database assessment format
 */
export function assessmentToDbAssessment(assessment: AssessmentResult): DbAssessment {
  return {
    id: assessment.id,
    template_id: assessment.templateId,
    template_name: assessment.templateName,
    content: assessment.content,
    prompt: assessment.prompt,
    created_at: assessment.createdAt,
  };
}
