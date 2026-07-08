import React, { useState, useEffect } from 'react';
import type { Procedure, ProcedureStep } from '../../types/support';

interface Props {
  platform: string;
}

function ProcedureCard({ proc }: { proc: Procedure }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    setChecked(new Array(proc.steps.length).fill(false));
  }, [proc.steps.length]);

  const done = checked.filter(Boolean).length;

  return (
    <div style={{ background: 'var(--surface-2)', border: '0.5px solid var(--hair)', borderRadius: 12, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 14px', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{proc.title}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {done}/{proc.steps.length} шагов
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {done > 0 && (
            <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(done / proc.steps.length) * 100}%`, background: '#34c759', transition: 'width 0.3s' }} />
            </div>
          )}
          <span style={{ fontSize: 16, color: 'var(--text-3)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>
            ›
          </span>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '0.5px solid var(--hair)', padding: '8px 14px 12px' }}>
          {proc.steps.map((step, i) => (
            <label
              key={i}
              style={{ display: 'flex', gap: 10, padding: '8px 0', cursor: 'pointer', alignItems: 'flex-start', borderBottom: i < proc.steps.length - 1 ? '0.5px solid var(--hair)' : 'none' }}
            >
              <div
                style={{
                  width: 20, height: 20, borderRadius: 6, border: checked[i] ? 'none' : '1.5px solid var(--text-3)',
                  background: checked[i] ? '#34c759' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1, transition: 'all 0.15s',
                }}
                onClick={() => setChecked(c => { const n = [...c]; n[i] = !n[i]; return n; })}
              >
                {checked[i] && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 13, color: checked[i] ? 'var(--text-3)' : 'var(--text)', textDecoration: checked[i] ? 'line-through' : 'none', flex: 1, transition: 'color 0.15s' }}>
                {step.text}
                {step.note && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginTop: 2, textDecoration: 'none' }}>{step.note}</span>}
              </span>
            </label>
          ))}
          {done === proc.steps.length && proc.steps.length > 0 && (
            <div style={{ textAlign: 'center', padding: '8px 0 0', fontSize: 12, color: '#34c759', fontWeight: 600 }}>
              ✓ Процедура завершена
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Procedures({ platform }: Props) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = platform.toLowerCase().includes('ggsel') ? 'ggsel'
      : platform.toLowerCase().includes('veil') ? 'veil'
      : 'all';

    fetch(`/api/support/procedures?platform=${p}`)
      .then(r => r.json())
      .then(d => { if (d.success) setProcedures(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [platform]);

  if (loading) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Загрузка процедур...
      </div>
    );
  }

  if (procedures.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Процедуры не настроены
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, margin: '8px 0 4px' }}>
        Процедуры
      </p>
      {procedures.map(p => (
        <ProcedureCard key={p.id} proc={p} />
      ))}
      <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}>
        Чеклист сбрасывается при смене чата
      </p>
    </div>
  );
}
