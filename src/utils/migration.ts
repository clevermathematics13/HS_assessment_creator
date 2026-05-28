import type { Template, AssessmentResult } from '../types';
import { initSupabase, templateToDbTemplate, assessmentToDbAssessment } from '../services/supabaseClient';

const TEMPLATES_KEY = 'hs_assessment_templates';
const HISTORY_KEY = 'hs_assessment_history';

export interface MigrationResult {
  success: boolean;
  templatesCount: number;
  assessmentsCount: number;
  error?: string;
}

/**
 * Migrate templates and assessment history from localStorage to Supabase
 */
export async function migrateLocalToSupabase(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<MigrationResult> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }

    // Initialize Supabase client
    const supabase = initSupabase(supabaseUrl, supabaseKey);

    // Read from localStorage
    const templates = getLocalTemplates();
    const assessments = getLocalAssessments();

    let templatesCount = 0;
    let assessmentsCount = 0;

    // Migrate templates
    if (templates.length > 0) {
      const dbTemplates = templates.map(templateToDbTemplate);
      const { error: templatesError } = await supabase
        .from('templates')
        .upsert(dbTemplates, { onConflict: 'id' });
      
      if (templatesError) throw templatesError;
      templatesCount = templates.length;
    }

    // Migrate assessments
    if (assessments.length > 0) {
      const dbAssessments = assessments.map(assessmentToDbAssessment);
      // Insert in batches of 100 to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < dbAssessments.length; i += batchSize) {
        const batch = dbAssessments.slice(i, i + batchSize);
        const { error: assessmentsError } = await supabase
          .from('assessments')
          .upsert(batch, { onConflict: 'id' });
        
        if (assessmentsError) throw assessmentsError;
      }
      assessmentsCount = assessments.length;
    }

    return {
      success: true,
      templatesCount,
      assessmentsCount,
    };
  } catch (error) {
    return {
      success: false,
      templatesCount: 0,
      assessmentsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get templates from localStorage
 */
function getLocalTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

/**
 * Get assessment history from localStorage
 */
function getLocalAssessments(): AssessmentResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AssessmentResult[]) : [];
  } catch {
    return [];
  }
}
