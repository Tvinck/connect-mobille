import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MessageCircle, Send, ArrowLeft } from 'lucide-react'

export function Support() {
  const [chats, setChats] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [reply, setReply] = useState('')

  useEffect(() => {
    fetchChats()
  }, [])

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat)
      const sub = supabase.channel('support_msgs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bazzar_chat', filter: `chat_id=eq.${activeChat}` }, payload => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()
      return () => { supabase.removeChannel(sub) }
    }
  }, [activeChat])

  const fetchChats = async () => {
    const { data } = await supabase
      .from('bazzar_chat')
      .select('chat_id, user_id, message, created_at, is_admin')
      .order('created_at', { ascending: false })
      
    if (data) {
      // Group by chat_id
      const grouped = new Map()
      data.forEach(m => {
        if (!grouped.has(m.chat_id)) {
          grouped.set(m.chat_id, m)
        }
      })
      setChats(Array.from(grouped.values()))
    }
  }

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('bazzar_chat')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !activeChat) return
    
    const { error } = await supabase.from('bazzar_chat').insert([{
      chat_id: activeChat,
      user_id: 'admin',
      message: reply,
      is_admin: true,
      created_at: new Date().toISOString()
    }])
    
    if (!error) setReply('')
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
            <div key={m.id} className={`chat-bubble ${m.is_admin ? 'mine' : 'other'}`}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 2 }}>{m.is_admin ? 'Вы' : 'Клиент'}</div>
              {m.message}
            </div>
          ))}
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
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: 16 }}>Поддержка</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chats.length === 0 && <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 40 }}>Нет диалогов</p>}
        {chats.map(c => (
          <div key={c.chat_id} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => setActiveChat(c.chat_id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><MessageCircle size={16} /> {c.user_id ? 'Пользователь' : 'Гость'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{new Date(c.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.is_admin ? 'Вы: ' : ''}{c.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
