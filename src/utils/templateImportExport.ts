import type { Template } from '../types';

/**
 * Export a template as JSON file
 */
export function exportTemplate(template: Template): void {
  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `template_${template.name.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export multiple templates as a single JSON file
 */
export function exportMultipleTemplates(templates: Template[]): void {
  const json = JSON.stringify(templates, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `templates_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import template from JSON file
 * Returns the template object or throws an error if invalid
 */
export function importTemplate(fileContent: string): Template {
  try {
    const parsed = JSON.parse(fileContent);
    
    // Validate required fields
    if (!parsed.id || typeof parsed.id !== 'string') {
      throw new Error('Invalid template: missing or invalid "id" field');
    }
    if (!parsed.name || typeof parsed.name !== 'string') {
      throw new Error('Invalid template: missing or invalid "name" field');
    }
    if (!parsed.description || typeof parsed.description !== 'string') {
      throw new Error('Invalid template: missing or invalid "description" field');
    }
    if (!parsed.systemPrompt || typeof parsed.systemPrompt !== 'string') {
      throw new Error('Invalid template: missing or invalid "systemPrompt" field');
    }
    if (!parsed.formatExample || typeof parsed.formatExample !== 'string') {
      throw new Error('Invalid template: missing or invalid "formatExample" field');
    }

    // Set timestamps if missing
    const now = new Date().toISOString();
    const template: Template = {
      id: parsed.id,
      name: parsed.name,
      description: parsed.description,
      systemPrompt: parsed.systemPrompt,
      formatExample: parsed.formatExample,
      createdAt: parsed.createdAt || now,
      updatedAt: now, // Update timestamp on import
    };

    return template;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file');
    }
    throw error;
  }
}

/**
 * Import multiple templates from a JSON array file
 * Returns array of templates or throws an error if invalid
 */
export function importMultipleTemplates(fileContent: string): Template[] {
  try {
    const parsed = JSON.parse(fileContent);
    
    if (!Array.isArray(parsed)) {
      // Maybe it's a single template
      return [importTemplate(fileContent)];
    }

    // Validate each template in the array
    return parsed.map((item, index) => {
      try {
        return importTemplate(JSON.stringify(item));
      } catch (error) {
        throw new Error(`Invalid template at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file');
    }
    throw error;
  }
}

/**
 * Read a file and return its content as a string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
