import React, { useState } from 'react'

export function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check
    if (password === '1234') { // Admin PIN
      localStorage.setItem('admin_token', 'true')
      onLogin()
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 20 }}>
      <form onSubmit={handleLogin} className="card" style={{ width: '100%', maxWidth: 320 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/vite.svg" alt="Logo" style={{ width: 48, height: 48, marginBottom: 12 }} />
          <h2>Connect Mobile</h2>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>Доступ только для персонала</p>
        </div>

        <input 
          type="password" 
          placeholder="ПИН-код (1234)" 
          className="field"
          style={{ marginBottom: 16, textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem' }}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        
        {error && <p style={{ color: 'var(--red)', fontSize: '0.8rem', textAlign: 'center', marginBottom: 12 }}>Неверный пин-код</p>}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Войти
        </button>
      </form>
    </div>
  )
}
