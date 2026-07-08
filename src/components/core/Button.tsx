import React, { useState } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'tonal' | 'plain' | 'blue';
  children?: React.ReactNode;
  icon?: React.ReactNode;
  block?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

export function Button({ variant = 'primary', children, icon, block = false, disabled = false, onClick, style }: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  
  const base: React.CSSProperties = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '15px 24px',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-headline)',
    fontWeight: 'var(--fw-semibold)',
    lineHeight: 'var(--lh-tight)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
    transform: pressed ? 'scale(0.98)' : 'none',
    transition: 'opacity 0.15s, transform 0.15s',
  };

  const variants = {
    primary: { background: 'var(--yellow)', color: 'var(--on-yellow)' },
    tonal: { background: 'var(--surface-2)', color: 'var(--accent)' },
    plain: { background: 'transparent', color: 'var(--accent)', padding: '15px 12px' },
    blue: { background: 'var(--accent)', color: '#fff' },
  };

  return (
    <button
      style={Object.assign({}, base, variants[variant] || variants.primary, style)}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {icon}
      {children}
    </button>
  );
}
