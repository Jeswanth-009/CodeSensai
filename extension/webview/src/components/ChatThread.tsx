import React from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isCorrect?: boolean;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  loading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

export default function ChatThread({ messages, loading, input, onInputChange, onSend }: ChatThreadProps) {
  return (
    <div style={{ marginTop: '10px' }}>
      {messages.length > 0 && (
        <div>
          {messages.map((msg, i) => (
            <div key={i} style={{
              marginBottom: '8px', padding: '8px 10px', borderRadius: '8px',
              background: msg.role === 'user' ? '#2a2a3e' : '#1a2a1a',
              borderLeft: `3px solid ${msg.role === 'user' ? '#89b4fa' : msg.isCorrect ? '#a6e3a1' : '#fab387'}`
            }}>
              <div style={{ fontSize: '10px', color: '#6c7086', marginBottom: '4px' }}>
                {msg.role === 'user' ? '👨‍💻 You' : `🥋 CodeSensei${msg.isCorrect !== undefined ? (msg.isCorrect ? ' ✅' : ' 🔄') : ''}`}
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: 'center', padding: '8px', color: '#6c7086', fontSize: '12px' }}>
              🥋 CodeSensei is thinking...
            </div>
          )}
        </div>
      )}

      {/* Chat Input */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend()}
          placeholder="Answer the question or ask a follow-up..."
          style={{
            flex: 1, background: '#2a2a3e', border: '1px solid #3a3a5e',
            borderRadius: '6px', padding: '8px 10px', color: '#cdd6f4',
            fontSize: '12px', outline: 'none'
          }}
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || loading}
          style={{
            background: '#a6e3a1', border: 'none', borderRadius: '6px',
            padding: '8px 12px', cursor: 'pointer', color: '#1e1e2e',
            fontSize: '14px', fontWeight: 700,
            opacity: !input.trim() || loading ? 0.5 : 1
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
