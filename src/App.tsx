import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { setupWebPush } from './lib/push'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Smartphone, MessageCircle, Wallet, Users } from 'lucide-react'
import { Login } from './pages/Login'
import { Orders } from './pages/Orders'
import { Support } from './pages/Support'
import { Finances } from './pages/Finances'
import { CRM } from './pages/CRM'

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_from_user', true)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }
    
    fetchUnread()
    
    const sub = supabase.channel('support_msgs_nav')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        fetchUnread()
      })
      .subscribe()
      
    return () => { supabase.removeChannel(sub) }
  }, [])

  return (
    <nav className="bottom-nav">
      <div 
        className={`nav-item ${location.pathname === '/' || location.pathname === '/orders' ? 'active' : ''}`}
        onClick={() => navigate('/orders')}
      >
        <Smartphone size={22} />
        <span style={{fontSize: '0.65rem'}}>Certs</span>
      </div>
      <div 
        className={`nav-item ${location.pathname === '/finances' ? 'active' : ''}`}
        onClick={() => navigate('/finances')}
      >
        <Wallet size={22} />
        <span style={{fontSize: '0.65rem'}}>Финансы</span>
      </div>
      <div 
        className={`nav-item ${location.pathname === '/crm' ? 'active' : ''}`}
        onClick={() => navigate('/crm')}
      >
        <Users size={22} />
        <span style={{fontSize: '0.65rem'}}>CRM</span>
      </div>
      <div 
        className={`nav-item ${location.pathname === '/support' ? 'active' : ''}`}
        onClick={() => navigate('/support')}
        style={{ position: 'relative' }}
      >
        <MessageCircle size={22} />
        {unreadCount > 0 && (
          <div style={{ position: 'absolute', top: 4, right: 12, background: 'var(--red)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '0 5px', borderRadius: 10, border: '2px solid var(--bg)' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        <span style={{fontSize: '0.65rem'}}>Чат</span>
      </div>
    </nav>
  )
}

function ProtectedLayout() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Orders />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/support" element={<Support />} />
        <Route path="/finances" element={<Finances />} />
        <Route path="/crm" element={<CRM />} />
      </Routes>
      <BottomNav />
    </>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setupWebPush();
    }
  }, [isAuthenticated])

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Загрузка...</div>
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <BrowserRouter>
      <ProtectedLayout />
    </BrowserRouter>
  )
}

export default App
