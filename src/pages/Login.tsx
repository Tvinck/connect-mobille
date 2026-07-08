import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Field } from '../components/core/Field';
import { Button } from '../components/core/Button';
import { Icon } from '../components/core/Icon';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'welcome'>('login');
  const [fullName, setFullName] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Введите email и пароль');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'Неверный email или пароль' : authError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', authData.user.id)
          .maybeSingle();

        setFullName(profile?.full_name || email.trim().split('@')[0]);
        setStep('welcome');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 32px', color: 'var(--text)', gap: 20, background: 'var(--bg)' }}>
        <span style={{ width: 96, height: 96, borderRadius: 28, background: 'var(--promo-grad)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="hand-heart" size={46} color="#fff" strokeWidth={1.6} />
        </span>
        <div>
          <div style={{ fontSize: 28, fontWeight: 'var(--fw-bold)', marginBottom: 8 }}>Добро пожаловать!</div>
          <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-2)', lineHeight: 'var(--lh-body)' }}>
            Рады видеть, <strong style={{ color: 'var(--text)' }}>{fullName}</strong>. Новости, чаты и заказы по проектам BAZZAR SERTS и Veil VPN — в одном месте.
          </div>
        </div>
        <div style={{ width: '100%', marginTop: 12, maxWidth: 320 }}>
          <Button variant="primary" block onClick={onLogin}>Войти в приложение</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', color: 'var(--text)', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>
          CO<span style={{ color: 'var(--accent)' }}>NN</span>ECT
        </div>
        <div style={{ fontSize: 'var(--fs-subhead)', color: 'var(--text-2)', marginTop: 8 }}>Приложение для сотрудников</div>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320, margin: '0 auto' }}>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--fs-footnote)', color: 'var(--text-2)', fontWeight: 'var(--fw-semibold)', marginBottom: 6, paddingLeft: 4 }}>Email</label>
          <Field type="email" placeholder="you@connect.ru" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--fs-footnote)', color: 'var(--text-2)', fontWeight: 'var(--fw-semibold)', marginBottom: 6, paddingLeft: 4 }}>Пароль</label>
          <Field type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error ? (
          <div style={{ color: 'var(--red)', fontSize: 'var(--fs-footnote)', textAlign: 'center', background: 'var(--red-dim)', padding: '10px', borderRadius: 'var(--radius)' }}>{error}</div>
        ) : null}
        <Button variant="primary" block disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Вход...' : 'Войти'}
        </Button>
        <button type="button" onClick={() => alert('Пожалуйста, обратитесь к руководителю для сброса пароля.')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-subhead)', fontWeight: 'var(--fw-medium)', cursor: 'pointer', padding: 10, fontFamily: 'var(--font-sans)' }}>
          Не помню пароль
        </button>
      </form>
    </div>
  );
}
