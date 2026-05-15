import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { storage } from '@wxt-dev/storage';
import './HistoryPanel.css';

export interface SearchHistoryItem {
  id: string;
  task: string;
  summary: string;
  timestamp: number;
}

interface HistoryPanelProps {
  onClose: () => void;
  onRestore: (task: string) => void;
}

export function HistoryPanel({ onClose, onRestore }: HistoryPanelProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await storage.getItem<SearchHistoryItem[]>('local:oryonix_history');
      if (savedHistory && Array.isArray(savedHistory)) {
        // Sort newest first
        setHistory(savedHistory.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (confirm('Are you sure you want to clear your local search history?')) {
      await storage.removeItem('local:oryonix_history');
      setHistory([]);
    }
  };

  const getSnippet = (text: string) => {
    // Basic markdown strip
    let stripped = text.replace(/[*_#`~>]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Remove extra newlines and spaces
    stripped = stripped.replace(/\s+/g, ' ').trim();
    return stripped;
  };

  if (loading) {
    return <div className="history-panel-container"><div className="status-spinner"></div></div>;
  }

  return (
    <div className="history-panel-container">
      <div className="history-header">
        <h3 className="history-title">Search History</h3>
        <button className="history-close-btn" onClick={onClose}>✕</button>
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <p>No past searches found.</p>
          <p className="history-empty-sub">Your searches are saved locally to your device for privacy.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-item-header">
                <span className="history-item-date">{new Date(item.timestamp).toLocaleString()}</span>
                <button 
                  className="history-run-again-btn" 
                  onClick={() => onRestore(item.task)}
                  title="Run this search again"
                >
                  ↻ Run Again
                </button>
              </div>
              <div className="history-item-task">
                <strong>Task:</strong> {item.task}
              </div>
              <div className="history-item-summary">
                {getSnippet(item.summary)}
              </div>
            </div>
          ))}
          <div className="history-actions">
            <button className="history-clear-btn" onClick={clearHistory}>Clear All History</button>
          </div>
        </div>
      )}
    </div>
  );
}
