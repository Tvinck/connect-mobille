import React from 'react';
import { Icon } from '../core/Icon';

interface NavBarProps {
  title: string;
  large?: boolean;
  onBack?: () => void;
  onBell?: () => void;
  bellDot?: boolean;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

export function NavBar({ title, large = false, onBack, onBell, bellDot = false, subtitle, right }: NavBarProps) {
  const bell = onBell !== undefined ? (
    <button onClick={onBell} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', position: 'relative', color: 'var(--accent)' }}>
      <Icon name="bell" size={24} color="var(--accent)" fill="var(--accent)" strokeWidth={1.5} />
      {bellDot ? <span style={{ position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--bg)' }}></span> : null}
    </button>
  ) : right || null;

  if (large) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px var(--screen-pad) 12px' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--fs-large-title)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.2px' }}>{title}</h1>
        {bell}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', alignItems: 'center', padding: '14px 8px', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
      <div>
        {onBack ? (
          <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--accent)' }}>
            <Icon name="chevron-left" size={26} color="var(--accent)" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--fs-headline)', fontWeight: 'var(--fw-semibold)' }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-3)', marginTop: 1 }}>{subtitle}</div> : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{bell}</div>
    </div>
  );
}
