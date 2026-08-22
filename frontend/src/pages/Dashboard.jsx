import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHRMS } from '../context/HRMSContext';
import {
  Users, Clock, CalendarDays, TrendingUp, CheckCircle, XCircle, AlertCircle,
  ArrowRight, Activity, Timer, UserCheck, BarChart2
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return {
    timeStr: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    dateStr: time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

function WorkTimer({ checkInTs }) {
  const [elapsed, setElapsed] = useState(Date.now() - checkInTs);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - checkInTs), 1000);
    return () => clearInterval(t);
  }, [checkInTs]);
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>;
}

export default function Dashboard() {
  const { state, actions } = useHRMS();
  const navigate = useNavigate();
  const { timeStr, dateStr } = LiveClock();
  const isAdmin = state.viewingRole === 'admin';
  const user = state.currentUser;
  const userId = user?.id;

  const clockState = state.clockedIn[userId];
  const isClockedIn = !!clockState;

  // Attendance stats for employee
  const myAttendance = state.attendance[userId] || [];
  const last30 = myAttendance.slice(0, 20);
  const presentCount = last30.filter(r => r.status === 'Present').length;
  const absentCount  = last30.filter(r => r.status === 'Absent').length;
  const leaveCount   = last30.filter(r => r.status === 'Leave').length;
  const halfdayCount = last30.filter(r => r.status === 'Half-day').length;

  const myLeaveBalance = state.leaveBalance[userId] || { paid: { total: 20, used: 0 }, sick: { total: 10, used: 0 }, unpaid: { total: 5, used: 0 } };
  const myLeaves = state.leaveRequests.filter(r => r.userId === userId);
  const pendingLeaves = state.leaveRequests.filter(r => r.status === 'Pending');

  // Admin stats
  const totalEmployees = state.users.filter(u => u.role === 'employee').length;
  const onDutyToday = Object.entries(state.clockedIn).length;
  const pendingApprovals = pendingLeaves.length;
  const todayDate = new Date().toISOString().split('T')[0];
  const presentToday = Object.values(state.attendance).flat().filter(r => r.date === todayDate && r.status === 'Present').length;

  // Chart data
  const chartData = ['Mon','Tue','Wed','Thu','Fri','Mon','Tue','Wed','Thu','Fri'].map((day, i) => ({
    name: day,
    present: Math.floor(Math.random() * (totalEmployees - 2) + 2),
    absent: Math.floor(Math.random() * 3),
    leave: Math.floor(Math.random() * 2),
  }));

  const leaveChartData = [
    { name: 'Paid', available: myLeaveBalance.paid.total - myLeaveBalance.paid.used, used: myLeaveBalance.paid.used },
    { name: 'Sick', available: myLeaveBalance.sick.total - myLeaveBalance.sick.used, used: myLeaveBalance.sick.used },
    { name: 'Unpaid', available: myLeaveBalance.unpaid.total - myLeaveBalance.unpaid.used, used: myLeaveBalance.unpaid.used },
  ];

  // Recent activity
  const recentActivity = [...state.leaveRequests]
    .filter(r => isAdmin || r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getUserName = (uid) => state.users.find(u => u.id === uid)?.name || 'Unknown';
  const getUser = (uid) => state.users.find(u => u.id === uid);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            {isAdmin ? 'HR Dashboard' : `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0]} 👋`}
          </h1>
          <p className="page-subtitle">{dateStr}</p>
        </div>
      </div>

      {/* ─── EMPLOYEE VIEW ─────────────────────────────── */}
      {!isAdmin && (
        <>
          {/* Top Row: Clock Widget + Leave Balance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Clock Widget */}
            <div className="clock-widget">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="clock-time">{timeStr}</div>
                <div className="clock-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>

                {isClockedIn && (
                  <div className="clock-status-pill" style={{ margin: '0 auto 1.25rem', width: 'fit-content' }}>
                    <span className="clock-status-dot" />
                    Working · <WorkTimer checkInTs={clockState.checkInTs} />
                  </div>
                )}

                {!isClockedIn && (
                  <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem', opacity: 0.75, textAlign: 'center' }}>
                    {myAttendance[0]?.date === todayDate ? `Checked out at ${myAttendance[0]?.checkOut}` : 'Not checked in today'}
                  </div>
                )}

                <button
                  className={`btn btn-lg w-full`}
                  style={{
                    background: isClockedIn ? 'rgba(255,255,255,0.15)' : 'white',
                    color: isClockedIn ? 'white' : 'var(--color-primary)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(4px)',
                    fontWeight: 700,
                  }}
                  onClick={() => isClockedIn ? actions.clockOut(userId) : actions.clockIn(userId)}
                >
                  {isClockedIn ? '⏹ Clock Out' : '▶ Clock In'}
                </button>

                {myAttendance[0]?.date === todayDate && !isClockedIn && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.75, textAlign: 'center' }}>
                    Today: {myAttendance[0]?.checkIn} – {myAttendance[0]?.checkOut} · {myAttendance[0]?.hours > 0 ? `${myAttendance[0]?.hours}h` : '–'}
                  </div>
                )}
              </div>
            </div>

            {/* Leave Balances */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Leave Balance</span>
                <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/leave')}>Apply Leave</button>
              </div>
              <div className="card-body">
                <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Paid Leave', key: 'paid', color: '#7C3AED', bg: '#EDE9FE' },
                    { label: 'Sick Leave', key: 'sick', color: '#0D9488', bg: '#CCFBF1' },
                    { label: 'Unpaid Leave', key: 'unpaid', color: '#D97706', bg: '#FEF3C7' },
                  ].map(({ label, key, color, bg }) => {
                    const bal = myLeaveBalance[key];
                    const avail = bal.total - bal.used;
                    const pct = Math.round((bal.used / bal.total) * 100);
                    return (
                      <div key={key} className="leave-balance-card">
                        <div className="leave-balance-count" style={{ color }}>{avail}</div>
                        <div className="leave-balance-label">{label}</div>
                        <div className="leave-balance-used">{bal.used} used of {bal.total}</div>
                        <div className="leave-balance-bar">
                          <div className="leave-balance-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Leave Requests */}
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.625rem' }}>Recent Requests</div>
                  {myLeaves.slice(0, 3).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No leave requests yet</div>
                  ) : (
                    myLeaves.slice(0, 3).map(req => (
                      <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                        <div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{req.leaveType} Leave</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>{req.startDate} · {req.days}d</span>
                        </div>
                        <Badge status={req.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid-4" style={{ marginBottom: '1rem' }}>
            {[
              { label: 'Present (20d)', value: presentCount, icon: CheckCircle, color: '#059669', bg: '#D1FAE5' },
              { label: 'Absent (20d)', value: absentCount, icon: XCircle, color: '#DC2626', bg: '#FEE2E2' },
              { label: 'On Leave (20d)', value: leaveCount, icon: CalendarDays, color: '#D97706', bg: '#FEF3C7' },
              { label: 'Half-days (20d)', value: halfdayCount, icon: Clock, color: '#2563EB', bg: '#DBEAFE' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="stat-card">
                  <div className="stat-card-icon" style={{ background: s.bg }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <div className="stat-card-body">
                    <div className="stat-card-value">{s.value}</div>
                    <div className="stat-card-label">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leave Chart + Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Leave Usage</span></div>
              <div className="card-body" style={{ paddingTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height={180}><BarChart data={leaveChartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }} />
                    <Bar dataKey="used" name="Used" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="available" name="Available" fill="#EDE9FE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent Activity</span>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate('/leave')}>View all <ArrowRight size={13} /></button>
              </div>
              <div className="card-body" style={{ padding: '0.75rem 1.5rem' }}>
                {recentActivity.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No recent activity</div>
                ) : (
                  recentActivity.map(req => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CalendarDays size={16} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{req.leaveType} Leave Request</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{req.startDate} · {req.days}d</div>
                      </div>
                      <Badge status={req.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── ADMIN VIEW ────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: '1rem' }}>
            {[
              { label: 'Total Employees', value: totalEmployees, icon: Users, color: '#7C3AED', bg: '#EDE9FE', sub: 'Active accounts' },
              { label: 'On Duty Today', value: onDutyToday, icon: UserCheck, color: '#059669', bg: '#D1FAE5', sub: 'Currently clocked in' },
              { label: 'Present Today', value: presentToday, icon: CheckCircle, color: '#2563EB', bg: '#DBEAFE', sub: 'Attendance logged' },
              { label: 'Pending Approvals', value: pendingApprovals, icon: AlertCircle, color: '#D97706', bg: '#FEF3C7', sub: 'Requires action' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="stat-card">
                  <div className="stat-card-icon" style={{ background: s.bg }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <div className="stat-card-body">
                    <div className="stat-card-value">{s.value}</div>
                    <div className="stat-card-label">{s.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{s.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Attendance Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Attendance Trend (Last 10 Days)</span>
                <button className="btn btn-sm btn-outline" onClick={() => navigate('/attendance')}>View All</button>
              </div>
              <div className="card-body" style={{ paddingTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="present" name="Present" stroke="#7C3AED" fill="url(#gradPresent)" strokeWidth={2} />
                    <Area type="monotone" dataKey="absent" name="Absent" stroke="#DC2626" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leave Type Breakdown */}
            <div className="card">
              <div className="card-header"><span className="card-title">Leave Requests</span></div>
              <div className="card-body">
                {[
                  { label: 'Pending', count: state.leaveRequests.filter(r => r.status === 'Pending').length, color: '#7C3AED', bg: '#EDE9FE' },
                  { label: 'Approved', count: state.leaveRequests.filter(r => r.status === 'Approved').length, color: '#059669', bg: '#D1FAE5' },
                  { label: 'Rejected', count: state.leaveRequests.filter(r => r.status === 'Rejected').length, color: '#DC2626', bg: '#FEE2E2' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius)', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: item.color }}>{item.count}</div>
                  </div>
                ))}
                <button className="btn btn-outline-primary btn-sm w-full" style={{ marginTop: '1rem' }} onClick={() => navigate('/leave')}>
                  Manage Approvals
                </button>
              </div>
            </div>
          </div>

          {/* Pending Leave Approvals Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pending Leave Approvals</span>
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/leave')}>View All Requests</button>
            </div>
            {pendingLeaves.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                ✅ No pending leave requests
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Days</th>
                      <th>Remarks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeaves.slice(0, 5).map(req => {
                      const emp = getUser(req.userId);
                      return (
                        <tr key={req.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                              <Avatar name={emp?.name} color={emp?.avatarColor} />
                              <div>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{emp?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{emp?.empId}</div>
                              </div>
                            </div>
                          </td>
                          <td><Badge status={req.leaveType === 'Paid' ? 'Approved' : req.leaveType === 'Sick' ? 'Warning' : 'neutral'}>{req.leaveType}</Badge></td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{req.startDate} → {req.endDate}</td>
                          <td style={{ fontWeight: 600 }}>{req.days}d</td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: 200 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 180 }}>{req.remarks}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button className="btn btn-sm btn-success" onClick={() => actions.approveLeave(req.id, userId, 'Approved.')}><CheckCircle size={13} /> Approve</button><button className="btn btn-sm btn-danger" onClick={() => navigate('/leave')}><XCircle size={13} /> Review</button></div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
