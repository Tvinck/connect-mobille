import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, User, MessageCircle } from 'lucide-react'

export function CRM() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setClients(data)
    setLoading(false)
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={24} /> Клиенты (CRM)
      </h2>
      
      {loading ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>Загрузка...</p>
      ) : clients.length === 0 ? (
        <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 20 }}>Нет данных</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {clients.map(c => (
            <div key={c.id} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={16} /> {c.full_name || 'Без имени'}
                  </div>
                  {c.telegram && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MessageCircle size={12} /> {c.telegram}
                    </div>
                  )}
                </div>
                <div style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: c.status === 'lead' ? 'rgba(139, 92, 246, 0.1)' : 
                              c.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 
                              'rgba(255, 255, 255, 0.05)',
                  color: c.status === 'lead' ? 'var(--violet)' : 
                         c.status === 'active' ? 'var(--green)' : 
                         'var(--text-3)'
                }}>
                  {c.status || 'lead'}
                </div>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
                Проект: {c.project || 'Общий'} • Бюджет: {c.budget || 0} ₽
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
