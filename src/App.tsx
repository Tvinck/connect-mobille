import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { setupWebPush } from './lib/push';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { ServicesHR } from './pages/ServicesHR';
import { EmployeeChat } from './pages/EmployeeChat';
import { More } from './pages/More';
import { Notifications } from './pages/Notifications';
import { News } from './pages/News';
import { Orders } from './pages/Orders';
import { Finances } from './pages/Finances';
import { ClientLine } from './pages/ClientLine';
import { ComingSoon } from './pages/ComingSoon';
import { TabBar } from './components/layout/TabBar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [tab, setTab] = useState<string>('home');
  const [overlay, setOverlay] = useState<string | null>(null);
  const [project, setProject] = useState<string>('BAZZAR SERTS');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Check active session and listen to changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch unread client chats count for tab badge
  const fetchUnreadChats = async () => {
    try {
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_from_user', true)
        .eq('is_read', false);
      setUnreadChatCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread chat count:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setupWebPush();
      fetchUnreadChats();

      // Subscribe to unread messages updates
      const channel = supabase.channel('mobile_app_unread_badge')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
          fetchUnreadChats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const currentTheme = savedTheme || 'dark';
    setTheme(currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setTab('home');
    setOverlay(null);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'var(--bg)' }}>
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Set active fullscreen overlay/screen
  let currentScreen = null;
  const back = () => setOverlay(null);

  if (overlay === 'notifications') {
    currentScreen = <Notifications onBack={back} />;
  } else if (overlay === 'news') {
    currentScreen = <News onBack={back} />;
  } else if (overlay === 'orders') {
    currentScreen = <Orders onBack={back} />;
  } else if (overlay === 'finances') {
    currentScreen = <Finances onBack={back} />;
  } else if (overlay === 'line') {
    currentScreen = <ClientLine onBack={back} />;
  } else if (overlay && overlay.startsWith('coming:')) {
    currentScreen = <ComingSoon title={overlay.substring(7)} onBack={back} />;
  } else {
    // Standard tab screens
    if (tab === 'home') {
      currentScreen = (
        <Home
          project={project}
          onChangeProject={setProject}
          onOpenNotifications={() => setOverlay('notifications')}
          onOpenServices={() => setOverlay('coming:Сервисы')}
          onStartLine={() => setOverlay('line')}
          onOpen={setOverlay}
        />
      );
    } else if (tab === 'hr') {
      currentScreen = (
        <ServicesHR
          onOpenNotifications={() => setOverlay('notifications')}
          onOpen={setOverlay}
        />
      );
    } else if (tab === 'chat') {
      currentScreen = <EmployeeChat />;
    } else {
      currentScreen = (
        <More
          onOpenNotifications={() => setOverlay('notifications')}
          theme={theme}
          onThemeChange={handleThemeChange}
          onLogout={handleLogout}
        />
      );
    }
  }

  const tabItems = [
    { key: 'home', label: 'Главная', icon: 'headphones' },
    { key: 'hr', label: 'Сервисы HR', icon: 'layout-grid' },
    { key: 'chat', label: 'Чат', icon: 'message-square', badge: unreadChatCount > 0 ? unreadChatCount : undefined },
    { key: 'more', label: 'Ещё', icon: 'ellipsis' },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {currentScreen}
      {overlay === null && (
        <TabBar items={tabItems} active={tab} onChange={setTab} />
      )}
    </div>
  );
}

export default App;
