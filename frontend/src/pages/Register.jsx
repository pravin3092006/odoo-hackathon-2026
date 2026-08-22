import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Hash, ArrowRight, ArrowLeft } from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { supabase } from '../lib/supabaseClient';

export default function Register() {
  const { state, actions } = useHRMS();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', empId: '', email: '', password: '', confirmPw: '', role: 'employee' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.empId.trim()) e.empId = 'Employee ID is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    else if (state.users.find(u => u.email === form.email)) e.email = 'Email already registered.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPw) e.confirmPw = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          emp_id: form.empId,
          role: form.role,
          name: form.name,
          avatar_initials: initials,
          avatar_color: '#7C3AED',
          first_name: form.name.split(' ')[0],
          last_name: form.name.split(' ').slice(1).join(' ') || '',
        },
      },
    });

    setLoading(false);
    if (error) {
      setErrors({ email: error.message });
      return;
    }

    // The DB trigger creates the profile/payroll/leave-balance rows automatically.
    if (data.session) {
      // Email confirmations are off — the user is signed in immediately.
      actions.showToast({ type: 'success', title: 'Account created!', message: `Welcome to Nexora HR, ${form.name}.` });
      navigate('/dashboard');
    } else {
      // Email confirmations are on — Supabase sent a confirmation link.
      actions.showToast({ type: 'info', title: 'Check your email', message: 'Confirm your email address, then sign in.' });
      navigate('/login');
    }
  };

  const f = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
              <defs>
                <linearGradient id="regMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
                </linearGradient>
              </defs>
              <rect x="4" y="5" width="6" height="26" rx="3" fill="url(#regMarkGrad)" />
              <polygon points="10,5 16,5 27,31 21,31" fill="url(#regMarkGrad)" />
              <rect x="21" y="5" width="6" height="26" rx="3" fill="url(#regMarkGrad)" />
              <circle cx="33" cy="9" r="3.5" fill="rgba(255,255,255,0.55)" />
            </svg>
          </div>
          <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>Join Nexora HR</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.6 }}>Create your account and start managing your workday more effectively.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div style={{ marginBottom: '2rem' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1.25rem', fontWeight: 500 }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
            <h2 style={{ marginBottom: '0.375rem' }}>Create your account</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Fill in your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input className={`form-control ${errors.name ? 'form-control-error' : ''}`} placeholder="John Doe" value={form.name} onChange={f('name')} />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Employee ID <span className="required">*</span></label>
                <input className={`form-control ${errors.empId ? 'form-control-error' : ''}`} placeholder="EMP007" value={form.empId} onChange={f('empId')} />
                {errors.empId && <span className="form-error">{errors.empId}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input type="email" className={`form-control ${errors.email ? 'form-control-error' : ''}`} placeholder="you@company.com" value={form.email} onChange={f('email')} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={f('role')}>
                <option value="employee">Employee</option>
                <option value="admin">HR / Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} className={`form-control ${errors.password ? 'form-control-error' : ''}`} placeholder="Min. 6 characters" value={form.password} onChange={f('password')} style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password <span className="required">*</span></label>
              <input type="password" className={`form-control ${errors.confirmPw ? 'form-control-error' : ''}`} placeholder="Re-enter password" value={form.confirmPw} onChange={f('confirmPw')} />
              {errors.confirmPw && <span className="form-error">{errors.confirmPw}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <span className="spinner" /> : (<>Create Account <ArrowRight size={16} /></>)}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
