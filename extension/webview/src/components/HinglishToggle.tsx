import React from 'react';

interface HinglishToggleProps {
  mode: 'english' | 'hinglish';
  onToggle: () => void;
}

export default function HinglishToggle({ mode, onToggle }: HinglishToggleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '11px', color: '#6c7086' }}>Hinglish</span>
      <div
        onClick={onToggle}
        style={{
          width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
          background: mode === 'hinglish' ? '#cba6f7' : '#3a3a5e',
          position: 'relative', transition: 'background 0.2s'
        }}
      >
        <div style={{
          position: 'absolute', top: '3px',
          left: mode === 'hinglish' ? '19px' : '3px',
          width: '14px', height: '14px', borderRadius: '50%',
          background: 'white', transition: 'left 0.2s'
        }} />
      </div>
    </div>
  );
}
