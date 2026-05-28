export interface Template {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  formatExample: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResult {
  id: string;
  templateId: string;
  templateName: string;
  content: string;
  prompt: string;
  createdAt: string;
}

export type AppTab = 'create' | 'templates' | 'history' | 'settings';
