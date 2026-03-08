import React, { useState, useEffect } from 'react';
import ExplanationCard from './components/ExplanationCard';
import ChatThread from './components/ChatThread';
import HistoryTab from './components/HistoryTab';
import HinglishToggle from './components/HinglishToggle';
import ComplexityBadge from './components/ComplexityBadge';

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

type Tab = 'explain' | 'history';
type Mode = 'english' | 'hinglish';

interface Explanation {
  level1: any;
  level2: any;
  pitfalls: any;
  socraticQuestion: any;
  errorExplanation: any;
  code?: string;
  language?: string;
  timestamp?: string;
  mode?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isCorrect?: boolean;
}

interface ComplexityResult {
  timeComplexity: string;
  spaceComplexity: string;
  badge: 'green' | 'yellow' | 'red';
  explanation: string;
  optimization: string | null;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('explain');
  const [mode, setMode] = useState<Mode>('english');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [complexity, setComplexity] = useState<ComplexityResult | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [history, setHistory] = useState<Explanation[]>([]);
  const [expandedCards, setExpandedCards] = useState({
    level1: true, level2: true, pitfalls: true, socratic: true, error: true, complexity: true
  });

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    vscode.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function handleMessage(event: MessageEvent) {
    const message = event.data;
    switch (message.type) {
      case 'loading':
        setLoading(true);
        setLoadingMessage(message.message || 'Analyzing...');
        setError(null);
        setExplanation(null);
        setComplexity(null);
        setChatMessages([]);
        break;
      case 'explanation':
        setLoading(false);
        setExplanation(message.data);
        setCurrentCode(message.code || '');
        setMode(message.mode || 'english');
        setTab('explain');
        setComplexity(null);
        break;
      case 'complexity':
        setLoading(false);
        setComplexity(message.data);
        setTab('explain');
        break;
      case 'error':
        setLoading(false);
        setError(message.message);
        break;
      case 'chatLoading':
        setChatLoading(true);
        break;
      case 'chatResponse':
        setChatLoading(false);
        setChatMessages(prev => {
          const msgs = [...prev, {
            role: 'assistant' as const,
            content: message.data.feedback + (message.data.deeperInsight ? '\n\n💡 ' + message.data.deeperInsight : ''),
            isCorrect: message.data.isCorrect
          }];
          // If there's a next question, add it as a follow-up prompt
          if (message.data.nextQuestion) {
            msgs.push({
              role: 'assistant' as const,
              content: '🔮 Next question: ' + message.data.nextQuestion,
              isCorrect: undefined
            });
          }
          return msgs;
        });
        break;
      case 'chatError':
        setChatLoading(false);
        break;
      case 'history':
        setHistory(message.data);
        break;
    }
  }

  function sendFollowup() {
    if (!chatInput.trim() || !explanation) return;
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    vscode.postMessage({
      type: 'followup',
      answer: userMessage,
      mode,
      history: chatMessages
    });
  }

  function toggleCard(card: string) {
    setExpandedCards(prev => ({ ...prev, [card]: !prev[card as keyof typeof prev] }));
  }

  return (
    <div style={{ background: '#1e1e2e', minHeight: '100vh', color: '#cdd6f4', fontSize: '13px' }}>
      {/* Header */}
      <div style={{ background: '#2a2a3e', padding: '12px 16px', borderBottom: '1px solid #3a3a5e', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#a6e3a1' }}>🥋 CodeSensei</span>
          <HinglishToggle mode={mode} onToggle={() => setMode(m => m === 'english' ? 'hinglish' : 'english')} />
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['explain', 'history'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === 'history') vscode.postMessage({ type: 'getHistory' }); }}
              style={{
                padding: '4px 12px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                background: tab === t ? '#a6e3a1' : 'transparent',
                color: tab === t ? '#1e1e2e' : '#6c7086',
                textTransform: 'capitalize'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {tab === 'explain' && (
          <>
            {/* Mode badge */}
            {mode === 'hinglish' && (
              <div style={{ background: '#2d1b4e', border: '1px solid #cba6f7', borderRadius: '6px', padding: '6px 10px', marginBottom: '10px', fontSize: '11px', color: '#cba6f7' }}>
                🇮🇳 Hinglish Mode Active — Desi explanations on!
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</div>
                <div style={{ color: '#a6e3a1', fontWeight: 600 }}>{loadingMessage}</div>
                <div style={{ color: '#6c7086', fontSize: '11px', marginTop: '4px' }}>AWS Bedrock is thinking...</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: '#2d1515', border: '1px solid #f38ba8', borderRadius: '8px', padding: '12px', color: '#f38ba8' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>⚠️ Error</div>
                <div style={{ fontSize: '12px' }}>{error}</div>
              </div>
            )}

            {/* Complexity Result */}
            {complexity && !loading && (
              <ComplexityBadge result={complexity} />
            )}

            {/* Explanation Cards */}
            {explanation && !loading && (
              <>
                {explanation.errorExplanation && (
                  <ExplanationCard
                    icon="⚠️" title="Error Explained" color="#f38ba8"
                    content={explanation.errorExplanation}
                    expanded={expandedCards.error}
                    onToggle={() => toggleCard('error')}
                  />
                )}

                <ExplanationCard
                  icon="🟢" title="Level 1: What is happening?" color="#a6e3a1"
                  content={explanation.level1}
                  expanded={expandedCards.level1}
                  onToggle={() => toggleCard('level1')}
                />
                <ExplanationCard
                  icon="🔵" title="Level 2: Why this design?" color="#89b4fa"
                  content={explanation.level2}
                  expanded={expandedCards.level2}
                  onToggle={() => toggleCard('level2')}
                />
                <ExplanationCard
                  icon="🟠" title="Common Pitfalls" color="#fab387"
                  content={explanation.pitfalls}
                  expanded={expandedCards.pitfalls}
                  onToggle={() => toggleCard('pitfalls')}
                />
                <ExplanationCard
                  icon="🔮" title="Socratic Question" color="#cba6f7"
                  content={explanation.socraticQuestion}
                  expanded={expandedCards.socratic}
                  onToggle={() => toggleCard('socratic')}
                />

                {/* Chat Thread */}
                <ChatThread
                  messages={chatMessages}
                  loading={chatLoading}
                  input={chatInput}
                  onInputChange={setChatInput}
                  onSend={sendFollowup}
                />

                {/* Export button */}
                <button
                  onClick={() => vscode.postMessage({ type: 'export' })}
                  style={{
                    marginTop: '10px', width: '100%', background: 'transparent',
                    border: '1px solid #3a3a5e', borderRadius: '6px', padding: '6px',
                    color: '#6c7086', cursor: 'pointer', fontSize: '11px'
                  }}
                >
                  📥 Export Notes as Markdown
                </button>
              </>
            )}

            {/* Empty state */}
            {!loading && !explanation && !error && !complexity && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6c7086' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🥋</div>
                <div style={{ fontWeight: 600, color: '#cdd6f4', marginBottom: '8px' }}>Welcome to CodeSensei!</div>
                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  Select any code in the editor and:<br/>
                  • Right-click → "Ask CodeSensei"<br/>
                  • Use CodeLens buttons above functions<br/>
                  • Press Ctrl+Shift+P → "CodeSensei"
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <HistoryTab history={history} onLoad={(item: any) => {
            setTab('explain');
            vscode.postMessage({ type: 'loadHistoryItem', item });
          }} onClear={() => vscode.postMessage({ type: 'clearHistory' })} />
        )}
      </div>
    </div>
  );
}
