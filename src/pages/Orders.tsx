import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Smartphone, CheckCircle2, Clock, PlayCircle, Copy } from 'lucide-react'

export function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'in_progress' | 'all'>('pending')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('apple_certificates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (data) setOrders(data)
    setLoading(false)
  }

  const cycleStatus = async (id: string, currentStatus: string) => {
    let newStatus = 'in_progress'
    let comment = null

    if (currentStatus === 'pending') {
      newStatus = 'in_progress'
    } else if (currentStatus === 'in_progress') {
      newStatus = 'approved'
      const input = window.prompt('Введите инструкцию или комментарий для клиента (опционально):')
      if (input === null) return // Отмена
      comment = input
    } else if (currentStatus === 'approved') {
      newStatus = 'pending'
    }

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, crm_status: newStatus, approval_comment: comment || o.approval_comment } : o))
    
    const updatePayload: any = { crm_status: newStatus }
    if (comment !== null) {
      updatePayload.approval_comment = comment
    }

    const { error } = await supabase
      .from('apple_certificates')
      .update(updatePayload)
      .eq('id', id)
      
    if (error) {
      alert('Ошибка обновления статуса')
      fetchOrders() // revert
    }
  }

  const filteredOrders = orders.filter(o => filter === 'all' || o.crm_status === filter)

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Заявки Apple Certs</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            import('../lib/push').then(({ setupWebPush }) => {
              setupWebPush();
            })
          }} 
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--violet)' }}
        >
          <Smartphone size={16} /> Включить пуши
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        <button 
          className="btn btn-ghost" 
          style={{ flex: 'none', padding: '8px 12px', fontSize: '0.85rem', borderColor: filter === 'pending' ? 'var(--violet)' : 'var(--hair-strong)', color: filter === 'pending' ? 'var(--violet)' : 'inherit' }}
          onClick={() => setFilter('pending')}
        >
          Новые (Pending)
        </button>
        <button 
          className="btn btn-ghost" 
          style={{ flex: 'none', padding: '8px 12px', fontSize: '0.85rem', borderColor: filter === 'in_progress' ? 'var(--violet)' : 'var(--hair-strong)', color: filter === 'in_progress' ? 'var(--violet)' : 'inherit' }}
          onClick={() => setFilter('in_progress')}
        >
          В работе
        </button>
        <button 
          className="btn btn-ghost" 
          style={{ flex: 'none', padding: '8px 12px', fontSize: '0.85rem', borderColor: filter === 'all' ? 'var(--violet)' : 'var(--hair-strong)', color: filter === 'all' ? 'var(--violet)' : 'inherit' }}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>Загрузка...</p>
      ) : filteredOrders.length === 0 ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>Заявок нет</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredOrders.map(o => (
            <div key={o.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ maxWidth: '75%' }}>
                  <div 
                    style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: 6, wordBreak: 'break-all', cursor: 'pointer' }}
                    onClick={() => navigator.clipboard.writeText(o.udid).then(() => alert('UDID скопирован!'))}
                  >
                    <Smartphone size={16} style={{ flexShrink: 0, marginTop: 2 }} /> 
                    {o.udid} 
                    <Copy size={12} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 4 }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 4, fontWeight: 600 }}>{o.plan_id}</span>
                    <span style={{ padding: '2px 6px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--violet)', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' }}>{o.source}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', textAlign: 'right' }}>
                  {o.sale_price} ₽
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 'normal' }}>API: ${o.api_cost}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => cycleStatus(o.id, o.crm_status)}
                  className={`btn ${o.crm_status === 'approved' ? 'btn-ghost' : o.crm_status === 'in_progress' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', 
                    backgroundColor: o.crm_status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : o.crm_status === 'in_progress' ? 'var(--amber)' : 'rgba(255,255,255,0.05)',
                    color: o.crm_status === 'approved' ? 'var(--green)' : o.crm_status === 'in_progress' ? '#fff' : 'var(--text)'
                  }}
                >
                  {o.crm_status === 'approved' ? <><CheckCircle2 size={16} /> Согласовано</> : 
                   o.crm_status === 'in_progress' ? <><PlayCircle size={16} /> Завершить (Выдать)</> : 
                   <><Clock size={16} /> На рассмотрении</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
