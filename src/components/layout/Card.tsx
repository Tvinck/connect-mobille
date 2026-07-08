import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  inset?: boolean;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function Card({ children, inset = false, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={Object.assign(
        {
          background: inset ? 'var(--surface-2)' : 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--card-pad)',
          cursor: onClick ? 'pointer' : undefined,
        },
        style
      )}
    >
      {children}
    </div>
  );
}
