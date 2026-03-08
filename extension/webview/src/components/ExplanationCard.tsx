import React from 'react';

interface ExplanationCardProps {
  icon: string;
  title: string;
  color: string;
  content: any;
  expanded: boolean;
  onToggle: () => void;
}

function safeContent(content: any): string {
  if (typeof content === 'string') return content;
  if (content === null || content === undefined) return '';
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return Object.entries(item).map(([k, v]) => `${k}: ${v}`).join('\n');
      }
      return String(item);
    }).join('\n\n');
  }
  if (typeof content === 'object') {
    return Object.entries(content).map(([k, v]) => `${k}: ${v}`).join('\n');
  }
  return String(content);
}

export default function ExplanationCard({ icon, title, color, content, expanded, onToggle }: ExplanationCardProps) {
  const displayContent = safeContent(content);
  return (
    <div style={{ background: '#2a2a3e', borderRadius: '8px', marginBottom: '8px', border: `1px solid ${color}22`, overflow: 'hidden' }}>
      <div
        onClick={onToggle}
        style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: `3px solid ${color}` }}
      >
        <span style={{ fontWeight: 600, fontSize: '12px', color }}>{icon} {title}</span>
        <span style={{ color: '#6c7086', fontSize: '10px' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ padding: '10px 12px', fontSize: '12px', lineHeight: '1.6', color: '#cdd6f4', borderTop: '1px solid #3a3a5e', whiteSpace: 'pre-wrap' }}>
          {displayContent}
        </div>
      )}
    </div>
  );
}
