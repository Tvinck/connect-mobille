import { useState } from 'react';
import { Icon } from '../core/Icon';

interface ProjectPickerProps {
  projects: string[];
  value: string;
  onChange?: (val: string) => void;
}

export function ProjectPicker({ projects, value, onChange }: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block', fontFamily: 'var(--font-sans)' }}>
      <button
        onClick={() => setOpen(!open)}
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface)',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '8px 14px',
          color: 'var(--text)',
          fontSize: 'var(--fs-subhead)',
          fontWeight: 'var(--fw-semibold)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}></span>
        {value}
        <Icon name="chevron-down" size={16} color="var(--text-2)" strokeWidth={2.5} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open ? (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 200, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 6, zIndex: 100, boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
          {projects.map((p) => {
            const active = p === value;
            return (
              <button
                key={p}
                onClick={() => { setOpen(false); if (onChange) onChange(p); }}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '11px 12px',
                  color: 'var(--text)',
                  fontSize: 'var(--fs-subhead)',
                  fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-regular)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                }}
              >
                {p}
                {active ? <Icon name="check" size={16} color="var(--accent)" strokeWidth={2.5} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
