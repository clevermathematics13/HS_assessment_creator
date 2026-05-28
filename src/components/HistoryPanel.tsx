import { useState } from 'react';
import type { AssessmentResult } from '../types';

interface HistoryPanelProps {
  history: AssessmentResult[];
  onClear: () => void;
  onView: (result: AssessmentResult) => void;
}

export function HistoryPanel({ history, onClear, onView }: HistoryPanelProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <div className="history-panel">
      <div className="section-header">
        <h2>Assessment History</h2>
        {history.length > 0 && (
          <button
            className={`btn btn-sm ${confirmClear ? 'btn-danger' : 'btn-ghost'}`}
            onClick={handleClear}
          >
            {confirmClear ? 'Confirm Clear All' : 'Clear History'}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>No assessments generated yet.</p>
          <p>Head to the <strong>Create</strong> tab to generate your first assessment.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-card" onClick={() => onView(item)}>
              <div className="history-card-title">{item.templateName}</div>
              {item.prompt && <div className="history-card-prompt">{item.prompt}</div>}
              <div className="history-card-meta">
                {new Date(item.createdAt).toLocaleString()}
              </div>
              <div className="history-card-preview">
                {item.content.slice(0, 120)}…
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
