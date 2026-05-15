import { useState, useEffect } from 'react';
import { useAgent } from '../../agent/useAgent';
import { AgentStatusGlow } from './components/AgentStatusGlow';
import './App.css';

export default function App() {
  const [task, setTask] = useState('');
  const [finalSummary, setFinalSummary] = useState<string | null>(null);
  const { status, activity, history, currentTask, execute, stop } = useAgent();

  const handleRun = async () => {
    if (!task) return;
    setFinalSummary(null);
    try {
      const result: any = await execute(task);
      const outputText = result?.message || result?.output || result?.answer;
      if (outputText) {
        setFinalSummary(outputText);
      }
    } catch (e: any) {
      console.error(e);
      setFinalSummary(`Error: ${e?.message || 'Execution failed'}`);
    }
  };

  useEffect(() => {
    if (status === 'idle' && history.length > 0 && !finalSummary) {
      // Find the last event that has a message (likely the AI's final answer)
      const lastMessageEvent = [...history].reverse().find(e => (e as any).message && e.type !== 'error');
      if (lastMessageEvent) {
        setFinalSummary((lastMessageEvent as any).message);
      } else if (history[history.length - 1].type === 'error') {
        setFinalSummary(`Error: ${(history[history.length - 1] as any).error?.message || 'Execution failed'}`);
      } else {
        setFinalSummary("Task completed, but no summary was provided by the AI.");
      }
    }
  }, [status, history, finalSummary]);

  const mapStatus = () => {
    if (status === 'running') {
      if (activity?.type === 'executing' && activity.tool === 'visionFallback') return 'thinking';
      return 'acting';
    }
    if (status === 'error') return 'error';
    return 'idle';
  };

  return (
    <div className="popup-container theme-dark">
      <header className="popup-header">
        <div className="popup-brand">
          <img src="/Oryonix AI 2.png" alt="Oryonix AI Logo" className="popup-logo" />
          <h2 className="popup-title">Oryonix AI</h2>
        </div>
        <AgentStatusGlow status={mapStatus()} />
      </header>
      
      <div className="popup-chat-area">
        {currentTask && (
          <div className="chat-bubble user-bubble">
            {currentTask}
          </div>
        )}

        {(status === 'running' || activity) && (
          <div className="chat-status-bar">
            <div className="status-spinner"></div>
            <span className="status-text">
              {activity ? (activity.type === 'executing' ? `Executing ${activity.tool}...` : `Oryonix is ${activity.type}...`) : 'Thinking...'}
            </span>
          </div>
        )}

        {status !== 'running' && finalSummary && (
          <div className="chat-bubble ai-bubble">
            <div className="ai-bubble-icon">
              <img src="/Oryonix AI 2.png" alt="AI" />
            </div>
            <div className="ai-bubble-content">
              {finalSummary}
            </div>
          </div>
        )}
      </div>

      <div className="popup-input-area">
        <div className="popup-input-group">
          <input 
            type="text" 
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRun(); }}
            placeholder="What do you want me to do?"
            disabled={status === 'running'}
            className="popup-input"
          />
          <button 
            onClick={status === 'running' ? stop : handleRun} 
            disabled={(!task && status !== 'running')}
            className={`popup-btn ${status === 'running' ? 'popup-btn-stop' : 'popup-btn-run'}`}
          >
            {status === 'running' ? 'Stop' : 'Run'}
          </button>
        </div>
      </div>
    </div>
  );
}
