import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from '../components/layout/NavBar';
import { Card } from '../components/layout/Card';
import { Button } from '../components/core/Button';
import { StatCard } from '../components/content/StatCard';
import { ServiceTile } from '../components/content/ServiceTile';
import { ListRow } from '../components/content/ListRow';
import { ProjectPicker } from '../components/content/ProjectPicker';
import { PromoBanner } from '../components/content/PromoBanner';
import { Switch } from '../components/core/Switch';

interface HomeProps {
  onOpenNotifications: () => void;
  onOpenServices: () => void;
  onStartLine: () => void;
  onOpen: (screen: string) => void;
  project: string;
  onChangeProject: (project: string) => void;
}

export function Home({
  onOpenNotifications,
  onOpenServices,
  onStartLine,
  onOpen,
  project,
  onChangeProject
}: HomeProps) {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [userStatus, setUserStatus] = useState<'online' | 'offline' | 'busy'>('offline');
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ messages: 0, orders: 0, open: 0, closed: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(false);

  useEffect(() => {
    // Get current user and set status
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch current user status
        const { data: profile } = await supabase
          .from('users')
          .select('status')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profile) {
          setUserStatus(profile.status as 'online' | 'offline' | 'busy');
        }

        // Check unread notifications
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        setUnreadNotifs(!!(count && count > 0));
      }
    };
    getUserData();
  }, []);

  // Fetch real statistics based on selected project
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayIso = startOfDay.toISOString();

      try {
        if (project === 'BAZZAR SERTS') {
          // BAZZAR SERTS / GGSel stats
          // 1. Messages today
          const { count: msgCount } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .not('project', 'ilike', '%veil%')
            .not('project', 'ilike', '%vpn%')
            .gte('created_at', startOfDayIso);

          // 2. Orders today (inserted certificates or orders today)
          const { count: ordCount } = await supabase
            .from('apple_certificates')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDayIso);

          // 3. Open orders (crm_status is pending or in_progress)
          const { count: openCount } = await supabase
            .from('apple_certificates')
            .select('*', { count: 'exact', head: true })
            .in('crm_status', ['pending', 'in_progress']);

          // 4. Closed orders (crm_status is approved)
          const { count: closedCount } = await supabase
            .from('apple_certificates')
            .select('*', { count: 'exact', head: true })
            .eq('crm_status', 'approved');

          setStats({
            messages: msgCount || 0,
            orders: ordCount || 0,
            open: openCount || 0,
            closed: closedCount || 0
          });
        } else {
          // Veil VPN stats
          // 1. Messages today
          const { count: msgCount } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .or('project.ilike.%veil%,project.ilike.%vpn%')
            .gte('created_at', startOfDayIso);

          // 2. Orders today (new subscriptions created today)
          const { count: ordCount } = await supabase
            .from('vpn_subscriptions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDayIso);

          // 3. Open orders (active subscriptions)
          const { count: openCount } = await supabase
            .from('vpn_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

          // 4. Closed orders (expired/non-active subscriptions)
          const { count: closedCount } = await supabase
            .from('vpn_subscriptions')
            .select('*', { count: 'exact', head: true })
            .not('status', 'eq', 'active');

          setStats({
            messages: msgCount || 0,
            orders: ordCount || 0,
            open: openCount || 0,
            closed: closedCount || 0
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
    
    // Set up real-time subscription for statistics refresh
    const channel = supabase.channel('home_stats_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apple_certificates' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project]);

  const toggleDuty = async (isOn: boolean) => {
    if (!userId) return;
    const nextStatus = isOn ? 'online' : 'offline';
    setUserStatus(nextStatus);
    
    const { error } = await supabase
      .from('users')
      .update({ status: nextStatus })
      .eq('id', userId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Не удалось изменить рабочий статус');
      // Revert status
      setUserStatus(isOn ? 'offline' : 'online');
    }
  };

  return (
    <div style={{ paddingBottom: 'calc(var(--tabbar-h) + 16px)', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <NavBar title="Главная" large onBell={onOpenNotifications} bellDot={unreadNotifs} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 var(--screen-pad)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ProjectPicker projects={['BAZZAR SERTS', 'Veil VPN']} value={project} onChange={onChangeProject} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', padding: '6px 12px', borderRadius: 'var(--radius-pill)' }}>
            <span style={{ fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', fontWeight: 'var(--fw-medium)' }}>
              {userStatus === 'online' ? 'На линии' : 'Не в сети'}
            </span>
            <Switch checked={userStatus === 'online'} onChange={toggleDuty} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard icon="message-square" value={loadingStats ? '...' : stats.messages} label="Сообщений сегодня" tone="blue" />
          <StatCard icon="package" value={loadingStats ? '...' : stats.orders} label="Заказов сегодня" />
          <StatCard icon="circle-dot" value={loadingStats ? '...' : stats.open} label={project === 'BAZZAR SERTS' ? "Открытых заказов" : "Активных подписок"} tone="amber" />
          <StatCard icon="circle-check" value={loadingStats ? '...' : stats.closed} label={project === 'BAZZAR SERTS' ? "Закрытых заказов" : "Завершилось"} tone="green" />
        </div>

        <Card>
          <div style={{ fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)', marginBottom: 6 }}>Разметка данных</div>
          <div style={{ fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', marginBottom: 16 }}>Выполняйте задания и получайте вознаграждения</div>
          <Button variant="primary" block onClick={() => onOpen('coming:Разметка данных')}>Начать разметку</Button>
        </Card>

        <Card>
          <div style={{ fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)', marginBottom: 6 }}>Выход на линию</div>
          <div style={{ fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', marginBottom: 16 }}>Получайте задания и совершайте звонки клиентам</div>
          <Button variant="tonal" block onClick={onStartLine}>Начать работу</Button>
        </Card>

        {bannerVisible ? (
          <PromoBanner
            title="Чат команды"
            subtitle="Обсуждайте заказы с коллегами прямо в приложении"
            icon="message-square"
            onDismiss={() => setBannerVisible(false)}
            onClick={() => onOpen('chat')}
          />
        ) : null}

        <Card style={{ padding: '20px 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 14 }}>
            <span style={{ fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)' }}>Полезные сервисы</span>
            <span onClick={onOpenServices} style={{ fontSize: 'var(--fs-body)', color: 'var(--accent)', cursor: 'pointer' }}>Все</span>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
            <ServiceTile icon="newspaper" label="Новости" onClick={() => onOpen('news')} />
            <ServiceTile icon="calendar-clock" label="TWFM" onClick={() => onOpen('coming:TWFM')} />
            <ServiceTile icon="chart-line" label="Статистика" onClick={() => onOpen('coming:Статистика')} />
            <ServiceTile icon="package" label="Заказы" onClick={() => onOpen('orders')} />
            <ServiceTile icon="wallet" label="Финансы" onClick={() => onOpen('finances')} />
          </div>
        </Card>

        <Card style={{ padding: '20px 20px 10px' }}>
          <div style={{ fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-bold)', marginBottom: 8 }}>Справка и поддержка</div>
          <ListRow icon="lightbulb" title="Идеи" subtitle="Предлагайте улучшения продуктов и процессов" onClick={() => onOpen('coming:Идеи')} />
          <ListRow icon="list-checks" title="Задачи" subtitle="Ваши задачи и статусы их выполнения" onClick={() => onOpen('coming:Задачи')} />
          <ListRow icon="life-buoy" title="Информер" subtitle="Отправка запросов в техподдержку" onClick={() => onOpen('coming:Информер')} />
        </Card>
      </div>
    </div>
  );
}
