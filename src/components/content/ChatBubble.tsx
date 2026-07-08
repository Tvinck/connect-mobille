import React from 'react';

interface ChatBubbleProps {
  mine?: boolean;
  author?: string;
  authorColor?: string;
  children?: React.ReactNode;
  time?: string;
  read?: boolean;
  avatar?: string;
}

export function ChatBubble({ mine = false, author, authorColor = 'var(--accent)', children, time, read = false, avatar }: ChatBubbleProps) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start', fontFamily: 'var(--font-sans)' }}>
      {!mine && avatar ? (
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-3)', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{avatar}</span>
      ) : null}
      <div
        style={{
          maxWidth: '78%',
          padding: '9px 14px',
          borderRadius: 18,
          borderBottomRightRadius: mine ? 6 : 18,
          borderBottomLeftRadius: mine ? 18 : 6,
          background: mine ? 'var(--accent)' : 'var(--surface-2)',
          color: mine ? '#fff' : 'var(--text)',
          fontSize: 'var(--fs-subhead)',
          lineHeight: 'var(--lh-body)',
        }}
      >
        {!mine && author ? (
          <div style={{ fontSize: 'var(--fs-footnote)', fontWeight: 'var(--fw-semibold)', color: authorColor, marginBottom: 2 }}>{author}</div>
        ) : null}
        {children}
        {time ? (
          <span style={{ fontSize: 11, color: mine ? 'rgba(255,255,255,0.7)' : 'var(--text-3)', marginLeft: 8, whiteSpace: 'nowrap' }}>
            {time}{mine && read ? ' ✓✓' : ''}
          </span>
        ) : null}
      </div>
    </div>
  );
}
