import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { MessageCircle, Send, ArrowLeft } from 'lucide-react'

export function Support() {
  const [chats, setChats] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChats()
  }, [])

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat)
      const sub = supabase.channel('support_msgs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${activeChat}` }, payload => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()
      return () => { supabase.removeChannel(sub) }
    }
  }, [activeChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchChats = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('user_id, message, created_at, is_from_user, is_read, project')
      .order('created_at', { ascending: false })
      .limit(500)
      
    if (data) {
      const grouped = new Map()
      data.forEach(m => {
        if (!grouped.has(m.user_id)) {
          grouped.set(m.user_id, m)
        }
      })
      setChats(Array.from(grouped.values()))
    }
  }

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
      
    // Mark as read
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_from_user', true)
      .eq('is_read', false)
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !activeChat) return
    
    // Get sender email from session
    const { data: { session } } = await supabase.auth.getSession()
    const senderEmail = session?.user?.email || 'admin@connect'

    const { error } = await supabase.from('support_messages').insert([{
      user_id: activeChat,
      message: reply.trim(),
      is_from_user: false,
      is_read: true,
      project: 'Connect Mobile',
      sender_email: senderEmail
    }])
    
    if (!error) {
      setReply('')
    }
  }

  if (activeChat) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--hair-strong)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setActiveChat(null)} className="btn btn-ghost" style={{ padding: 8, border: 'none' }}><ArrowLeft size={20} /></button>
          <div style={{ fontWeight: 600 }}>Чат: {activeChat.substring(0,8)}...</div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {messages.map(m => (
            <div key={m.id} className={`chat-bubble ${!m.is_from_user ? 'mine' : 'other'}`}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 2 }}>{!m.is_from_user ? 'Вы' : 'Клиент'}</div>
              {m.message.startsWith('📷 [Изображение]:') ? (
                <img src={m.message.split('📷 [Изображение]: ')[1]} alt="img" style={{ maxWidth: '100%', borderRadius: 8 }} />
              ) : (
                m.message
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendReply} style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--hair-strong)', display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            className="field" 
            placeholder="Сообщение..." 
            value={reply}
            onChange={e => setReply(e.target.value)}
            style={{ padding: '10px 14px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}><Send size={18} /></button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <h2 style={{ marginBottom: 16 }}>Поддержка</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chats.length === 0 && <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>Нет диалогов</p>}
        {chats.map(c => (
          <div key={c.user_id} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => setActiveChat(c.user_id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageCircle size={16} /> Пользователь
                {!c.is_read && c.is_from_user && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{new Date(c.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {!c.is_from_user ? 'Вы: ' : ''}{c.message}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase' }}>
              {c.project}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
