import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      localStorage.setItem('admin_token', 'true')
      onLogin()
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 20 }}>
      <form onSubmit={handleLogin} className="card" style={{ width: '100%', maxWidth: 320, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/vite.svg" alt="Logo" style={{ width: 48, height: 48, marginBottom: 12 }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Connect Mobile</h2>
          <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: 4 }}>Авторизация администратора</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>Email</label>
          <input 
            type="email" 
            placeholder="admin@example.com" 
            className="field"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>Пароль</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            className="field"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && <div style={{ color: 'var(--red)', fontSize: '0.8rem', textAlign: 'center', marginBottom: 16, background: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 8 }}>{error === 'Invalid login credentials' ? 'Неверный email или пароль' : error}</div>}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Войти в систему'}
        </button>
      </form>
    </div>
  )
}
