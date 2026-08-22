import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, RefreshCw, Shield, User, Settings, LogOut } from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';
import Avatar from '../ui/Avatar';

export default function Header({ onMenuToggle }) {
  const { state, actions } = useHRMS();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const isAdmin = state.viewingRole === 'admin';
  const canSwitchRole = state.currentUser?.role === 'admin';

  // Notifications for current user (admin sees their own notifications)
  const userNotifs = state.notifications.filter(n => n.userId === state.currentUser?.id);
  const unreadCount = userNotifs.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifIcons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  return (
    <header className="header">
      {/* Mobile menu toggle */}
      <button className="header-toggle-btn" onClick={onMenuToggle}>
        <Menu size={18} />
      </button>

      <div className="header-spacer" />

      <div className="header-actions">
        {/* Role Switcher */}
        {canSwitchRole && (
          <button
            className={`role-switcher-badge ${isAdmin ? 'admin' : 'employee'}`}
            onClick={() => actions.switchRole(isAdmin ? 'employee' : 'admin')}
            title="Switch between Admin and Employee view"
          >
            <RefreshCw size={12} />
            {isAdmin ? (
              <><Shield size={12} /> Viewing as Admin</>
            ) : (
              <><User size={12} /> Viewing as Employee</>
            )}
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button className="icon-btn" onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}>
            <Bell size={16} />
            {unreadCount > 0 && <span className="icon-btn-badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="dropdown-menu" style={{ right: 0, top: 'calc(100% + 8px)', width: 340 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => actions.markAllRead()}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {userNotifs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No notifications
                  </div>
                ) : (
                  userNotifs.slice(0, 8).map(n => (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem',
                        background: n.read ? 'transparent' : 'var(--color-primary-light)',
                        cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onClick={() => actions.markNotificationRead(n.id)}
                    >
                      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{notifIcons[n.type]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: n.read ? 500 : 600, color: 'var(--color-text-primary)', marginBottom: '0.125rem' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{n.time}</div>
                      </div>
                      {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button className="avatar-btn" onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}>
            <Avatar name={state.currentUser?.name} color={state.currentUser?.avatarColor} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {state.currentUser?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {profileOpen && (
            <div className="dropdown-menu" style={{ right: 0, top: 'calc(100% + 8px)', width: 220 }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{state.currentUser?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {state.currentUser?.role} · {state.currentUser?.empId}
                </div>
              </div>
              <button className="dropdown-item" onClick={() => { navigate('/profile'); setProfileOpen(false); }}>
                <User size={15} /> My Profile
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); setProfileOpen(false); }}>
                <Settings size={15} /> Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={() => { actions.logout(); navigate('/login'); }}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
