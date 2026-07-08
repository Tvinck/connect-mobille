import { useState, useEffect } from 'react';
import { OrderDetailsCard } from './OrderDetailsCard';
import { QuickReplies } from './QuickReplies';
import { Procedures } from './Procedures';
import type { OrderDetails } from '../../types/support';

type Tab = 'order' | 'replies' | 'procedures';

interface Props {
  userId: string;
  project: string;
  isGgsel: boolean;
  activeTab: Tab;
  onInsertReply: (text: string) => void;
}

export function SupportSidePanel({ userId, project, isGgsel, activeTab, onInsertReply }: Props) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Fetch order details when userId/isGgsel changes
  useEffect(() => {
    if (!isGgsel) { setOrderDetails(null); return; }
    setOrderLoading(true);
    setOrderError('');
    fetch(`/api/order/details?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setOrderDetails(d.data);
        else setOrderError(d.error || 'Не удалось загрузить детали заказа');
      })
      .catch(() => setOrderError('Ошибка сети'))
      .finally(() => setOrderLoading(false));
  }, [userId, isGgsel]);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Вкладка: Заказ */}
      {activeTab === 'order' && (
        <>
          {!isGgsel && (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🛍️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Детали заказа недоступны
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                Данная функция работает только для обращений с платформы GGSel
              </div>
            </div>
          )}
          {isGgsel && orderLoading && (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Загружаем данные заказа...</div>
            </div>
          )}
          {isGgsel && !orderLoading && orderError && (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 8 }}>{orderError}</div>
              <button
                type="button"
                onClick={() => {
                  setOrderLoading(true);
                  setOrderError('');
                  fetch(`/api/order/details?userId=${encodeURIComponent(userId)}`)
                    .then(r => r.json())
                    .then(d => { if (d.success) setOrderDetails(d.data); else setOrderError(d.error || 'Ошибка'); })
                    .catch(() => setOrderError('Ошибка сети'))
                    .finally(() => setOrderLoading(false));
                }}
                style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Попробовать снова
              </button>
            </div>
          )}
          {isGgsel && !orderLoading && !orderError && orderDetails && (
            <OrderDetailsCard details={orderDetails} />
          )}
        </>
      )}

      {/* Вкладка: Шаблоны */}
      {activeTab === 'replies' && (
        <QuickReplies platform={project} onSelect={onInsertReply} />
      )}

      {/* Вкладка: Процедуры */}
      {activeTab === 'procedures' && (
        <Procedures platform={project} />
      )}
    </div>
  );
}
