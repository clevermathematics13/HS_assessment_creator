import { useState } from 'react';
import type { AssessmentResult } from '../types';
import { exportToPDF } from '../utils/pdfExport';

interface AssessmentOutputProps {
  result: AssessmentResult;
  onClose: () => void;
  onUpdate?: (updatedResult: AssessmentResult) => void;
}

export function AssessmentOutput({ result, onClose, onUpdate }: AssessmentOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(result.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? editedContent : result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = isEditing ? editedContent : result.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.templateName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const contentToExport = isEditing ? editedContent : result.content;
    const exportResult = { ...result, content: contentToExport };
    exportToPDF(exportResult);
  };

  const handleSaveEdit = () => {
    if (onUpdate) {
      const updatedResult = { ...result, content: editedContent };
      onUpdate(updatedResult);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(result.content);
    setIsEditing(false);
  };

  const formattedDate = new Date(result.createdAt).toLocaleString();
  const displayContent = isEditing ? editedContent : result.content;

  return (
    <div className="assessment-output">
      <div className="output-header">
        <div className="output-meta">
          <h2>{isEditing ? 'Edit Assessment' : 'Assessment Output'}</h2>
          <span className="output-meta-detail">
            Template: <strong>{result.templateName}</strong> · {formattedDate}
          </span>
          {result.prompt && (
            <span className="output-meta-detail">
              Prompt: <em>{result.prompt}</em>
            </span>
          )}
        </div>
        <div className="output-actions">
          {isEditing ? (
            <>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                💾 Save
              </button>
              <button className="btn btn-ghost" onClick={handleCancelEdit}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleCopy}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button className="btn btn-secondary" onClick={handleExportPDF}>
                📄 PDF
              </button>
              <button className="btn btn-secondary" onClick={handleDownload}>
                ⬇ TXT
              </button>
              {onUpdate && (
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                  ✏️ Edit
                </button>
              )}
              <button className="btn btn-ghost" onClick={onClose}>
                ✕ Close
              </button>
            </>
          )}
        </div>
      </div>

      <div className="output-content">
        {isEditing ? (
          <textarea
            className="assessment-editor"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={25}
          />
        ) : (
          <pre className="assessment-pre">{displayContent}</pre>
        )}
      </div>
    </div>
  );
}
