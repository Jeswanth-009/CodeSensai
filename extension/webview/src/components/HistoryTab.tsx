import React from 'react';

interface HistoryTabProps {
  history: any[];
  onLoad: (item: any) => void;
  onClear: () => void;
}

export default function HistoryTab({ history, onLoad, onClear }: HistoryTabProps) {
  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6c7086' }}>
        <div style={{ fontSize: '30px', marginBottom: '12px' }}>📜</div>
        <div>No history yet. Start explaining some code!</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ color: '#6c7086', fontSize: '11px' }}>{history.length} explanations</span>
        <button
          onClick={onClear}
          style={{ background: 'transparent', border: '1px solid #f38ba8', borderRadius: '4px', padding: '3px 8px', color: '#f38ba8', cursor: 'pointer', fontSize: '11px' }}
        >
          Clear All
        </button>
      </div>
      {history.map((item, i) => (
        <div
          key={i}
          onClick={() => onLoad(item)}
          style={{
            background: '#2a2a3e', borderRadius: '8px', padding: '10px', marginBottom: '8px',
            cursor: 'pointer', border: '1px solid #3a3a5e',
            transition: 'border-color 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ background: '#3a3a5e', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: '#89b4fa' }}>
              {item.language || 'unknown'}
            </span>
            <span style={{ fontSize: '10px', color: '#6c7086' }}>
              {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-IN') : ''}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#cdd6f4', fontFamily: 'monospace', background: '#1e1e2e', padding: '4px 6px', borderRadius: '4px', overflow: 'hidden', maxHeight: '36px' }}>
            {(item.code || '').substring(0, 80)}...
          </div>
          <div style={{ fontSize: '11px', color: '#6c7086', marginTop: '4px' }}>
            {(item.level1 || item.explanation?.level1 || '').substring(0, 60)}...
          </div>
        </div>
      ))}
    </div>
  );
}
