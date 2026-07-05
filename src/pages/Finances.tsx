import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, TrendingDown, Scale } from 'lucide-react'

export function Finances() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (data) setTransactions(data)
    setLoading(false)
  }

  const totals = useMemo(() => {
    let income = 0, expense = 0
    for (const t of transactions) {
      if (t.type === 'income') income += Number(t.amount)
      else expense += Number(t.amount)
    }
    return { income, expense, net: income - expense }
  }, [transactions])

  const fmtRub = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(val)
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <h2 style={{ marginBottom: 16 }}>Финансы</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: '0.8rem', marginBottom: 4 }}>
            <TrendingUp size={14} /> Доходы
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
            {fmtRub(totals.income)}
          </div>
        </div>
        
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: '0.8rem', marginBottom: 4 }}>
            <TrendingDown size={14} /> Расходы
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
            {fmtRub(totals.expense)}
          </div>
        </div>

        <div className="card" style={{ padding: 12, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: totals.net >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '0.8rem', marginBottom: 4 }}>
            <Scale size={14} /> Прибыль / убыток
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: totals.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totals.net > 0 ? '+' : ''}{fmtRub(totals.net)}
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Последние транзакции</h3>
      
      {loading ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>Загрузка...</p>
      ) : transactions.length === 0 ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>Нет данных</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transactions.map(t => (
            <div key={t.id} className="card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ overflow: 'hidden', flex: 1, paddingRight: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
                  {new Date(t.date).toLocaleDateString()} • {t.category}
                </div>
              </div>
              <div style={{ 
                fontWeight: 700, 
                fontSize: '1rem', 
                whiteSpace: 'nowrap',
                color: t.type === 'income' ? 'var(--green)' : 'var(--red)' 
              }}>
                {t.type === 'income' ? '+' : '-'}{fmtRub(Number(t.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
