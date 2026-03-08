import React from 'react';

interface ComplexityResult {
  timeComplexity: string;
  spaceComplexity: string;
  badge: 'green' | 'yellow' | 'red';
  explanation: string;
  optimization: string | null;
}

interface ComplexityBadgeProps {
  result: ComplexityResult;
}

const badgeColors: Record<string, string> = {
  green: '#a6e3a1',
  yellow: '#f9e2af',
  red: '#f38ba8'
};

export default function ComplexityBadge({ result }: ComplexityBadgeProps) {
  const color = badgeColors[result.badge] || '#cdd6f4';

  return (
    <div style={{ background: '#2a2a3e', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: `1px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 700, color }}>⚡ Complexity Analysis</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ background: color, color: '#1e1e2e', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
            Time: {result.timeComplexity}
          </span>
          <span style={{ background: '#3a3a5e', color: '#cdd6f4', borderRadius: '4px', padding: '2px 8px', fontSize: '11px' }}>
            Space: {result.spaceComplexity}
          </span>
        </div>
      </div>
      <div style={{ color: '#cdd6f4', fontSize: '12px', lineHeight: '1.5' }}>{result.explanation}</div>
      {result.optimization && (
        <div style={{ marginTop: '8px', padding: '8px', background: '#1e1e2e', borderRadius: '6px', fontSize: '12px', color: '#a6e3a1' }}>
          💡 {result.optimization}
        </div>
      )}
    </div>
  );
}
