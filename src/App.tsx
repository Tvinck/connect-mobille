import { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom';
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
import { ManualRegistration } from './pages/ManualRegistration';
import { ComingSoon } from './pages/ComingSoon';
import { TabBar } from './components/layout/TabBar';
import { Toaster } from './components/core/Toaster';

// Возврат «назад»: если есть история — назад, иначе на главную
// (важно для deep-link, когда пользователь открыл экран по прямой ссылке).
function useSmartBack() {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state && window.history.state.idx) || 0;
    if (idx > 0) navigate(-1);
    else navigate('/home', { replace: true });
  };
}

// Единый обработчик открытия экранов, совместимый со старым API страниц:
//   onOpen('chat' | 'news' | 'orders' | 'finances' | 'coming:Название')
function useOpen() {
  const navigate = useNavigate();
  return (screen: string) => {
    if (screen.startsWith('coming:')) {
      navigate('/coming/' + encodeURIComponent(screen.slice(7)));
    } else {
      navigate('/' + screen);
    }
  };
}

// Каркас с нижним таб-баром для основных вкладок
function TabLayout({ unreadChatCount }: { unreadChatCount: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname.replace('/', '') || 'home';

  const tabItems = [
    { key: 'home', label: 'Главная', icon: 'headphones' },
    { key: 'hr', label: 'Сервисы HR', icon: 'layout-grid' },
    { key: 'chat', label: 'Чат', icon: 'message-square', badge: unreadChatCount > 0 ? unreadChatCount : undefined },
    { key: 'more', label: 'Ещё', icon: 'ellipsis' },
  ];

  return (
    <>
      <Outlet />
      <TabBar items={tabItems} active={active} onChange={(key) => navigate('/' + key)} />
    </>
  );
}

function HomeRoute({ project, onChangeProject }: { project: string; onChangeProject: (p: string) => void }) {
  const navigate = useNavigate();
  const open = useOpen();
  return (
    <Home
      project={project}
      onChangeProject={onChangeProject}
      onOpenNotifications={() => navigate('/notifications')}
      onOpenServices={() => open('coming:Сервисы')}
      onStartLine={() => navigate('/line')}
      onOpen={open}
    />
  );
}

function ServicesRoute() {
  const navigate = useNavigate();
  const open = useOpen();
  return <ServicesHR onOpenNotifications={() => navigate('/notifications')} onOpen={open} />;
}

interface MoreRouteProps {
  theme: 'light' | 'dark';
  onThemeChange: (t: 'light' | 'dark') => void;
  onLogout: () => void;
}
function MoreRoute({ theme, onThemeChange, onLogout }: MoreRouteProps) {
  const navigate = useNavigate();
  return (
    <More
      onOpenNotifications={() => navigate('/notifications')}
      theme={theme}
      onThemeChange={onThemeChange}
      onLogout={onLogout}
    />
  );
}

function ComingRoute() {
  const { title } = useParams();
  const back = useSmartBack();
  return <ComingSoon title={title || 'Раздел'} onBack={back} />;
}

// Оверлейные экраны без таб-бара, кнопка «назад» через историю
function OverlayRoute({ children }: { children: (back: () => void) => React.ReactNode }) {
  const back = useSmartBack();
  return <>{children(back)}</>;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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
  };

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'var(--bg)' }}>
        Загрузка...
      </div>
    );
  } else if (!isAuthenticated) {
    content = <Login onLogin={() => setIsAuthenticated(true)} />;
  } else {
    content = (
      <BrowserRouter>
        <div style={{ background: 'var(--bg)', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
          <Routes>
            {/* Вкладки с таб-баром */}
            <Route element={<TabLayout unreadChatCount={unreadChatCount} />}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomeRoute project={project} onChangeProject={setProject} />} />
              <Route path="/hr" element={<ServicesRoute />} />
              <Route path="/chat" element={<EmployeeChat />} />
              <Route
                path="/more"
                element={<MoreRoute theme={theme} onThemeChange={handleThemeChange} onLogout={handleLogout} />}
              />
            </Route>

            {/* Оверлейные экраны без таб-бара */}
            <Route path="/notifications" element={<OverlayRoute>{(back) => <Notifications onBack={back} />}</OverlayRoute>} />
            <Route path="/news" element={<OverlayRoute>{(back) => <News onBack={back} />}</OverlayRoute>} />
            <Route path="/orders" element={<OverlayRoute>{(back) => <Orders onBack={back} />}</OverlayRoute>} />
            <Route path="/finances" element={<OverlayRoute>{(back) => <Finances onBack={back} />}</OverlayRoute>} />
            <Route path="/line" element={<OverlayRoute>{(back) => <ClientLine onBack={back} />}</OverlayRoute>} />
            <Route path="/services/manual-registration" element={<OverlayRoute>{(back) => <ManualRegistration onBack={back} />}</OverlayRoute>} />
            <Route path="/coming/:title" element={<ComingRoute />} />

            {/* Фолбэк */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    );
  }

  return (
    <>
      {content}
      <Toaster />
    </>
  );
}

export default App;
