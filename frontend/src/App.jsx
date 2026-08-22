import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HRMSProvider } from './context/HRMSContext';
import AppLayout from './components/layout/AppLayout';
import ToastContainer from './components/ui/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Payroll from './pages/Payroll';
import Settings from './pages/Settings';

function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1, marginBottom: '1rem', opacity: 0.15 }}>404</div>
      <h2 style={{ marginBottom: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
    </div>
  );
}

export default function App() {
  return (
    <HRMSProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:userId" element={<Profile />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </HRMSProvider>
  );
}
