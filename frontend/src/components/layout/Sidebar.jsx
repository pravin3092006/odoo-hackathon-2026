import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign,
  Settings, LogOut, ChevronLeft, ChevronRight, UserCheck,
} from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';
import Avatar from '../ui/Avatar';

// ─── NEXORA LOGO MARK ─────────────────────────────────────
function NexoraLogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.75)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect x="4" y="5" width="6" height="26" rx="3" fill="url(#sideGrad)" />
      <polygon points="10,5 16,5 27,31 21,31" fill="url(#sideGrad)" />
      <rect x="21" y="5" width="6" height="26" rx="3" fill="url(#sideGrad)" />
      <circle cx="33" cy="9" r="3.5" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

const NAV_ITEMS_EMPLOYEE = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'My Profile', icon: UserCheck, path: '/profile' },
  { label: 'Attendance', icon: Clock, path: '/attendance' },
  { label: 'Leave & Time Off', icon: CalendarDays, path: '/leave' },
  { label: 'Payroll', icon: DollarSign, path: '/payroll' },
];

const NAV_ITEMS_ADMIN = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Employees', icon: Users, path: '/employees', badgeKey: 'employees' },
  { label: 'Attendance', icon: Clock, path: '/attendance' },
  { label: 'Leave Approvals', icon: CalendarDays, path: '/leave', badgeKey: 'leave' },
  { label: 'Payroll', icon: DollarSign, path: '/payroll' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { state, actions } = useHRMS();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = state.viewingRole === 'admin';
  const navItems = isAdmin ? NAV_ITEMS_ADMIN : NAV_ITEMS_EMPLOYEE;
  const pendingLeaveCount = state.leaveRequests.filter(r => r.status === 'Pending').length;

  const handleNav = (path) => {
    navigate(path);
    onMobileClose?.();
  };

  const getBadge = (key) => {
    if (key === 'leave') return pendingLeaveCount > 0 ? pendingLeaveCount : null;
    return null;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" title="Nexora HR" aria-label="Nexora HR">
            <NexoraLogoMark size={collapsed ? 24 : 22} />
          </div>
          {!collapsed && (
            <span className="sidebar-logo-text" aria-hidden="true">
              Nexora<span>HR</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {!collapsed && (
            <div className="nav-section-label">
              {isAdmin ? 'Administration' : 'My Workspace'}
            </div>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const badge = item.badgeKey ? getBadge(item.badgeKey) : null;
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <button
                key={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => handleNav(item.path)}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="nav-item-icon" aria-hidden="true" />
                {!collapsed && <span className="nav-item-text">{item.label}</span>}
                {!collapsed && badge && <span className="nav-item-badge" aria-label={`${badge} pending`}>{badge}</span>}
              </button>
            );
          })}

          {isAdmin && !collapsed && (
            <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>Settings</div>
          )}

          <button
            className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={() => handleNav('/settings')}
            title={collapsed ? 'Settings' : undefined}
            aria-label="Settings"
          >
            <Settings className="nav-item-icon" aria-hidden="true" />
            {!collapsed && <span className="nav-item-text">Settings</span>}
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && state.currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.5rem', marginBottom: '0.5rem' }}>
              <Avatar name={state.currentUser.name} color={state.currentUser.avatarColor} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {state.currentUser.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {state.currentUser.role === 'admin' ? 'HR Admin' : 'Employee'}
                </div>
              </div>
            </div>
          )}
          <button
            className="nav-item"
            onClick={() => { actions.logout(); navigate('/login'); }}
            title={collapsed ? 'Logout' : undefined}
            aria-label="Logout"
            style={{ color: 'var(--color-danger)' }}
          >
            <LogOut className="nav-item-icon" aria-hidden="true" />
            {!collapsed && <span className="nav-item-text">Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle – desktop only */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)',
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--color-text-secondary)', zIndex: 10, boxShadow: 'var(--shadow)',
          }}
          className="collapse-btn"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>
    </>
  );
}
