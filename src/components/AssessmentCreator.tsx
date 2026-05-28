import { useState, useRef } from 'react';
import type { Template, AssessmentResult } from '../types';
import type { AppSettings } from '../utils/storage';
import { FileUpload } from './FileUpload';
import { generateAssessment } from '../services/aiService';

interface AssessmentCreatorProps {
  templates: Template[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onResult: (result: AssessmentResult) => void;
  settings: AppSettings;
}

export function AssessmentCreator({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onResult,
  settings,
}: AssessmentCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleGenerate = async () => {
    if (!prompt.trim() && !fileContent) {
      setError('Please enter a prompt or upload a file.');
      return;
    }
    if (!selectedTemplate) {
      setError('Please select a template.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const content = await generateAssessment(
        {
          userPrompt: prompt,
          fileText: fileContent,
          systemPrompt: selectedTemplate.systemPrompt,
          formatExample: selectedTemplate.formatExample,
        },
        settings,
      );
      const result: AssessmentResult = {
        id: `result-${Date.now()}`,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        content,
        prompt,
        createdAt: new Date().toISOString(),
      };
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFile = () => {
    setFileContent('');
    setFileName('');
  };

  return (
    <div className="assessment-creator">
      <div className="section-header">
        <h2>Create Assessment</h2>
      </div>

      {/* Template selector strip */}
      <div className="form-group">
        <label>Active Template</label>
        <div className="template-strip">
          {templates.map((t) => (
            <button
              key={t.id}
              className={`template-chip${selectedTemplateId === t.id ? ' active' : ''}`}
              onClick={() => onSelectTemplate(t.id)}
              title={t.description}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {selectedTemplate && (
        <div className="template-preview-box">
          <span className="template-preview-label">Template instructions preview</span>
          <p className="template-preview-text">{selectedTemplate.systemPrompt}</p>
        </div>
      )}

      {/* Prompt */}
      <div className="form-group">
        <label htmlFor="assessment-prompt">
          Assessment Prompt
          <span className="label-hint">
            Describe what you want — topic, grade level, number of questions, special requirements.
          </span>
        </label>
        <textarea
          id="assessment-prompt"
          ref={promptRef}
          className="form-textarea"
          placeholder="e.g. Create a 10-question quiz on the causes of WWI for 10th grade US History. Include one document-based question."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
        />
      </div>

      {/* File upload */}
      <div className="form-group">
        <label>
          Source Material (optional)
          <span className="label-hint">
            Upload notes, a reading passage, or any reference text to base the assessment on.
          </span>
        </label>
        <FileUpload
          fileName={fileName}
          onFileContent={(content, name) => {
            setFileContent(content);
            setFileName(name);
          }}
        />
        {fileName && (
          <button className="btn btn-ghost btn-sm" onClick={handleClearFile} style={{ marginTop: 6 }}>
            ✕ Remove file
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <button
        className="btn btn-primary btn-generate"
        onClick={handleGenerate}
        disabled={loading || (!prompt.trim() && !fileContent)}
      >
        {loading ? (
          <span className="spinner-text">⏳ Generating…</span>
        ) : (
          '✨ Generate Assessment'
        )}
      </button>
    </div>
  );
}
