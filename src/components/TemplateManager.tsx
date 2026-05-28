import type { Template } from '../types';
import { TemplateEditor } from './TemplateEditor';
import { useState, useRef } from 'react';
import { 
  exportTemplate, 
  exportMultipleTemplates, 
  importMultipleTemplates, 
  readFileAsText 
} from '../utils/templateImportExport';

interface TemplateSelectorProps {
  templates: Template[];
  selectedId: string;
  onSelect: (id: string) => void;
  onSave: (template: Template) => void;
  onDelete: (id: string) => void;
}

function newTemplate(): Template {
  return {
    id: `tmpl-${Date.now()}`,
    name: '',
    description: '',
    systemPrompt: '',
    formatExample: '',
    createdAt: '',
    updatedAt: '',
  };
}

export function TemplateManager({
  templates,
  selectedId,
  onSelect,
  onSave,
  onDelete,
}: TemplateSelectorProps) {
  const [editing, setEditing] = useState<Template | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (tmpl: Template) => {
    setIsNew(false);
    setEditing({ ...tmpl });
  };

  const handleNew = () => {
    setIsNew(true);
    setEditing(newTemplate());
  };

  const handleSave = (tmpl: Template) => {
    onSave(tmpl);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
      if (selectedId === id && templates.length > 1) {
        onSelect(templates.find((t) => t.id !== id)!.id);
      }
    } else {
      setConfirmDelete(id);
    }
  };

  const handleExportTemplate = (e: React.MouseEvent, tmpl: Template) => {
    e.stopPropagation();
    exportTemplate(tmpl);
  };

  const handleExportAll = () => {
    exportMultipleTemplates(templates);
  };

  const handleImportClick = () => {
    setImportError('');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const importedTemplates = importMultipleTemplates(content);
      
      // Save all imported templates
      for (const tmpl of importedTemplates) {
        onSave(tmpl);
      }
      
      setImportError('');
      alert(`Successfully imported ${importedTemplates.length} template(s)!`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (editing) {
    return (
      <TemplateEditor
        template={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
        isNew={isNew}
      />
    );
  }

  return (
    <div className="template-manager">
      <div className="section-header">
        <h2>Templates</h2>
        <div className="section-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleImportClick}>
            📥 Import
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportAll}>
            📤 Export All
          </button>
          <button className="btn btn-primary" onClick={handleNew}>
            + New Template
          </button>
        </div>
      </div>

      {/* Hidden file input for importing */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {importError && (
        <div className="error-banner">Import error: {importError}</div>
      )}

      <p className="section-hint">
        Select a template to use when generating assessments. Edit or create your own to customize
        formatting and AI instructions. Import/export templates to share with others.
      </p>

      <div className="template-list">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className={`template-card${selectedId === tmpl.id ? ' selected' : ''}`}
            onClick={() => onSelect(tmpl.id)}
          >
            <div className="template-card-body">
              <div className="template-card-title">
                {selectedId === tmpl.id && <span className="check-mark">✓ </span>}
                {tmpl.name}
              </div>
              {tmpl.description && (
                <div className="template-card-desc">{tmpl.description}</div>
              )}
            </div>
            <div className="template-card-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-sm btn-ghost"
                onClick={(e) => handleExportTemplate(e, tmpl)}
                title="Export this template"
              >
                📤
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleEdit(tmpl)}
              >
                Edit
              </button>
              <button
                className={`btn btn-sm ${confirmDelete === tmpl.id ? 'btn-danger' : 'btn-ghost'}`}
                onClick={() => handleDelete(tmpl.id)}
                title={confirmDelete === tmpl.id ? 'Click again to confirm' : 'Delete template'}
              >
                {confirmDelete === tmpl.id ? 'Confirm?' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
