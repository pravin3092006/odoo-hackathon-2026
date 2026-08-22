import { useState, useEffect } from 'react';
import { Clock, Download, Search, Calendar } from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { msToHMS, msToHours } from '../data/mockData';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';

/**
 * Live working-hours timer.
 * Derives elapsed time from checkInTs (ms epoch) for accuracy.
 * Even after a browser refresh, if checkInTs is in state it will still work.
 */
function WorkTimer({ checkInTs }) {
  const [elapsed, setElapsed] = useState(Date.now() - checkInTs);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - checkInTs), 1000);
    return () => clearInterval(t);
  }, [checkInTs]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{msToHMS(elapsed)}</span>;
}

/** Format hours number → human readable string */
function fmtHours(h) {
  if (!h || h <= 0) return '–';
  return `${h}h`;
}

export default function Attendance() {
  const { state, actions } = useHRMS();
  const isAdmin = state.viewingRole === 'admin';
  const userId = state.currentUser?.id;
  const clockState = state.clockedIn[userId];
  const isClockedIn = !!clockState;

  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(userId);

  const STATUSES = ['All', 'Present', 'Absent', 'Half-day', 'Leave'];

  // For admin: show selected employee's data; for employee: show own data
  const targetUserId = isAdmin ? (selectedEmployee || userId) : userId;
  const records = (state.attendance[targetUserId] || []);

  const filteredRecords = records.filter(r => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (dateRange.from && r.date < dateRange.from) return false;
    if (dateRange.to && r.date > dateRange.to) return false;
    return true;
  });

  const employees = state.users.filter(u => u.role === 'employee');
  const targetUser = state.users.find(u => u.id === targetUserId);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(r => r.date === todayStr);

  // Summary stats over last 20 working-day records
  const recent = records.slice(0, 20);
  const stats = {
    present: recent.filter(r => r.status === 'Present').length,
    absent: recent.filter(r => r.status === 'Absent').length,
    halfDay: recent.filter(r => r.status === 'Half-day').length,
    leave: recent.filter(r => r.status === 'Leave').length,
  };
  const workedRecords = recent.filter(r => r.hours > 0);
  const avgHours = workedRecords.length > 0
    ? (workedRecords.reduce((s, r) => s + r.hours, 0) / workedRecords.length).toFixed(1)
    : '0.0';

  // Live hours while clocked in (for the today card)
  const liveMs = clockState ? Date.now() - clockState.checkInTs : 0;

  const handleExportCSV = () => {
    const headers = 'Date,Status,Check In,Check Out,Hours\n';
    const rows = filteredRecords.map(r => `${r.date},${r.status},${r.checkIn || '-'},${r.checkOut || '-'},${r.hours}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nexora-attendance-${targetUser?.empId || 'export'}.csv`; a.click();
    URL.revokeObjectURL(url);
    actions.showToast({ type: 'success', title: 'Exported', message: 'Attendance data exported as CSV.' });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">{isAdmin ? 'Monitor and manage employee attendance records' : 'Track your daily attendance and working hours'}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Admin — Employee Selector */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Viewing:</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {employees.map(emp => (
                <button
                  key={emp.id}
                  className={`btn btn-sm ${selectedEmployee === emp.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedEmployee(emp.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <Avatar name={emp.name} color={emp.avatarColor} />
                  {emp.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Employee — Clock In/Out Widget + Today + Stats */}
      {!isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Clock Widget */}
          <div className="clock-widget" style={{ padding: '1.5rem' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              {isClockedIn ? (
                <>
                  <div className="clock-status-pill" style={{ margin: '0 auto 1rem', width: 'fit-content' }}>
                    <span className="clock-status-dot" />
                    Working · <WorkTimer checkInTs={clockState.checkInTs} />
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.75, marginBottom: '1rem' }}>
                    Checked in at {clockState.checkInTime}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.875rem', opacity: 0.75, marginBottom: '1rem' }}>
                  {todayRecord?.checkOut
                    ? `Worked ${fmtHours(todayRecord.hours)} today`
                    : 'Not checked in today'}
                </div>
              )}
              <button
                className="btn btn-lg w-full"
                style={{
                  background: isClockedIn ? 'rgba(255,255,255,0.15)' : 'white',
                  color: isClockedIn ? 'white' : 'var(--color-primary)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  fontWeight: 700,
                }}
                onClick={() => isClockedIn ? actions.clockOut(userId) : actions.clockIn(userId)}
              >
                {isClockedIn ? '⏹ Clock Out' : '▶ Clock In'}
              </button>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Today's Record</div>
            {todayRecord ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Status', value: <Badge status={todayRecord.status} /> },
                  { label: 'Check In', value: todayRecord.checkIn || '–' },
                  {
                    label: 'Check Out',
                    value: isClockedIn
                      ? <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Working...</span>
                      : (todayRecord.checkOut || '–')
                  },
                  {
                    label: 'Hours',
                    value: isClockedIn
                      ? <WorkTimer checkInTs={clockState.checkInTs} />
                      : (todayRecord.hours > 0 ? `${todayRecord.hours}h` : '–')
                  },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', paddingTop: '1rem' }}>
                <Calendar size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                No record for today yet
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Last 20 Working Days</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { label: 'Present', value: stats.present, color: 'var(--color-success)' },
                { label: 'Absent', value: stats.absent, color: 'var(--color-danger)' },
                { label: 'Half-day', value: stats.halfDay, color: 'var(--color-warning)' },
                { label: 'On Leave', value: stats.leave, color: 'var(--color-info)' },
                { label: 'Avg Hours/Day', value: `${avgHours}h`, color: 'var(--color-primary)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{s.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Quick Stats */}
      {isAdmin && (
        <div className="grid-4" style={{ marginBottom: '1rem' }}>
          {[
            { label: 'Present (20d)', value: stats.present, color: '#059669', bg: '#D1FAE5' },
            { label: 'Absent (20d)', value: stats.absent, color: '#DC2626', bg: '#FEE2E2' },
            { label: 'Half-days (20d)', value: stats.halfDay, color: '#D97706', bg: '#FEF3C7' },
            { label: 'Avg Hours/Day', value: `${avgHours}h`, color: '#7C3AED', bg: '#EDE9FE' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-icon" style={{ background: s.bg }}>
                <Clock size={20} style={{ color: s.color }} />
              </div>
              <div className="stat-card-body">
                <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Log Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Attendance Log {targetUser && isAdmin ? `– ${targetUser.name}` : ''}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
              value={dateRange.from}
              onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
              aria-label="Start date filter"
            />
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
              value={dateRange.to}
              onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
              aria-label="End date filter"
            />
          </div>
        </div>
        <div className="table-wrapper">
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={<Clock size={28} />}
              title="No records found"
              description="No attendance records match the selected filters."
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 30).map(record => {
                  const d = new Date(record.date + 'T00:00:00');
                  const isToday = record.date === todayStr;
                  // For the today row while clocked in, compute live hours
                  const displayHours = isToday && isClockedIn
                    ? null // render timer component
                    : (record.hours > 0 ? `${record.hours}h` : '–');
                  return (
                    <tr key={record.id} style={{ background: isToday ? 'rgba(124, 58, 237, 0.03)' : undefined }}>
                      <td style={{ fontWeight: 500 }}>
                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {isToday && <span className="badge badge-pending" style={{ marginLeft: 6, fontSize: '0.65rem' }}>Today</span>}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </td>
                      <td><Badge status={record.status} /></td>
                      <td style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        {record.checkIn || '–'}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        {isToday && isClockedIn
                          ? <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Working...</span>
                          : (record.checkOut || '–')}
                      </td>
                      <td style={{ fontWeight: 600, color: (record.hours > 0 || (isToday && isClockedIn)) ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        {isToday && isClockedIn
                          ? <WorkTimer checkInTs={clockState.checkInTs} />
                          : displayHours}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
