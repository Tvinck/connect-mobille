import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { NotificationItem } from '../components/content/NotificationItem';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

const mockItems = [
  { type: 'info', title: 'Новый Бизнес StandUp на базе', body: 'Технологи, гики и дизайнеры — про то, как рождаются продукты, интерфейсы и мемы', created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString() },
  { type: 'info', title: 'Бери максимум от лета', body: 'В дайджесте: горячие новости, конкурсы и домашка от лидеров', created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString() },
  { type: 'mention', title: 'Вас упомянули в задаче по GGSel', body: 'Пожалуйста, проверьте логи по заказу #4821', created_at: new Date(Date.now() - 3600000 * 2).toISOString() }
];

interface NotificationsProps {
  onBack: () => void;
}

export function Notifications({ onBack }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setNotifications(data as Notification[]);
      } else {
        // Fallback to mock items mapped to the schema
        setNotifications(mockItems.map((m, idx) => ({
          id: `mock-${idx}`,
          type: m.type,
          title: m.title,
          body: m.body,
          is_read: false,
          created_at: m.created_at
        })));
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        fetchNotifications(user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const markAllAsRead = async () => {
    if (!currentUserId) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const getCategoryLabel = (type: string) => {
    if (type === 'mention') return 'Упоминание';
    if (type === 'achievement') return 'Достижение';
    return 'Новость';
  };

  const getIconInfo = (type: string) => {
    if (type === 'mention') return { icon: 'user', color: 'var(--accent)' };
    if (type === 'achievement') return { icon: 'trophy', color: 'var(--yellow)' };
    return { icon: 'newspaper', color: 'var(--amber)' };
  };

  return (
    <div style={{ paddingBottom: 32, background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar 
        title="Уведомления" 
        onBack={onBack} 
        right={
          notifications.some(n => !n.is_read) ? (
            <button 
              onClick={markAllAsRead} 
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-subhead)', fontWeight: 'var(--fw-medium)', cursor: 'pointer', paddingRight: 8 }}
            >
              Прочитать все
            </button>
          ) : null
        } 
      />
      
      <div style={{ padding: '0 var(--screen-pad)' }}>
        <h2 style={{ margin: '4px 0 14px', fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)' }}>Ранее</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>Загрузка уведомлений...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map((n) => {
              const dt = new Date(n.created_at);
              const dateStr = dt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
              const timeStr = dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
              const { icon, color } = getIconInfo(n.type);

              return (
                <div key={n.id} style={{ position: 'relative' }}>
                  <NotificationItem
                    category={getCategoryLabel(n.type)}
                    date={dateStr}
                    time={timeStr}
                    icon={icon}
                    iconColor={color}
                    title={n.title}
                    text={n.body || undefined}
                  />
                  {!n.is_read && (
                    <span 
                      style={{ 
                        position: 'absolute', 
                        top: 18, 
                        right: 18, 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: 'var(--accent)' 
                      }} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
