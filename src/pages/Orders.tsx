import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { Card } from '../components/layout/Card';
import { Button } from '../components/core/Button';
import { Badge } from '../components/core/Badge';
import { Icon } from '../components/core/Icon';

interface Order {
  id: string;
  udid: string;
  plan_id: string;
  source: string;
  sale_price: number;
  crm_status: 'pending' | 'in_progress' | 'approved';
  created_at: string;
  approval_comment?: string | null;
}

const STATUS = {
  pending: { label: 'На рассмотрении', icon: 'clock', tone: 'neutral' as const, btn: 'Взять в работу', btnVar: 'tonal' as const },
  in_progress: { label: 'В работе', icon: 'play-circle', tone: 'amber' as const, btn: 'Завершить (выдать)', btnVar: 'primary' as const },
  approved: { label: 'Согласовано', icon: 'circle-check', tone: 'green' as const, btn: 'Вернуть в новые', btnVar: 'tonal' as const },
};

interface OrdersProps {
  onBack: () => void;
}

export function Orders({ onBack }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'pending' | 'in_progress' | 'all'>('pending');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apple_certificates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setOrders(data as Order[]);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Listen to real-time order updates
    const channel = supabase.channel('mobile_orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apple_certificates' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cycleStatus = async (id: string, currentStatus: Order['crm_status']) => {
    let newStatus: Order['crm_status'] = 'in_progress';
    let comment: string | null = null;

    if (currentStatus === 'pending') {
      newStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      newStatus = 'approved';
      const input = window.prompt('Введите инструкцию или комментарий для клиента (опционально):');
      if (input === null) return; // Cancel
      comment = input;
    } else if (currentStatus === 'approved') {
      newStatus = 'pending';
    }

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, crm_status: newStatus, approval_comment: comment } : o));

    try {
      const updatePayload: any = { crm_status: newStatus };
      if (comment !== null) {
        updatePayload.approval_comment = comment;
      }

      const { error } = await supabase
        .from('apple_certificates')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error cycling status:', err);
      alert('Ошибка при обновлении статуса');
      fetchOrders(); // Revert
    }
  };

  const visible = orders.filter(o => filter === 'all' || o.crm_status === filter);
  const chips = [
    ['pending', 'Новые'],
    ['in_progress', 'В работе'],
    ['all', 'Все']
  ] as const;

  return (
    <div style={{ paddingBottom: 'calc(var(--tabbar-h) + 16px)', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar title="Заказы" subtitle="Apple Certs" onBack={onBack} />
      
      <div style={{ display: 'flex', gap: 8, padding: '4px var(--screen-pad) 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {chips.map((ch) => {
          const on = filter === ch[0];
          return (
            <button
              key={ch[0]}
              onClick={() => setFilter(ch[0])}
              type="button"
              style={{
                flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--fs-subhead)',
                fontWeight: 'var(--fw-semibold)',
                background: on ? 'var(--accent)' : 'var(--surface-2)',
                color: on ? '#fff' : 'var(--text-2)'
              }}
            >
              {ch[1]}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 var(--screen-pad)' }}>
        {loading && orders.length === 0 ? (
          <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>Загрузка заказов...</p>
        ) : visible.length === 0 ? (
          <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>Заказов нет</p>
        ) : (
          visible.map((o) => {
            const st = STATUS[o.crm_status] || STATUS.pending;
            const timeStr = new Date(o.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(o.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
            
            return (
              <Card key={o.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-footnote)', fontWeight: 'var(--fw-semibold)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="smartphone" size={15} color="var(--text-2)" style={{ flexShrink: 0 }} />
                      <span style={{ fontFamily: 'monospace' }}>{o.udid.substring(0, 15)}...</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <Badge tone="neutral">{o.plan_id}</Badge>
                      <Badge tone="blue">BAZZAR SERTS</Badge>
                      <Badge tone="neutral">{o.source}</Badge>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-headline)' }}>{o.sale_price} ₽</div>
                    <div style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-3)' }}>{dateStr} • {timeStr}</div>
                  </div>
                </div>
                
                {o.approval_comment && (
                  <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--radius)', fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', marginBottom: 12, borderLeft: '3px solid var(--accent)' }}>
                    <strong>Комментарий:</strong> {o.approval_comment}
                  </div>
                )}
                
                <Button
                  variant={st.btnVar}
                  block
                  icon={<Icon name={st.icon} size={16} />}
                  onClick={() => cycleStatus(o.id, o.crm_status)}
                >
                  {st.btn}
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
