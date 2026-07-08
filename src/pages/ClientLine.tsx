import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { Field } from '../components/core/Field';
import { Icon } from '../components/core/Icon';
import { Badge } from '../components/core/Badge';
import { ChatBubble } from '../components/content/ChatBubble';
import { SupportSidePanel } from '../components/support/SupportSidePanel';

interface ClientChat {
  user_id: string;
  name: string;
  platform: 'BAZZAR SERTS' | 'Veil VPN';
  source: 'email' | 'site' | 'ggsel' | 'avito' | 'telegram' | 'other';
  waitMin: number;
  project: string;
  messages: any[];
}

const SOURCE = {
  email: { label: 'Почта', icon: 'mail', color: 'var(--accent)' },
  site: { label: 'Сайт', icon: 'globe', color: '#4cd964' },
  ggsel: { label: 'GGSel', icon: 'gamepad-2', color: 'var(--violet)' },
  avito: { label: 'Авито', icon: 'shopping-bag', color: 'var(--amber)' },
  telegram: { label: 'Telegram', icon: 'send', color: '#2ea2e9' },
  other: { label: 'Прочее', icon: 'ellipsis', color: 'var(--text-2)' },
};

function waitTone(min: number) {
  if (min >= 15) return 'red';
  if (min >= 5) return 'amber';
  return 'green';
}

function fmtWait(min: number) {
  if (min < 1) return 'сейчас';
  if (min < 60) return min + ' мин';
  return Math.floor(min / 60) + ' ч';
}

interface ClientLineProps {
  onBack: () => void;
}

type ChatTab = 'chat' | 'order' | 'replies' | 'procedures';

export function ClientLine({ onBack }: ClientLineProps) {
  const [chats, setChats] = useState<ClientChat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'BAZZAR SERTS' | 'Veil VPN'>('all');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [senderEmail, setSenderEmail] = useState('unknown');
  const [chatTab, setChatTab] = useState<ChatTab>('chat');
  
  const endRef = useRef<HTMLDivElement>(null);
  const active = chats.find(c => c.user_id === activeId);

  // Load session email
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setSenderEmail(session.user.email);
      }
    });
  }, []);

  // Fetch chats
  const fetchChatsData = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (data) {
        // Group by user_id
        const groups = new Map<string, any[]>();
        data.forEach(msg => {
          if (!groups.has(msg.user_id)) {
            groups.set(msg.user_id, []);
          }
          groups.get(msg.user_id)!.push(msg);
        });

        const formattedChats: ClientChat[] = [];
        
        groups.forEach((msgs, userId) => {
          // Sort messages chronologically
          const sortedMsgs = msgs.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          const lastMsg = sortedMsgs[sortedMsgs.length - 1];
          const isFromUser = lastMsg.is_from_user;
          
          // Calculate wait time
          let waitMin = 0;
          if (isFromUser) {
            waitMin = Math.max(0, Math.floor((Date.now() - new Date(lastMsg.created_at).getTime()) / 60000));
          }

          // Determine project platform
          const projectStr = lastMsg.project || '';
          const isVeil = projectStr.toLowerCase().includes('veil') || projectStr.toLowerCase().includes('vpn');
          const platform = isVeil ? 'Veil VPN' : 'BAZZAR SERTS';

          // Determine source
          let source: ClientChat['source'] = 'other';
          if (projectStr.toLowerCase().includes('ggsel')) {
            source = 'ggsel';
          } else if (projectStr.toLowerCase().includes('telegram')) {
            source = 'telegram';
          } else if (projectStr.toLowerCase().includes('avito')) {
            source = 'avito';
          } else if (projectStr.toLowerCase().includes('email')) {
            source = 'email';
          } else if (projectStr.toLowerCase().includes('connect') || projectStr.toLowerCase().includes('site') || projectStr === '') {
            source = 'site';
          }

          // Format name
          let name = `Клиент #${userId.substring(0, 6)}`;
          if (projectStr.startsWith('GGSel (Заказ')) {
            const orderId = projectStr.replace('GGSel (Заказ ', '').replace(')', '');
            name = `GGSel: Заказ #${orderId}`;
          } else if (projectStr.includes('Telegram')) {
            name = `Telegram: ${userId.substring(0, 8)}`;
          }

          formattedChats.push({
            user_id: userId,
            name,
            platform,
            source,
            waitMin,
            project: projectStr,
            messages: sortedMsgs
          });
        });

        // Sort by wait time descending, showing waiting clients first
        formattedChats.sort((a, b) => b.waitMin - a.waitMin);
        setChats(formattedChats);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatsData();

    // Listen to real-time message inserts
    const channel = supabase.channel('support_client_line')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        fetchChatsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark active chat as read
  useEffect(() => {
    if (activeId) {
      const markAsRead = async () => {
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('user_id', activeId)
          .eq('is_from_user', true)
          .eq('is_read', false);
      };
      markAsRead();
    }
  }, [activeId, active?.messages.length]);

  // Scroll to bottom
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [active?.messages.length, activeId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !active) return;
    const textToSend = draft.trim();
    setDraft('');

    try {
      // Optimistic update local state
      const localMsg = {
        id: Date.now(),
        user_id: active.user_id,
        message: textToSend,
        is_from_user: false,
        is_read: true,
        project: active.project,
        created_at: new Date().toISOString()
      };
      
      setChats(prev => prev.map(c => c.user_id === active.user_id ? { ...c, messages: [...c.messages, localMsg], waitMin: 0 } : c));

      // Call proxy endpoint (same-origin) which forwards to the Connect CRM API
      // This avoids CORS issues — proxy is at /api/proxy/send-message on this domain
      if (active.project.toLowerCase().includes('ggsel')) {
        const res = await fetch('/api/proxy/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: active.user_id,
            message: textToSend,
            project: active.project,
            senderEmail: senderEmail
          })
        });

        const result = await res.json();
        if (!result.success) {
          throw new Error(result.error || 'GGSel API failed');
        }
      } else {
        // Direct insert for non-GGSel (Telegram bots will handle it)
        const { error } = await supabase.from('support_messages').insert({
          user_id: active.user_id,
          message: textToSend,
          is_from_user: false,
          is_read: true,
          project: active.project || 'Connect Mobile',
          sender_email: senderEmail
        });

        if (error) throw error;
      }
      
      fetchChatsData();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert('Ошибка при отправке: ' + err.message);
      fetchChatsData(); // Revert/Reload
    }
  };

  if (active) {
    const src = SOURCE[active.source] || SOURCE.other;
    const isGgsel = active.project.toLowerCase().includes('ggsel');

    const CHAT_TABS: { id: ChatTab; label: string }[] = [
      { id: 'chat',       label: '💬 Чат' },
      { id: 'order',      label: '📦 Заказ' },
      { id: 'replies',    label: '⚡ Шаблоны' },
      { id: 'procedures', label: '✅ Чеклист' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <NavBar title={active.name} subtitle={`${active.platform} · ${src.label}`} onBack={() => { setActiveId(null); setChatTab('chat'); }} />

        {/* Tab bar */}
        <div style={{
          display: 'flex', background: 'var(--surface)', borderBottom: '0.5px solid var(--hair)',
          overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
        }}>
          {CHAT_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setChatTab(t.id)}
              style={{
                flex: 1, minWidth: 'fit-content', padding: '10px 12px',
                border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                color: chatTab === t.id ? 'var(--accent)' : 'var(--text-3)',
                borderBottom: chatTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Chat tab */}
        {chatTab === 'chat' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
              {active.messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  mine={!m.is_from_user}
                  author={m.is_from_user ? 'Клиент' : (m.sender_email?.split('@')[0] || 'Оператор')}
                  time={new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  read={m.is_read}
                >
                  {m.message}
                </ChatBubble>
              ))}
              <div ref={endRef}></div>
            </div>
            <form onSubmit={send} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--tabbar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px 24px 16px', borderTop: '0.5px solid var(--hair-strong)', zIndex: 100 }}>
              <Icon name="paperclip" size={24} color="var(--accent)" onClick={() => alert('Прикрепление файлов скоро будет доступно')} style={{ cursor: 'pointer' }} />
              <Field placeholder="Ответ клиенту" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ borderRadius: 'var(--radius-pill)', padding: '10px 16px' }} />
              <button type="submit" style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Icon name="arrow-up" size={20} color="#fff" strokeWidth={2.5} />
              </button>
            </form>
          </>
        )}

        {/* Side panel tabs: Заказ / Шаблоны / Процедуры */}
        {chatTab !== 'chat' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SupportSidePanel
              userId={active.user_id}
              project={active.project}
              isGgsel={isGgsel}
              activeTab={chatTab as 'order' | 'replies' | 'procedures'}
              onInsertReply={(text) => {
                setDraft(text);
                setChatTab('chat');
              }}
            />
          </div>
        )}
      </div>
    );
  }

  const visible = chats.filter(c => filter === 'all' || c.platform === filter);
  const waiting = visible.filter(c => c.waitMin > 0).length;

  return (
    <div style={{ paddingBottom: 'calc(var(--tabbar-h) + 16px)', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar title="Выход на линию" subtitle={`${waiting} клиентов ждут ответа`} onBack={onBack} />
      
      <div style={{ display: 'flex', gap: 8, padding: '4px var(--screen-pad) 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['all', 'BAZZAR SERTS', 'Veil VPN'] as const).map((ch) => {
          const on = filter === ch;
          return (
            <button
              key={ch}
              onClick={() => setFilter(ch)}
              type="button"
              style={{
                flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--fs-subhead)',
                fontWeight: 'var(--fw-semibold)',
                background: on ? 'var(--accent)' : 'var(--surface-2)',
                color: on ? '#fff' : 'var(--text-2)',
              }}
            >
              {ch === 'all' ? 'Все проекты' : ch}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>Загрузка чатов...</div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>Нет открытых диалогов</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
          {visible.map((c) => {
            const src = SOURCE[c.source] || SOURCE.other;
            const last = c.messages[c.messages.length - 1] || { message: '', created_at: new Date() };
            return (
              <button
                key={c.user_id}
                onClick={() => setActiveId(c.user_id)}
                type="button"
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'none', border: 'none', padding: '12px', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', fontFamily: 'var(--font-sans)', width: '100%', borderRadius: 'var(--radius)' }}
              >
                <span style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={src.icon} size={22} color={src.color} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    {c.waitMin > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: 'var(--fs-footnote)', fontWeight: 'var(--fw-semibold)', color: waitTone(c.waitMin) === 'red' ? 'var(--red)' : waitTone(c.waitMin) === 'amber' ? 'var(--amber)' : '#4cd964' }}>
                        <Icon name="clock" size={13} strokeWidth={2.5} /> {fmtWait(c.waitMin)}
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '5px 0 5px' }}>
                    <Badge tone={c.platform === 'Veil VPN' ? 'violet' : 'blue'}>{c.platform}</Badge>
                    <Badge tone="neutral">{src.label}</Badge>
                  </span>
                  <span style={{ display: 'block', fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {last.message}
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
