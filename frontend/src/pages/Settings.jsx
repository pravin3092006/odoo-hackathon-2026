import { useState } from 'react';
import { Bell, Shield, User, Globe, Moon, Save, Check } from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { supabase } from '../lib/supabaseClient';

export default function Settings() {
  const { state, actions } = useHRMS();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ leaveUpdates: true, payrollAlerts: true, announcements: false, weeklyReport: true });
  const [appearance, setAppearance] = useState({ language: 'en', timezone: 'Asia/Kolkata' });
  const [security, setSecurity] = useState({ currentPw: '', newPw: '', confirmPw: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handleSaveNotifications = async () => {
    setSaved(false);
    await new Promise(r => setTimeout(r, 400));
    actions.showToast({ type: 'success', title: 'Settings Saved', message: 'Notification preferences updated.' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (!security.currentPw) { setPwError('Enter your current password.'); return; }
    if (security.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (security.newPw !== security.confirmPw) { setPwError('Passwords do not match.'); return; }

    // Re-authenticate with the current password before allowing the change.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: state.currentUser?.email, password: security.currentPw,
    });
    if (reauthError) { setPwError('Current password is incorrect.'); return; }

    const { error } = await supabase.auth.updateUser({ password: security.newPw });
    if (error) { setPwError(error.message); return; }

    actions.showToast({ type: 'success', title: 'Password Changed', message: 'Your password has been updated.' });
    setPwSuccess('Password changed successfully.');
    setSecurity({ currentPw: '', newPw: '', confirmPw: '' });
  };

  const SectionHeader = ({ icon: Icon, title, desc }) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
        <Icon size={18} style={{ color: 'var(--color-primary)' }} />
        <h3 style={{ fontSize: '1rem', margin: 0 }}>{title}</h3>
      </div>
      {desc && <p style={{ fontSize: '0.875rem', margin: 0, marginLeft: '1.625rem', color: 'var(--color-text-secondary)' }}>{desc}</p>}
    </div>
  );

  const Toggle = ({ checked, onChange, label, desc }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '0.125rem' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, background: checked ? 'var(--color-primary)' : 'var(--color-border)',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background var(--transition-fast)',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', width: 18, height: 18, background: 'white', borderRadius: '50%',
          top: 3, left: checked ? 23 : 3, transition: 'left var(--transition-fast)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences and security settings</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Notifications */}
        <div className="card">
          <div className="card-header"><span className="card-title">Notifications</span></div>
          <div className="card-body">
            <SectionHeader icon={Bell} title="Notification Preferences" desc="Choose what alerts you receive." />
            <Toggle checked={notifications.leaveUpdates} onChange={v => setNotifications(n => ({ ...n, leaveUpdates: v }))} label="Leave Status Updates" desc="Get notified when your leave is approved or rejected" />
            <Toggle checked={notifications.payrollAlerts} onChange={v => setNotifications(n => ({ ...n, payrollAlerts: v }))} label="Payroll Alerts" desc="Receive alerts when salary is processed" />
            <Toggle checked={notifications.announcements} onChange={v => setNotifications(n => ({ ...n, announcements: v }))} label="Company Announcements" desc="General company news and policy updates" />
            <Toggle checked={notifications.weeklyReport} onChange={v => setNotifications(n => ({ ...n, weeklyReport: v }))} label="Weekly Attendance Report" desc="Weekly summary of your attendance" />
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={handleSaveNotifications}>
              {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Preferences</>}
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="card-header"><span className="card-title">Security</span></div>
          <div className="card-body">
            <SectionHeader icon={Shield} title="Change Password" desc="Use a strong password to keep your account safe." />
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pwError && <div style={{ padding: '0.75rem', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: 'var(--color-danger)' }}>{pwError}</div>}
              {pwSuccess && <div style={{ padding: '0.75rem', background: 'var(--color-success-bg)', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: 'var(--color-success)' }}>{pwSuccess}</div>}
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" placeholder="Enter current password" value={security.currentPw} onChange={e => setSecurity(s => ({ ...s, currentPw: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" placeholder="Min. 6 characters" value={security.newPw} onChange={e => setSecurity(s => ({ ...s, newPw: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-control" placeholder="Re-enter new password" value={security.confirmPw} onChange={e => setSecurity(s => ({ ...s, confirmPw: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary"><Shield size={14} /> Update Password</button>
            </form>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="card-header"><span className="card-title">Preferences</span></div>
          <div className="card-body">
            <SectionHeader icon={Globe} title="Regional Settings" desc="Set your language and timezone preferences." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-control" value={appearance.language} onChange={e => setAppearance(a => ({ ...a, language: e.target.value }))}>
                  <option value="en">English (US)</option>
                  <option value="en-gb">English (UK)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select className="form-control" value={appearance.timezone} onChange={e => setAppearance(a => ({ ...a, timezone: e.target.value }))}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                  <option value="America/New_York">America/New_York (EST, UTC-5)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST, UTC-8)</option>
                  <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
                  <option value="Asia/Seoul">Asia/Seoul (KST, UTC+9)</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={() => actions.showToast({ type: 'success', title: 'Preferences Saved', message: 'Regional settings updated.' })}>
                <Save size={14} /> Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">Account Information</span></div>
          <div className="card-body">
            <SectionHeader icon={User} title="Account Details" desc="Your registered account information." />
            {[
              { label: 'Full Name', value: state.currentUser?.name },
              { label: 'Email', value: state.currentUser?.email },
              { label: 'Employee ID', value: state.currentUser?.empId },
              { label: 'Role', value: state.currentUser?.role === 'admin' ? 'HR Admin' : 'Employee' },
              { label: 'Account Status', value: 'Active' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: item.label === 'Account Status' ? 'var(--color-success)' : 'var(--color-text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
