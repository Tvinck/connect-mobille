import { useState, useEffect } from 'react';
import type { QuickReply } from '../../types/support';

interface Props {
  platform: string;
  onSelect: (text: string) => void;
}

export function QuickReplies({ platform, onSelect }: Props) {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = platform.toLowerCase().includes('ggsel') ? 'ggsel'
      : platform.toLowerCase().includes('veil') ? 'veil'
      : 'all';

    fetch(`/api/support/quick-replies?platform=${p}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setReplies(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [platform]);

  if (loading) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Загрузка шаблонов...
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Шаблоны не настроены
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, margin: '8px 0 4px' }}>
        Шаблонные ответы
      </p>
      {replies.map(r => (
        <button
          key={r.id}
          type="button"
          onClick={() => onSelect(r.body)}
          style={{
            display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left',
            background: 'var(--surface-2)', border: '0.5px solid var(--hair)',
            borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.title}</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
            {r.body}
          </span>
        </button>
      ))}
      <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}>
        Нажмите на шаблон — он вставится в поле ввода
      </p>
    </div>
  );
}
