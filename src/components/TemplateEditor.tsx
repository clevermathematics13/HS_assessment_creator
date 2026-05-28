import { useState } from 'react';
import type { Template } from '../types';

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
  isNew: boolean;
}

export function TemplateEditor({ template, onSave, onCancel, isNew }: TemplateEditorProps) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [systemPrompt, setSystemPrompt] = useState(template.systemPrompt);
  const [formatExample, setFormatExample] = useState(template.formatExample);

  const handleSave = () => {
    if (!name.trim()) return;
    const now = new Date().toISOString();
    onSave({
      ...template,
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      formatExample: formatExample.trim(),
      updatedAt: now,
      createdAt: isNew ? now : template.createdAt,
    });
  };

  return (
    <div className="template-editor">
      <div className="editor-header">
        <h2>{isNew ? 'New Template' : 'Edit Template'}</h2>
        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
            Save Template
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="form-group">
          <label htmlFor="tmpl-name">Template Name *</label>
          <input
            id="tmpl-name"
            type="text"
            className="form-input"
            placeholder="e.g. AP Biology Quiz"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tmpl-desc">Description</label>
          <input
            id="tmpl-desc"
            type="text"
            className="form-input"
            placeholder="Short description of this template"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tmpl-system">
            Formatting &amp; Preference Instructions
            <span className="label-hint">
              Tell the AI how to format the assessment, what style to use, grading rules, etc.
            </span>
          </label>
          <textarea
            id="tmpl-system"
            className="form-textarea form-textarea--tall"
            placeholder={`Example:\nYou are an expert high school teacher. Generate a quiz with:\n- 10 multiple choice questions\n- A–D answer choices\n- An answer key at the end\n- High-school reading level`}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tmpl-format">
            Format Example
            <span className="label-hint">
              Paste a sample of exactly how the output should look. The AI will mirror this structure.
            </span>
          </label>
          <textarea
            id="tmpl-format"
            className="form-textarea form-textarea--tall"
            placeholder={`Example:\n**Quiz Title**\n\n1. Question here\n   A. Option\n   B. Option\n   C. Option\n   D. Option\n\n---\nAnswer Key: 1-B, 2-A ...`}
            value={formatExample}
            onChange={(e) => setFormatExample(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
