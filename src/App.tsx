import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Package, MessageCircle } from 'lucide-react'
import { Login } from './pages/Login'
import { Orders } from './pages/Orders'
import { Support } from './pages/Support'

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      <div 
        className={`nav-item ${location.pathname === '/' || location.pathname === '/orders' ? 'active' : ''}`}
        onClick={() => navigate('/orders')}
      >
        <Package size={24} />
        <span>Заказы</span>
      </div>
      <div 
        className={`nav-item ${location.pathname === '/support' ? 'active' : ''}`}
        onClick={() => navigate('/support')}
      >
        <MessageCircle size={24} />
        <span>Чат</span>
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
      </Routes>
      <BottomNav />
    </>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('admin_token') === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

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
