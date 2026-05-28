import { useState, useMemo } from 'react';
import type { AssessmentResult } from '../types';

interface HistoryPanelProps {
  history: AssessmentResult[];
  onClear: () => void;
  onView: (result: AssessmentResult) => void;
  onDelete?: (id: string) => void;
}

export function HistoryPanel({ history, onClear, onView, onDelete }: HistoryPanelProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Filter and sort history based on search and sort settings
  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.templateName.toLowerCase().includes(query) ||
          item.prompt.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query)
        );
      });
    }

    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [history, searchQuery, sortBy]);

  const handleClear = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  const handleDeleteSingle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering onView
    if (onDelete && window.confirm('Delete this assessment?')) {
      onDelete(id);
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
        <>
          {/* Search and Filter Controls */}
          <div className="history-controls">
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="sort-controls">
              <label htmlFor="sort-select" className="sort-label">Sort:</label>
              <select
                id="sort-select"
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className="search-results-count">
              {filteredHistory.length} of {history.length} assessments
            </div>
          )}

          {/* History list */}
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <p>No assessments match your search.</p>
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((item) => (
                <div key={item.id} className="history-card" onClick={() => onView(item)}>
                  <div className="history-card-header">
                    <div className="history-card-title">{item.templateName}</div>
                    {onDelete && (
                      <button
                        className="btn btn-ghost btn-sm history-delete-btn"
                        onClick={(e) => handleDeleteSingle(e, item.id)}
                        title="Delete assessment"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
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
        </>
      )}
    </div>
  );
}
