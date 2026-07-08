import React from 'react';

interface BadgeProps {
  tone?: 'neutral' | 'blue' | 'green' | 'red' | 'amber' | 'violet';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const badgeTones = {
  neutral: { background: 'var(--surface-2)', color: 'var(--text-2)' },
  blue: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  green: { background: 'var(--green-dim)', color: '#4cd964' },
  red: { background: 'var(--red-dim)', color: 'var(--red)' },
  amber: { background: 'var(--amber-dim)', color: 'var(--amber)' },
  violet: { background: 'var(--violet-dim)', color: 'var(--violet)' },
};

export function Badge({ tone = 'neutral', children, style }: BadgeProps) {
  return (
    <span
      style={Object.assign(
        {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-footnote)',
          fontWeight: 'var(--fw-semibold)',
        },
        badgeTones[tone] || badgeTones.neutral,
        style
      )}
    >
      {children}
    </span>
  );
}
