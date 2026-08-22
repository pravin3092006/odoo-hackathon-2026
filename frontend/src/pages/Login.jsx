import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Shield, UserCheck } from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { supabase } from '../lib/supabaseClient';

// ─── NEXORA LOGO MARK ─────────────────────────────────────
function NexoraLogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="loginMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
        </linearGradient>
      </defs>
      <rect x="4" y="5" width="6" height="26" rx="3" fill="url(#loginMarkGrad)" />
      <polygon points="10,5 16,5 27,31 21,31" fill="url(#loginMarkGrad)" />
      <rect x="21" y="5" width="6" height="26" rx="3" fill="url(#loginMarkGrad)" />
      <circle cx="33" cy="9" r="3.5" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

const DEMO_ACCOUNTS = [
  { label: 'HR Admin', email: 'admin@nexora.hr', password: 'admin123', icon: Shield, color: '#7C3AED', desc: 'Full administrative access' },
  { label: 'Employee', email: 'alex@nexora.hr', password: 'emp123', icon: UserCheck, color: '#0D9488', desc: 'Employee self-service portal' },
];

export default function Login() {
  const { state, actions } = useHRMS();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (state.currentUser) { navigate('/dashboard', { replace: true }); return null; }

  const doSignIn = async (email, password) => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message === 'Invalid login credentials' ? 'Invalid email or password. Please try again.' : authError.message);
      setLoading(false);
      return;
    }
    actions.showToast({ type: 'success', title: 'Welcome back!', message: `Logged in as ${data.user?.email}` });
    navigate('/dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await doSignIn(form.email, form.password);
    setLoading(false);
  };

  const handleQuickLogin = async (account) => {
    setError('');
    setLoading(true);
    await doSignIn(account.email, account.password);
    setLoading(false);
  };

  return (
    <div className="auth-layout">
      {/* Brand Panel */}
      <div className="auth-brand">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <NexoraLogoMark size={40} />
          </div>
          <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>
            Nexora HR
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', marginBottom: '3rem', lineHeight: 1.5 }}>
            Smart Human Resource Management System
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '⏱', text: 'Real-time attendance tracking' },
              { icon: '📋', text: 'Streamlined leave management' },
              { icon: '💰', text: 'Transparent payroll & pay slips' },
              { icon: '📊', text: 'HR analytics & reporting' },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{f.icon}</div>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9375rem' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>Sign in to Nexora HR</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Enter your credentials to access your account.</p>
          </div>

          {/* Quick Login Buttons */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>Quick Demo Access</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              {DEMO_ACCOUNTS.map(acc => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.label}
                    className="btn btn-outline"
                    onClick={() => handleQuickLogin(acc)}
                    disabled={loading}
                    style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem', height: 'auto', gap: '0.25rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={14} style={{ color: acc.color }} aria-hidden="true" />
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{acc.label}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 400, textAlign: 'left' }}>{acc.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>or sign in manually</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {error && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--color-danger-bg)', border: '1px solid #FECACA', borderRadius: 'var(--radius)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address <span className="required" aria-hidden="true">*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} aria-hidden="true" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  id="login-email"
                  type="email"
                  className="form-control"
                  placeholder="you@nexora.hr"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ paddingLeft: '2.25rem' }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password <span className="required" aria-hidden="true">*</span></label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} aria-hidden="true" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <span className="spinner" aria-label="Loading" /> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            New to Nexora HR?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            © 2026 Nexora HR. Smart Human Resource Management System.
          </p>
        </div>
      </div>
    </div>
  );
}
