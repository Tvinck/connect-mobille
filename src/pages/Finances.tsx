import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { Card } from '../components/layout/Card';
import { Icon } from '../components/core/Icon';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
}

function fmt(v: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(v);
}

interface FinancesProps {
  onBack: () => void;
}

export function Finances({ onBack }: FinancesProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setTransactions(data as Transaction[]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    // Real-time listener for finances
    const channel = supabase.channel('mobile_finances_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += Number(t.amount);
      else expense += Number(t.amount);
    });
    return { income, expense, net: income - expense };
  }, [transactions]);

  return (
    <div style={{ paddingBottom: 'calc(var(--tabbar-h) + 16px)', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar title="Финансы" onBack={onBack} />
      <div style={{ padding: '0 var(--screen-pad)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4cd964', fontSize: 'var(--fs-footnote)', marginBottom: 6 }}>
              <Icon name="trending-up" size={15} /> Доходы
            </div>
            <div style={{ fontSize: 20, fontWeight: 'var(--fw-bold)' }}>{fmt(totals.income)}</div>
          </Card>
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: 'var(--fs-footnote)', marginBottom: 6 }}>
              <Icon name="trending-down" size={15} /> Расходы
            </div>
            <div style={{ fontSize: 20, fontWeight: 'var(--fw-bold)' }}>{fmt(totals.expense)}</div>
          </Card>
          <Card style={{ padding: 16, gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: 'var(--fs-footnote)', marginBottom: 6 }}>
              <Icon name="scale" size={15} /> Прибыль
            </div>
            <div style={{ fontSize: 26, fontWeight: 'var(--fw-bold)', color: totals.net >= 0 ? '#4cd964' : 'var(--red)' }}>
              {totals.net > 0 ? '+' : ''}{fmt(totals.net)}
            </div>
          </Card>
        </div>

        <div style={{ fontSize: 'var(--fs-headline)', fontWeight: 'var(--fw-semibold)', margin: '14px 0 10px' }}>Последние транзакции</div>
        
        {loading && transactions.length === 0 ? (
          <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>Загрузка транзакций...</p>
        ) : transactions.length === 0 ? (
          <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>Нет данных</p>
        ) : (
          <Card style={{ padding: '6px 16px' }}>
            {transactions.map((t, i) => {
              const dateStr = new Date(t.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
              return (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: i === 0 ? 'none' : '0.5px solid var(--hair)' }}>
                  <div style={{ minWidth: 0, paddingRight: 8 }}>
                    <div style={{ fontSize: 'var(--fs-subhead)', fontWeight: 'var(--fw-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                    <div style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-3)', marginTop: 3 }}>{dateStr} · {t.category}</div>
                  </div>
                  <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body)', whiteSpace: 'nowrap', color: t.type === 'income' ? '#4cd964' : 'var(--red)' }}>
                    {t.type === 'income' ? '+' : '−'}{fmt(Number(t.amount))}
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
