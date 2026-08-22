import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useHRMS } from '../../context/HRMSContext';

export default function AppLayout() {
  const { state } = useHRMS();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (state.authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!state.currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header onMenuToggle={() => setMobileOpen(v => !v)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
