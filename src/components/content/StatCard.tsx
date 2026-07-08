import React from 'react';
import { Icon } from '../core/Icon';

interface StatCardProps {
  value: React.ReactNode;
  label: string;
  icon?: string;
  tone?: 'neutral' | 'blue' | 'green' | 'red' | 'amber';
  style?: React.CSSProperties;
}

export function StatCard({ value, label, icon, tone = 'neutral', style }: StatCardProps) {
  const tones = {
    neutral: 'var(--text)',
    blue: 'var(--accent)',
    green: '#4cd964',
    red: 'var(--red)',
    amber: 'var(--amber)',
  };

  return (
    <div
      style={Object.assign(
        {
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 0,
        },
        style
      )}
    >
      {icon ? <Icon name={icon} size={20} color={tones[tone] || tones.neutral} /> : null}
      <span style={{ fontSize: 28, fontWeight: 'var(--fw-bold)', lineHeight: 1.1, color: tones[tone] || tones.neutral, fontFamily: 'var(--font-sans)' }}>{value}</span>
      <span style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-2)', fontFamily: 'var(--font-sans)' }}>{label}</span>
    </div>
  );
}
