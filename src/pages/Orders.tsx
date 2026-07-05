import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, Clock } from 'lucide-react'

export function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'progress' | 'all'>('progress')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bazzar_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setOrders(data)
    setLoading(false)
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'progress' ? 'done' : 'progress'
    
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    
    const { error } = await supabase
      .from('bazzar_orders')
      .update({ status: newStatus })
      .eq('id', id)
      
    if (error) {
      alert('Ошибка обновления статуса')
      fetchOrders() // revert
    }
  }

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter)

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: 16 }}>Управление заказами</h2>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button 
          className="btn btn-ghost" 
          style={{ flex: 1, padding: '8px', fontSize: '0.9rem', borderColor: filter === 'progress' ? 'var(--violet)' : 'var(--hair-strong)', color: filter === 'progress' ? 'var(--violet)' : 'inherit' }}
          onClick={() => setFilter('progress')}
        >
          В обработке
        </button>
        <button 
          className="btn btn-ghost" 
          style={{ flex: 1, padding: '8px', fontSize: '0.9rem', borderColor: filter === 'all' ? 'var(--violet)' : 'var(--hair-strong)', color: filter === 'all' ? 'var(--violet)' : 'inherit' }}
          onClick={() => setFilter('all')}
        >
          Все заказы
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>Загрузка...</p>
      ) : filteredOrders.length === 0 ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>Заказов нет</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredOrders.map(o => (
            <div key={o.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {o.emoji || '📦'} {o.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 4 }}>ID: {o.id.split('-')[0]} • {new Date(o.created_at).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>{o.user_udid}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{o.sum} ₽</div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => toggleStatus(o.id, o.status)}
                  className={o.status === 'done' ? 'btn btn-ghost' : 'btn btn-primary'}
                  style={{ flex: 1, padding: '10px' }}
                >
                  {o.status === 'done' ? <><CheckCircle size={16} /> Выдан</> : <><Clock size={16} /> Выдать</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
