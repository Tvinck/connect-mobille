import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { Card } from '../components/layout/Card';
import { ListRow } from '../components/content/ListRow';

interface ServicesHRProps {
  onOpenNotifications: () => void;
  onOpen: (screen: string) => void;
}

const services = [
  { icon: 'file-check', title: 'Ручная регистрация', key: 'services/manual-registration' },
  { icon: 'newspaper', title: 'Новости', key: 'news' },
  { icon: 'calendar-clock', title: 'TWFM', key: 'coming:TWFM' },
  { icon: 'chart-line', title: 'Статистика', key: 'coming:Статистика' },
  { icon: 'package', title: 'Заказы', key: 'orders' },
  { icon: 'wallet', title: 'Финансы', key: 'finances' },
];

export function ServicesHR({ onOpenNotifications, onOpen }: ServicesHRProps) {
  const [unreadNotifs, setUnreadNotifs] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .then(({ count }) => {
            setUnreadNotifs(!!(count && count > 0));
          });
      }
    });
  }, []);

  return (
    <div style={{ paddingBottom: 'calc(var(--tabbar-h) + 16px)', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar title="Сервисы HR" onBell={onOpenNotifications} bellDot={unreadNotifs} />
      <div style={{ padding: '4px var(--screen-pad) 0' }}>
        <h2 style={{ margin: '8px 0 16px', fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)' }}>Сервисы</h2>
        <Card style={{ padding: '8px 20px' }}>
          {services.map((s) => (
            <ListRow 
              key={s.title} 
              icon={s.icon} 
              title={s.title} 
              onClick={() => onOpen(s.key)} 
            />
          ))}
        </Card>
      </div>
    </div>
  );
}
