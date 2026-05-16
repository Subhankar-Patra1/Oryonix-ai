import React, { useState, useEffect, useRef } from 'react';
import { useAgent } from '../../agent/useAgent';
import { AgentStatusGlow } from './components/AgentStatusGlow';
import { HistoryPanel } from './components/HistoryPanel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChartBlock } from './components/ChartBlock';
import { storage } from '@wxt-dev/storage';
import {
  RocketLaunchIcon, EyeIcon, LightningIcon, ClockCounterClockwiseIcon,
  CheckCircleIcon, XCircleIcon, WarningIcon, InfoIcon,
} from '@phosphor-icons/react';
import './App.css';

const EMOJI_MAP: [RegExp, React.ReactNode][] = [
  [/✅/g, <CheckCircleIcon size={15} weight="fill" color="#22c55e" style={{ verticalAlign: 'middle', display: 'inline', marginBottom: 2 }} />],
  [/❌/g, <XCircleIcon    size={15} weight="fill" color="#ef4444" style={{ verticalAlign: 'middle', display: 'inline', marginBottom: 2 }} />],
  [/⚠️/g, <WarningIcon   size={15} weight="fill" color="#f97316" style={{ verticalAlign: 'middle', display: 'inline', marginBottom: 2 }} />],
  [/ℹ️/g, <InfoIcon      size={15} weight="fill" color="#60a5fa" style={{ verticalAlign: 'middle', display: 'inline', marginBottom: 2 }} />],
];

function injectIcons(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, child => {
    if (typeof child !== 'string') return child;
    let parts: (string | React.ReactNode)[] = [child];
    for (const [regex, icon] of EMOJI_MAP) {
      parts = parts.flatMap(part => {
        if (typeof part !== 'string') return [part];
        return part.split(regex).flatMap((seg, i, arr) =>
          i < arr.length - 1 ? [seg, React.cloneElement(icon as React.ReactElement, { key: `${i}` })] : [seg]
        );
      });
    }
    return parts;
  });
}

export default function App() {
  const [task, setTask] = useState('');
  const [finalSummary, setFinalSummary] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { status, activity, history, currentTask, execute, stop } = useAgent();

  const saveToHistory = async (taskText: string, summaryText: string) => {
    try {
      const savedHistory = await storage.getItem<any[]>('local:oryonix_history') || [];
      const newItem = {
        id: Date.now().toString(),
        task: taskText,
        summary: summaryText,
        timestamp: Date.now()
      };
      await storage.setItem('local:oryonix_history', [...savedHistory, newItem]);
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  const handleRun = async () => {
    if (!task) return;
    const taskToRun = task;
    setTask(''); // Clear input
    setFinalSummary(null);
    try {
      const result: any = await execute(taskToRun);
      const outputText = result?.message || result?.output || result?.answer || result?.content;
      if (outputText) {
        setFinalSummary(outputText);
        saveToHistory(taskToRun, outputText);
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg = `Error: ${e?.message || 'Execution failed'}`;
      setFinalSummary(errorMsg);
      saveToHistory(taskToRun, errorMsg);
    }
  };

  const prevStatusRef = useRef(status);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prevStatus === 'running' && (status === 'completed' || status === 'error') && currentTask && !finalSummary) {
      if (history.length === 0) {
        setFinalSummary("Task stopped or failed before execution started.");
        return;
      }

      // Handle done tool action explicitly or find text payload
      const lastMessageEvent = [...history].reverse().find(e => 
        e.type !== 'error' && ((e as any).message || (e as any).output || (e as any).content || (e as any).text || (e as any).answer || ((e as any).action?.name === 'done' && (e as any).action?.input?.text))
      ) as any;

      let foundDoneText = null;
      if (lastMessageEvent?.action?.name === 'done' && lastMessageEvent?.action?.input?.text) {
        foundDoneText = lastMessageEvent.action.input.text;
      }

      if (foundDoneText) {
        setFinalSummary(foundDoneText);
        saveToHistory(currentTask, foundDoneText);
      } else if (lastMessageEvent && (lastMessageEvent.message || lastMessageEvent.output || lastMessageEvent.content || lastMessageEvent.text || lastMessageEvent.answer)) {
        const text = lastMessageEvent.message || lastMessageEvent.output || lastMessageEvent.content || lastMessageEvent.text || lastMessageEvent.answer || "Task executed.";
        setFinalSummary(text);
        saveToHistory(currentTask, text);
      } else {
        // Fallback to the last reflection memory if it crashed or was stopped
        const lastStep = [...history].reverse().find(e => e.type === 'step') as any;
        if (lastStep?.reflection?.memory) {
          const text = `**Task concluded without a formal summary.**\n\n*Last agent memory:*\n${lastStep.reflection.memory}`;
          setFinalSummary(text);
          saveToHistory(currentTask, text);
        } else if (history[history.length - 1].type === 'error') {
          const text = `Error: ${(history[history.length - 1] as any).error?.message || (history[history.length - 1] as any).message || 'Execution failed'}`;
          setFinalSummary(text);
          saveToHistory(currentTask, text);
        } else {
          const text = "Task completed, but the AI did not format a text summary.";
          setFinalSummary(text);
          saveToHistory(currentTask, text);
        }
      }
    }
  }, [status, history, finalSummary, currentTask]);

  const mapStatus = () => {
    if (status === 'running') {
      if (activity?.type === 'executing' && activity.tool === 'visionFallback') return 'thinking';
      return 'acting';
    }
    if (status === 'error') return 'error';
    return 'idle';
  };

  const getThinkingText = () => {
    const lastStep = [...history].reverse().find(e => e.type === 'step') as any;
    const memory = lastStep?.reflection?.memory || lastStep?.reflection?.next_goal;
    
    if (memory) {
      const words = memory.split(' ');
      if (words.length > 30) {
        return words.slice(0, 30).join(' ') + '...';
      }
      return memory;
    }

    if (activity) {
      if (activity.type === 'executing') return `Executing ${(activity as any).tool}...`;
      if (activity.type === 'thinking') return 'Analyzing page context...';
      return `Oryonix is ${activity.type}...`;
    }
    return 'Thinking...';
  };

  return (
    <div className="popup-container theme-dark">
      <header className="popup-header">
        <div className="popup-brand">
          <img src="/Oryonix AI 2.png" alt="Oryonix AI Logo" className="popup-logo" />
          <h2 className="popup-title">Oryonix AI</h2>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <button
            className="history-toggle-btn"
            onClick={() => setShowHistory(true)}
            title="View Search History"
          >
            <ClockCounterClockwiseIcon size={14} weight="bold" />
            History
          </button>
          <AgentStatusGlow status={mapStatus()} />
        </div>
      </header>
      
      {showHistory && (
        <HistoryPanel 
          onClose={() => setShowHistory(false)} 
          onRestore={(historicalTask) => {
            setTask(historicalTask);
            setShowHistory(false);
          }}
          status={status}
        />
      )}

      <div className="popup-chat-area">
        {!currentTask && !finalSummary && status === 'idle' && (
          <div className="landing-state">
            <div className="landing-hero-icon">
              <img src="/Oryonix AI 2.png" alt="Oryonix AI Logo" />
            </div>
            <h1 className="landing-title accent-text">Oryonix AI</h1>
            <p className="landing-subtitle">
              Your autonomous browser copilot. I can navigate pages, analyze visual context, and execute complex workflows directly in your browser.
            </p>
            
            <div className="landing-features">
              <div className="feature-item">
                <span className="feature-icon"><RocketLaunchIcon size={20} color="#f97316" weight="duotone" /></span>
                <div className="feature-text">
                  <strong>Autonomous Execution</strong>
                  <span>Give me a goal and watch me navigate.</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><EyeIcon size={20} color="#f97316" weight="duotone" /></span>
                <div className="feature-text">
                  <strong>Visual DOM Perception</strong>
                  <span>Advanced spatial understanding of web layouts.</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><LightningIcon size={20} color="#f97316" weight="duotone" /></span>
                <div className="feature-text">
                  <strong>Intelligent Summarization</strong>
                  <span>Concise insights and actionable results.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTask && (
          <div className="chat-bubble user-bubble">
            {currentTask}
          </div>
        )}

        {(status === 'running' || activity) && (
          <div className="chat-status-bar">
            <div className="loader"></div>
            <span className="status-text">
              {getThinkingText()}
            </span>
          </div>
        )}

        {status !== 'running' && finalSummary && (
          <div className="chat-bubble ai-bubble">
            <div className="ai-bubble-icon">
              <img src="/Oryonix AI 2.png" alt="AI" />
            </div>
            <div className="ai-bubble-content markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children }) {
                    const lang = /language-(\w+)/.exec(className || '')?.[1]
                    if (lang === 'chart') {
                      return <ChartBlock code={String(children).replace(/\n$/, '')} />
                    }
                    return <code className={className}>{children}</code>
                  },
                  p({ children }) { return <p>{injectIcons(children)}</p> },
                  li({ children }) { return <li>{injectIcons(children)}</li> },
                  td({ children }) { return <td>{injectIcons(children)}</td> },
                  th({ children }) { return <th>{injectIcons(children)}</th> },
                }}
              >
                {finalSummary}
              </ReactMarkdown>
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
