import { useState } from 'react';
import type { AssessmentResult } from '../types';

interface AssessmentOutputProps {
  result: AssessmentResult;
  onClose: () => void;
}

export function AssessmentOutput({ result, onClose }: AssessmentOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.templateName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedDate = new Date(result.createdAt).toLocaleString();

  return (
    <div className="assessment-output">
      <div className="output-header">
        <div className="output-meta">
          <h2>Assessment Output</h2>
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
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button className="btn btn-secondary" onClick={handleDownload}>
            ⬇ Download
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>

      <div className="output-content">
        <pre className="assessment-pre">{result.content}</pre>
      </div>
    </div>
  );
}
