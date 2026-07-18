import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Field } from '../components/core/Field';
import { Button } from '../components/core/Button';
import { Icon } from '../components/core/Icon';
import { toast } from '../lib/toast';

interface LoginProps {
  onLogin: () => void;
}

/* ─── Animated floating orb ─────────────────────────────────── */
function Orb({ color, size, x, y, delay }: { color: string; size: number; x: string; y: string; delay: number }) {
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: size, height: size,
        borderRadius: '50%', background: color, filter: 'blur(70px)',
        opacity: 0.5, pointerEvents: 'none',
        animation: `orbFloat ${8 + delay}s ease-in-out infinite alternate`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'welcome'>('login');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

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

  /* ═══════════════════ WELCOME SCREEN ═══════════════════ */
  if (step === 'welcome') {
    return (
      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
        padding: '0 32px', color: 'var(--text)', background: 'var(--bg)',
        position: 'relative', overflow: 'hidden',
      }}>
        <Orb color="rgba(10,132,255,0.25)" size={260} x="-10%" y="20%" delay={0} />
        <Orb color="rgba(191,90,242,0.2)" size={200} x="70%" y="60%" delay={2} />

        <div style={{
          animation: 'fadeSlideUp 0.6s ease-out both',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          position: 'relative', zIndex: 1,
        }}>
          {/* Animated checkmark */}
          <div style={{
            width: 88, height: 88, borderRadius: 26,
            background: 'linear-gradient(135deg, var(--green), #56d87a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(47,174,92,0.35)',
            animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
          }}>
            <Icon name="check" size={44} color="#fff" strokeWidth={2.5} />
          </div>

          <div>
            <div style={{
              fontSize: 28, fontWeight: 'var(--fw-bold)',
              marginBottom: 8, letterSpacing: '-0.3px',
            }}>Добро пожаловать!</div>
            <div style={{
              fontSize: 'var(--fs-subhead)', color: 'var(--text-2)',
              lineHeight: 1.5, maxWidth: 280,
            }}>
              Рады видеть, <strong style={{ color: 'var(--text)' }}>{fullName}</strong>.
              <br />Все проекты и чаты — в одном месте.
            </div>
          </div>

          <div style={{ width: '100%', marginTop: 12, maxWidth: 300 }}>
            <Button variant="primary" block onClick={onLogin}>
              Войти в приложение
            </Button>
          </div>
        </div>

        <style>{welcomeKeyframes}</style>
      </div>
    );
  }

  /* ═══════════════════ LOGIN SCREEN ═══════════════════ */
  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '0 28px', color: 'var(--text)',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <Orb color="rgba(10,132,255,0.18)" size={300} x="-15%" y="5%" delay={0} />
      <Orb color="rgba(191,90,242,0.12)" size={220} x="75%" y="65%" delay={3} />
      <Orb color="rgba(255,221,45,0.08)" size={180} x="50%" y="-5%" delay={1.5} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* Logo mark */}
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, var(--accent), #5856d6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(10,132,255,0.3)',
          }}>
            <Icon name="zap" size={34} color="#fff" strokeWidth={2} />
          </div>

          <div style={{
            fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px',
            lineHeight: 1.1,
          }}>
            CO<span style={{
              background: 'linear-gradient(135deg, var(--accent), #5856d6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>NN</span>ECT
          </div>
          <div style={{
            fontSize: 'var(--fs-footnote)', color: 'var(--text-3)',
            marginTop: 8, fontWeight: 'var(--fw-medium)',
            letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>Приложение для сотрудников</div>
        </div>

        {/* Form card */}
        <form
          onSubmit={submit}
          style={{
            display: 'flex', flexDirection: 'column', gap: 16,
            width: '100%', maxWidth: 340, margin: '0 auto',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 24px',
            border: '1px solid var(--hair)',
          }}
        >
          {/* Email */}
          <div>
            <label style={{
              display: 'block', fontSize: 'var(--fs-footnote)',
              color: 'var(--text-2)', fontWeight: 'var(--fw-semibold)',
              marginBottom: 6, paddingLeft: 4,
            }}>Email</label>
            <Field
              type="email"
              placeholder="you@connect.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block', fontSize: 'var(--fs-footnote)',
              color: 'var(--text-2)', fontWeight: 'var(--fw-semibold)',
              marginBottom: 6, paddingLeft: 4,
            }}>Пароль</label>
            <div style={{ position: 'relative' }}>
              <Field
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', padding: 4,
                  cursor: 'pointer', color: 'var(--text-3)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="var(--text-3)" />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--red)', fontSize: 'var(--fs-footnote)',
              background: 'var(--red-dim)', padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
            }}>
              <Icon name="alert-circle" size={16} color="var(--red)" />
              {error}
            </div>
          )}

          {/* Submit */}
          <Button variant="primary" block disabled={loading} style={{ marginTop: 4 }}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 18, height: 18, border: '2px solid rgba(0,0,0,0.15)',
                  borderTopColor: 'var(--on-yellow)', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite', display: 'inline-block',
                }} />
                Вход...
              </span>
            ) : 'Войти'}
          </Button>
        </form>

        {/* Footer link */}
        <button
          type="button"
          onClick={() => toast('Пожалуйста, обратитесь к руководителю для сброса пароля.', 'info')}
          style={{
            display: 'block', margin: '20px auto 0', background: 'none',
            border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-subhead)',
            fontWeight: 'var(--fw-medium)', cursor: 'pointer', padding: 10,
            fontFamily: 'var(--font-sans)', opacity: 0.85,
          }}
        >
          Не помню пароль
        </button>

        {/* Version */}
        <div style={{
          textAlign: 'center', marginTop: 32, fontSize: 'var(--fs-caption)',
          color: 'var(--text-3)', letterSpacing: '0.3px',
        }}>
          Connect Mobile · v2.0
        </div>
      </div>

      <style>{loginKeyframes}</style>
    </div>
  );
}

/* ─── Keyframes ─────────────────────────────────────────────── */
const loginKeyframes = `
  @keyframes orbFloat {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(15px, -20px) scale(1.08); }
    100% { transform: translate(-10px, 10px) scale(0.95); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const welcomeKeyframes = `
  @keyframes orbFloat {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(15px, -20px) scale(1.08); }
    100% { transform: translate(-10px, 10px) scale(0.95); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
`;
