import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { Field } from '../components/core/Field';
import { Icon } from '../components/core/Icon';
import { ChatBubble } from '../components/content/ChatBubble';

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  unreadCount?: number;
  lastMessage?: {
    text: string;
    author: string;
    avatar: string;
    time: string;
  };
}

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
}

export function EmployeeChat() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const endRef = useRef<HTMLDivElement>(null);
  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Load session user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Fetch channels & their last messages
  const fetchChannelsData = async () => {
    try {
      // 1. Get channels
      let { data: dbChannels, error: chError } = await supabase
        .from('channels')
        .select('*')
        .order('name', { ascending: true });

      if (chError) throw chError;

      // Seed default channels if empty
      if (!dbChannels || dbChannels.length === 0) {
        const { data: seeded, error: seedError } = await supabase
          .from('channels')
          .insert([
            { slug: 'bazzar-serts-team', name: 'Команда BAZZAR SERTS', description: 'Общий чат команды BAZZAR SERTS' },
            { slug: 'veil-vpn-team', name: 'Veil VPN — смена', description: 'Оперативные вопросы по Veil VPN' }
          ])
          .select();
        
        if (!seedError && seeded) {
          dbChannels = seeded;
        }
      }

      if (dbChannels) {
        const formattedChannels: Channel[] = [];

        // 2. Fetch last messages for each channel
        for (const ch of dbChannels) {
          const { data: lastMsgs } = await supabase
            .from('messages')
            .select(`
              content,
              created_at,
              sender:users (full_name, email)
            `)
            .eq('channel_id', ch.id)
            .order('created_at', { ascending: false })
            .limit(1);

          let lastMessage = undefined;
          if (lastMsgs && lastMsgs.length > 0) {
            const m = lastMsgs[0] as any;
            const authorName = m.sender?.full_name || m.sender?.email?.split('@')[0] || 'Система';
            const initials = authorName.substring(0, 2).toUpperCase();
            const timeStr = new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            
            lastMessage = {
              text: m.content,
              author: authorName,
              avatar: initials,
              time: timeStr
            };
          }

          formattedChannels.push({
            id: ch.id,
            name: ch.name,
            slug: ch.slug,
            description: ch.description || '',
            unreadCount: 0,
            lastMessage
          });
        }

        setChannels(formattedChannels);
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelsData();

    // Listen to real-time message additions
    const channel = supabase.channel('global_messages_listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchChannelsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch messages when entering channel
  useEffect(() => {
    if (activeChannelId) {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            channel_id,
            sender_id,
            content,
            created_at,
            sender:users (full_name, email)
          `)
          .eq('channel_id', activeChannelId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error(error);
        } else if (data) {
          setMessages(data as any[]);
        }
      };

      fetchMessages();

      // Listen to channel messages in real-time
      const channelSub = supabase.channel(`room_${activeChannelId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannelId}` }, async (payload) => {
          // Fetch sender details
          const { data: senderData } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', payload.new.sender_id)
            .maybeSingle();

          const newMsg = {
            ...payload.new,
            sender: senderData || undefined
          } as Message;

          setMessages(prev => [...prev, newMsg]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channelSub);
      };
    }
  }, [activeChannelId]);

  // Scroll to bottom
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeChannelId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeChannelId || !currentUserId) return;
    const textToSend = draft.trim();
    setDraft('');

    const { error } = await supabase
      .from('messages')
      .insert({
        channel_id: activeChannelId,
        sender_id: currentUserId,
        content: textToSend
      });

    if (error) {
      console.error('Failed to send message:', error);
      alert('Не удалось отправить сообщение');
    }
  };

  if (activeChannel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <NavBar title={activeChannel.name} subtitle={activeChannel.description} onBack={() => setActiveChannelId(null)} />
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
          {messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            const authorName = m.sender?.full_name || m.sender?.email?.split('@')[0] || 'Коллега';
            const initials = authorName.substring(0, 2).toUpperCase();
            return (
              <ChatBubble
                key={m.id}
                mine={isMine}
                author={isMine ? undefined : authorName}
                avatar={isMine ? undefined : initials}
                time={new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              >
                {m.content}
              </ChatBubble>
            );
          })}
          <div ref={endRef}></div>
        </div>

        <form onSubmit={send} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--tabbar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px 24px 16px', borderTop: '0.5px solid var(--hair-strong)', zIndex: 100 }}>
          <Icon name="paperclip" size={24} color="var(--accent)" onClick={() => alert('Прикрепление файлов скоро будет доступно')} style={{ cursor: 'pointer' }} />
          <Field placeholder="Сообщение" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ borderRadius: 'var(--radius-pill)', padding: '10px 16px' }} />
          <button type="submit" style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="arrow-up" size={20} color="#fff" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 'calc(var(--tabbar-h) + 16px)', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar title="Чат" subtitle="Служебные каналы для коммуникации" />
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>Загрузка каналов...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 8px 0' }}>
          {channels.map((c) => {
            return (
              <button
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                type="button"
                style={{
                  display: 'flex', gap: 12, alignItems: 'center', background: 'none', border: 'none',
                  padding: '16px 12px', cursor: 'pointer', textAlign: 'left', color: 'var(--text)',
                  fontFamily: 'var(--font-sans)', width: '100%', borderRadius: 'var(--radius)',
                  borderBottom: '0.5px solid var(--hair)'
                }}
              >
                <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--surface-3)', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, flexShrink: 0 }}>
                  {c.name.split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase()}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    {c.lastMessage && (
                      <span style={{ fontSize: 'var(--fs-footnote)', color: 'var(--text-3)' }}>{c.lastMessage.time}</span>
                    )}
                  </span>
                  
                  <span style={{ display: 'block', fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
                    {c.lastMessage ? (
                      <>
                        <strong style={{ color: 'var(--text)' }}>{c.lastMessage.author}:</strong> {c.lastMessage.text}
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Нет сообщений</span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
