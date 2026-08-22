import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import RoleRedirect from './pages/RoleRedirect'
import Unauthorized from './pages/Unauthorized'
import NotFound from './pages/NotFound'

import EmployeeDashboard from './pages/EmployeeDashboard'
import Profile from './pages/Profile'
import Attendance from './pages/Attendance'
import Leave from './pages/Leave'
import Payroll from './pages/Payroll'

import AdminDashboard from './pages/AdminDashboard'
import AdminEmployees from './pages/AdminEmployees'
import AdminAttendance from './pages/AdminAttendance'
import AdminLeaveApprovals from './pages/AdminLeaveApprovals'
import AdminPayroll from './pages/AdminPayroll'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/redirect" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/redirect" element={<RoleRedirect />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Employee routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <Leave />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <Payroll />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminEmployees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leave"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLeaveApprovals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payroll"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPayroll />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
