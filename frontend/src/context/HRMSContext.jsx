import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  rowToUser, rowToProfile, profileToRow, rowToPayroll, payrollToRow,
  rowToAttendance, rowToLeaveRequest, rowToLeaveBalance, rowToNotification,
  rowToPaySlip, rowToActivity,
} from '../lib/mappers';
import { msToHours } from '../data/mockData';

// ─── INITIAL STATE ───────────────────────────────────────────
const initialState = {
  authLoading: true,
  currentUser: null,
  viewingRole: null, // 'admin' | 'employee'

  users: [],
  profiles: {},
  payroll: {},
  attendance: {},
  leaveRequests: [],
  leaveBalance: {},
  notifications: [],
  paySlipHistory: {},
  activityFeed: [],

  toasts: [],
  clockedIn: {},
};

function groupBy(rows, key, mapper) {
  const out = {};
  rows.forEach(r => {
    const k = r[key];
    if (!out[k]) out[k] = [];
    out[k].push(mapper(r));
  });
  return out;
}

function deriveClockedIn(attendanceByUser) {
  const todayStr = new Date().toISOString().split('T')[0];
  const clocked = {};
  Object.entries(attendanceByUser).forEach(([userId, records]) => {
    const today = records.find(r => r.date === todayStr);
    if (today && today.checkInTs && !today.checkOutTs) {
      clocked[userId] = { status: 'in', checkInTime: today.checkIn, checkInTs: today.checkInTs };
    }
  });
  return clocked;
}

// ─── CONTEXT ──────────────────────────────────────────────────
const HRMSContext = createContext(null);

export function HRMSProvider({ children }) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const patch = useCallback((p) => setState(s => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })), []);

  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setState(s => ({ ...s, toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => setState(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) })), 4500);
  }, []);

  // ─── LOAD ALL DATA (respecting RLS: admins get everything, employees get their own) ───
  const loadAllData = useCallback(async (authUser) => {
    const [
      { data: profileRows, error: profErr },
      { data: payrollRows },
      { data: attendanceRows },
      { data: leaveReqRows },
      { data: leaveBalRows },
      { data: notifRows },
      { data: paySlipRows },
      { data: activityRows },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('payroll').select('*'),
      supabase.from('attendance').select('*').order('date', { ascending: false }),
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('leave_balance').select('*'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('pay_slip_history').select('*'),
      supabase.from('activity_feed').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (profErr || !profileRows) {
      console.error('Failed to load profile data', profErr);
      return;
    }

    const me = profileRows.find(p => p.id === authUser.id);
    const users = profileRows.map(rowToUser);
    const profiles = {};
    profileRows.forEach(r => { profiles[r.id] = rowToProfile(r); });
    const payroll = {};
    (payrollRows || []).forEach(r => { payroll[r.user_id] = rowToPayroll(r); });
    const attendance = groupBy(attendanceRows || [], 'user_id', rowToAttendance);
    const leaveRequests = (leaveReqRows || []).map(rowToLeaveRequest);
    const leaveBalance = {};
    (leaveBalRows || []).forEach(r => { leaveBalance[r.user_id] = rowToLeaveBalance(r); });
    const notifications = (notifRows || []).map(rowToNotification);
    const paySlipHistory = groupBy(paySlipRows || [], 'user_id', rowToPaySlip);
    const activityFeed = (activityRows || []).map(rowToActivity);
    const clockedIn = deriveClockedIn(attendance);

    patch({
      authLoading: false,
      currentUser: me ? rowToUser(me) : null,
      viewingRole: me ? me.role : null,
      users, profiles, payroll, attendance, leaveRequests, leaveBalance,
      notifications, paySlipHistory, activityFeed, clockedIn,
    });
  }, [patch]);

  const refreshSlice = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await loadAllData(user);
  }, [loadAllData]);

  // ─── AUTH BOOTSTRAP ───────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) loadAllData(session.user);
      else patch({ authLoading: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user) {
        loadAllData(session.user);
      } else {
        setState({ ...initialState, authLoading: false });
      }
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── ACTIONS ──────────────────────────────────────────────
  const actions = {
    // Auth is actually driven by supabase.auth (see Login.jsx / Register.jsx);
    // these two remain for local UI bookkeeping / compatibility.
    login: (user) => patch({ currentUser: user, viewingRole: user.role }),
    logout: async () => { await supabase.auth.signOut(); },
    switchRole: (role) => patch({ viewingRole: role }),

    updateProfile: async (userId, data) => {
      const { error } = await supabase.from('profiles').update(profileToRow(data)).eq('id', userId);
      if (error) { showToast({ type: 'error', title: 'Update failed', message: error.message }); return; }
      await supabase.from('activity_feed').insert({ type: 'profile_update', user_id: userId, message: 'Profile information updated.' });
      await refreshSlice();
      showToast({ type: 'success', title: 'Profile Updated', message: 'Profile changes saved successfully.' });
    },

    updatePayroll: async (userId, data) => {
      const { error } = await supabase.from('payroll').update(payrollToRow(data)).eq('user_id', userId);
      if (error) { showToast({ type: 'error', title: 'Update failed', message: error.message }); return; }
      await supabase.from('activity_feed').insert({ type: 'payroll_update', user_id: userId, message: 'Salary structure updated by HR.' });
      await refreshSlice();
      showToast({ type: 'success', title: 'Payroll Updated', message: 'Salary structure updated successfully.' });
    },

    clockIn: async (userId) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];
      const { error } = await supabase.from('attendance').upsert({
        id: `att-${userId}-${dateStr}`, user_id: userId, date: dateStr, status: 'Present',
        check_in: timeStr, check_out: null, hours: 0, check_in_ts: now.getTime(), check_out_ts: null,
      }, { onConflict: 'user_id,date' });
      if (error) { showToast({ type: 'error', title: 'Clock In failed', message: error.message }); return; }
      await supabase.from('activity_feed').insert({ type: 'clock_in', user_id: userId, message: `Clocked in at ${timeStr}.` });
      await refreshSlice();
      showToast({ type: 'success', title: 'Clocked In', message: `Work session started at ${timeStr}.` });
    },

    clockOut: async (userId) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];
      const clockState = stateRef.current.clockedIn[userId];
      const durationMs = clockState ? now.getTime() - clockState.checkInTs : 0;
      const hoursWorked = msToHours(durationMs);
      const { error } = await supabase.from('attendance')
        .update({ check_out: timeStr, hours: hoursWorked, check_out_ts: now.getTime(), status: 'Present' })
        .eq('user_id', userId).eq('date', dateStr);
      if (error) { showToast({ type: 'error', title: 'Clock Out failed', message: error.message }); return; }
      await supabase.from('activity_feed').insert({ type: 'clock_out', user_id: userId, message: `Clocked out at ${timeStr}. Duration: ${hoursWorked}h.` });
      await refreshSlice();
      showToast({ type: 'info', title: 'Clocked Out', message: `Work session ended at ${timeStr}.` });
    },

    applyLeave: async (userId, data) => {
      const id = `LR${String(Date.now()).slice(-6)}`;
      const { error } = await supabase.from('leave_requests').insert({
        id, user_id: userId, leave_type: data.leaveType, start_date: data.startDate,
        end_date: data.endDate, days: data.days, remarks: data.remarks, status: 'Pending',
      });
      if (error) { showToast({ type: 'error', title: 'Leave request failed', message: error.message }); return; }

      const applicant = stateRef.current.users.find(u => u.id === userId);
      const admins = stateRef.current.users.filter(u => u.role === 'admin');
      if (admins.length) {
        await supabase.from('notifications').insert(admins.map(a => ({
          user_id: a.id, title: 'New Leave Request',
          message: `${applicant?.name || 'An employee'} submitted a ${data.leaveType} Leave request.`,
          type: 'info',
        })));
      }
      await supabase.from('activity_feed').insert({ type: 'leave_apply', user_id: userId, message: `Applied for ${data.leaveType} Leave (${data.startDate} – ${data.endDate}).` });
      await refreshSlice();
      showToast({ type: 'success', title: 'Leave Applied', message: `Your ${data.leaveType} leave request has been submitted.` });
    },

    approveLeave: async (requestId, adminId, comments) => {
      const req = stateRef.current.leaveRequests.find(r => r.id === requestId);
      const { error } = await supabase.from('leave_requests')
        .update({ status: 'Approved', reviewed_by: adminId, review_comments: comments || 'Approved.' })
        .eq('id', requestId);
      if (error) { showToast({ type: 'error', title: 'Action failed', message: error.message }); return; }
      if (req) {
        await supabase.from('notifications').insert({
          user_id: req.userId, title: 'Leave Approved',
          message: `Your ${req.leaveType} Leave (${req.startDate} to ${req.endDate}) has been approved.`, type: 'success',
        });
        const employee = stateRef.current.users.find(u => u.id === req.userId);
        await supabase.from('activity_feed').insert({ type: 'leave_approved', user_id: adminId, message: `Approved ${req.leaveType} Leave for ${employee?.name || 'employee'}.` });
      }
      await refreshSlice();
      showToast({ type: 'success', title: 'Leave Approved', message: 'The leave request has been approved.' });
    },

    rejectLeave: async (requestId, adminId, comments) => {
      const req = stateRef.current.leaveRequests.find(r => r.id === requestId);
      const { error } = await supabase.from('leave_requests')
        .update({ status: 'Rejected', reviewed_by: adminId, review_comments: comments })
        .eq('id', requestId);
      if (error) { showToast({ type: 'error', title: 'Action failed', message: error.message }); return; }
      if (req) {
        await supabase.from('notifications').insert({
          user_id: req.userId, title: 'Leave Rejected',
          message: `Your ${req.leaveType} Leave (${req.startDate} to ${req.endDate}) has been rejected. Reason: ${comments}`, type: 'error',
        });
        const employee = stateRef.current.users.find(u => u.id === req.userId);
        await supabase.from('activity_feed').insert({ type: 'leave_rejected', user_id: adminId, message: `Rejected ${req.leaveType} Leave for ${employee?.name || 'employee'}.` });
      }
      await refreshSlice();
      showToast({ type: 'warning', title: 'Leave Rejected', message: 'The leave request has been rejected.' });
    },

    markNotificationRead: async (id) => {
      patch(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    },

    markAllRead: async () => {
      const userId = stateRef.current.currentUser?.id;
      patch(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) }));
      if (userId) await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    },

    addUser: async (user, profile, payroll) => {
      const { data, error } = await supabase.functions.invoke('admin-create-employee', {
        body: {
          name: user.name, empId: user.empId, email: user.email, role: user.role,
          department: profile.department, jobTitle: profile.jobTitle,
          joiningDate: profile.joiningDate, baseSalary: payroll.baseSalary,
        },
      });
      if (error || data?.error) {
        showToast({ type: 'error', title: 'Could not add employee', message: data?.error || error.message || 'The admin-create-employee Edge Function may not be deployed yet.' });
        return;
      }
      await refreshSlice();
      showToast({ type: 'success', title: 'Employee Added', message: `${user.name} has been added successfully.` });
    },

    deleteUser: async (userId, name) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-employee', { body: { userId } });
      if (error || data?.error) {
        showToast({ type: 'error', title: 'Could not remove employee', message: data?.error || error.message || 'The admin-delete-employee Edge Function may not be deployed yet.' });
        return;
      }
      await refreshSlice();
      showToast({ type: 'info', title: 'Employee Removed', message: `${name} has been removed from the system.` });
    },

    removeToast: (id) => patch(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
    showToast,
    refresh: refreshSlice,
  };

  return (
    <HRMSContext.Provider value={{ state, actions }}>
      {children}
    </HRMSContext.Provider>
  );
}

export function useHRMS() {
  const ctx = useContext(HRMSContext);
  if (!ctx) throw new Error('useHRMS must be used within HRMSProvider');
  return ctx;
}
