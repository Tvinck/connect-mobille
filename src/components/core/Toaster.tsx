import { useEffect, useState } from 'react';
import { subscribe, dismissToast, type ToastItem, type ToastType } from '../../lib/toast';
import { Icon } from './Icon';

const TONE: Record<ToastType, { color: string; bg: string; icon: string }> = {
  success: { color: 'var(--green)', bg: 'var(--green-dim)', icon: 'circle-check' },
  error: { color: 'var(--red)', bg: 'var(--red-dim)', icon: 'circle-alert' },
  info: { color: 'var(--accent)', bg: 'var(--accent-dim)', icon: 'info' },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '0 16px',
        pointerEvents: 'none',
      }}
    >
      {items.map((t) => {
        const tone = TONE[t.type];
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            role="status"
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              maxWidth: 420,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--radius)',
              background: 'var(--surface)',
              border: `0.5px solid ${tone.bg}`,
              boxShadow: 'var(--shadow-sheet)',
              color: 'var(--text)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-subhead)',
              lineHeight: 'var(--lh-body)',
              animation: 'toast-in 0.2s ease',
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: tone.bg,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={tone.icon} size={17} color={tone.color} strokeWidth={2.2} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
