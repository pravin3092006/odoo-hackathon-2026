import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, User, Briefcase, DollarSign, FileText, Phone, MapPin, Calendar, Mail, Building2, Globe, Heart, ArrowLeft } from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { DEPARTMENTS, JOB_TITLES } from '../data/mockData';

export default function Profile() {
  const { state, actions } = useHRMS();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const isAdmin = state.viewingRole === 'admin';
  const currentUserId = state.currentUser?.id;
  // If no param, always show current user's own profile
  const targetUserId = paramUserId || currentUserId;
  const isOwnProfile = targetUserId === currentUserId;
  const canEdit = isAdmin || isOwnProfile;
  const canEditAll = isAdmin;

  const user = state.users.find(u => u.id === targetUserId);
  // Build a fallback profile from user data so we never show "Employee not found"
  // for a valid logged-in user whose profile record hasn't been stored yet
  const rawProfile = state.profiles[targetUserId];
  const profile = rawProfile || (user ? {
    userId: user.id,
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    phone: '',
    address: '',
    jobTitle: '',
    department: '',
    joiningDate: new Date().toISOString().split('T')[0],
    managerId: null,
    employmentType: 'Full-time',
    workLocation: 'Office',
    bio: '',
    emergencyContact: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
  } : null);
  const payroll = state.payroll[targetUserId];

  const [activeTab, setActiveTab] = useState('personal');
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  if (!user || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
        <User size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
        <h2>Employee not found</h2>
        <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}><ArrowLeft size={14} /> Go Back</button>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setEditForm({
      phone: profile.phone || '',
      address: profile.address || '',
      bio: profile.bio || '',
      emergencyContact: profile.emergencyContact || '',
      // Admin-only
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      jobTitle: profile.jobTitle || '',
      department: profile.department || '',
      employmentType: profile.employmentType || 'Full-time',
      workLocation: profile.workLocation || 'Office',
      joiningDate: profile.joiningDate || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || '',
      nationality: profile.nationality || '',
    });
    setEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    setEditLoading(true);
    await new Promise(r => setTimeout(r, 600));
    actions.updateProfile(targetUserId, editForm);
    setEditModal(false);
    setEditLoading(false);
  };

  const ef = (field) => (e) => setEditForm(f => ({ ...f, [field]: e.target.value }));

  const myLeaveBalance = state.leaveBalance[targetUserId] || { paid: { total: 20, used: 0 }, sick: { total: 10, used: 0 }, unpaid: { total: 5, used: 0 } };
  const myAttendance = state.attendance[targetUserId] || [];
  const presentCount = myAttendance.filter(r => r.status === 'Present').length;

  const TABS = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'job', label: 'Job Details', icon: Briefcase },
    { id: 'salary', label: 'Salary', icon: DollarSign },
    { id: 'stats', label: 'Stats & Leave', icon: FileText },
  ];

  return (
    <div>
      {/* Back Button */}
      {(paramUserId && isAdmin) && (
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back to Employees
        </button>
      )}

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
        <div className="profile-header-card">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="profile-header-avatar-wrapper">
              <Avatar name={user.name} color={user.avatarColor} size="xxl" />
              {canEdit && (
                <button className="profile-header-edit-btn" onClick={handleOpenEdit} title="Edit Profile">
                  <Edit2 size={12} />
                </button>
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: '0.25rem' }}>
              <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
                {profile.firstName} {profile.lastName}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: '0.5rem' }}>{profile.jobTitle || '—'}</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8125rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                  {user.empId}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8125rem', backdropFilter: 'blur(4px)' }}>
                  {profile.department || '—'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8125rem', textTransform: 'capitalize', backdropFilter: 'blur(4px)' }}>
                  {user.role}
                </span>
              </div>
            </div>
            {canEdit && (
              <button className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', backdropFilter: 'blur(4px)' }} onClick={handleOpenEdit}>
                <Edit2 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Quick Info Strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, borderTop: '1px solid var(--color-border)' }}>
          {[
            { icon: Mail, label: user.email },
            { icon: Phone, label: profile.phone || '—' },
            { icon: MapPin, label: profile.workLocation || '—' },
            { icon: Calendar, label: profile.joiningDate ? `Joined ${profile.joiningDate}` : '—' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRight: '1px solid var(--color-border)', flex: 1, minWidth: 180 }}>
                <Icon size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', marginBottom: 0, border: '1px solid var(--color-border)', borderBottom: 'none' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', borderTop: 'none' }}>
        <div className="card-body">

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div>
              {profile.bio && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--color-primary)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>About</div>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{profile.bio}</p>
                </div>
              )}
              <div className="grid-2">
                {[
                  { label: 'First Name', value: profile.firstName, icon: User },
                  { label: 'Last Name', value: profile.lastName, icon: User },
                  { label: 'Email', value: user.email, icon: Mail },
                  { label: 'Phone', value: profile.phone || '—', icon: Phone },
                  { label: 'Date of Birth', value: profile.dateOfBirth || '—', icon: Calendar },
                  { label: 'Gender', value: profile.gender || '—', icon: User },
                  { label: 'Nationality', value: profile.nationality || '—', icon: Globe },
                  { label: 'Address', value: profile.address || '—', icon: MapPin },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border-light)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem' }}>{item.label}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {profile.emergencyContact && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius)', border: '1px solid rgba(217,119,6,0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Emergency Contact</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{profile.emergencyContact}</div>
                </div>
              )}
            </div>
          )}

          {/* Job Details Tab */}
          {activeTab === 'job' && (
            <div className="grid-2">
              {[
                { label: 'Job Title', value: profile.jobTitle || '—', icon: Briefcase },
                { label: 'Department', value: profile.department || '—', icon: Building2 },
                { label: 'Employment Type', value: profile.employmentType || '—', icon: FileText },
                { label: 'Work Location', value: profile.workLocation || '—', icon: MapPin },
                { label: 'Joining Date', value: profile.joiningDate || '—', icon: Calendar },
                { label: 'Employee ID', value: user.empId, icon: User },
                { label: 'Manager', value: profile.managerId ? (state.users.find(u => u.id === profile.managerId)?.name || '—') : '—', icon: User },
                { label: 'Role', value: user.role === 'admin' ? 'HR Admin' : 'Employee', icon: Briefcase },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--color-secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} style={{ color: 'var(--color-secondary)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Salary Tab */}
          {activeTab === 'salary' && payroll && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, var(--color-primary), #6D28D9)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', color: 'white' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>Net Monthly Salary ({payroll.currency})</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                    {payroll.currency === 'INR' ? '₹' : payroll.currency === 'GBP' ? '£' : payroll.currency === 'KRW' ? '₩' : '$'}
                    {payroll.netSalary.toLocaleString()}
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', opacity: 0.75 }}>Paid {payroll.payPeriod}</div>
                </div>
              </div>
              <div className="grid-2">
                {[
                  { label: 'Base Salary', value: payroll.baseSalary, type: 'earning' },
                  { label: 'HRA', value: payroll.hra, type: 'earning' },
                  { label: 'Medical Allowance', value: payroll.medical, type: 'earning' },
                  { label: 'Transport Allowance', value: payroll.transport, type: 'earning' },
                  { label: 'Income Tax', value: payroll.tax, type: 'deduction' },
                  { label: 'Provident Fund (PF)', value: payroll.pf, type: 'deduction' },
                ].map(item => {
                  const sym = payroll.currency === 'INR' ? '₹' : payroll.currency === 'GBP' ? '£' : payroll.currency === 'KRW' ? '₩' : '$';
                  return (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border-light)' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem' }}>
                          {item.type === 'earning' ? '+ Earning' : '− Deduction'}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: item.type === 'deduction' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {item.type === 'deduction' ? '−' : '+'}{sym}{item.value.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div>
              <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
                {[
                  { label: 'Days Present', value: presentCount, color: '#059669', bg: '#D1FAE5' },
                  { label: 'Paid Leave Left', value: myLeaveBalance.paid.total - myLeaveBalance.paid.used, color: '#7C3AED', bg: '#EDE9FE' },
                  { label: 'Sick Leave Left', value: myLeaveBalance.sick.total - myLeaveBalance.sick.used, color: '#0D9488', bg: '#CCFBF1' },
                  { label: 'Leave Requests', value: state.leaveRequests.filter(r => r.userId === targetUserId).length, color: '#D97706', bg: '#FEF3C7' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-card-icon" style={{ background: s.bg }}>
                      <FileText size={18} style={{ color: s.color }} />
                    </div>
                    <div className="stat-card-body">
                      <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
                      <div className="stat-card-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h4 style={{ marginBottom: '0.875rem', fontSize: '0.9375rem' }}>Leave Request History</h4>
              {state.leaveRequests.filter(r => r.userId === targetUserId).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No leave requests on record.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr><th>Type</th><th>Period</th><th>Days</th><th>Status</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {state.leaveRequests.filter(r => r.userId === targetUserId).map(req => (
                        <tr key={req.id}>
                          <td style={{ fontWeight: 500 }}>{req.leaveType}</td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{req.startDate} → {req.endDate}</td>
                          <td style={{ fontWeight: 600 }}>{req.days}d</td>
                          <td><Badge status={req.status} /></td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{req.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Profile${!isOwnProfile && isAdmin ? ` – ${user.name}` : ''}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditModal(false)} disabled={editLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading ? <span className="spinner" /> : <><Save size={14} /> Save Changes</>}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {canEditAll && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '0.25rem', borderBottom: '1px solid var(--color-primary-light)' }}>
                Professional Details (Admin)
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-control" value={editForm.firstName || ''} onChange={ef('firstName')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" value={editForm.lastName || ''} onChange={ef('lastName')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <select className="form-control" value={editForm.jobTitle || ''} onChange={ef('jobTitle')}>
                    <option value="">Select...</option>
                    {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control" value={editForm.department || ''} onChange={ef('department')}>
                    <option value="">Select...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Employment Type</label>
                  <select className="form-control" value={editForm.employmentType || ''} onChange={ef('employmentType')}>
                    {['Full-time', 'Part-time', 'Contract', 'Internship'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Work Location</label>
                  <select className="form-control" value={editForm.workLocation || ''} onChange={ef('workLocation')}>
                    {['Office', 'Remote', 'Hybrid'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input type="date" className="form-control" value={editForm.joiningDate || ''} onChange={ef('joiningDate')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={editForm.gender || ''} onChange={ef('gender')}>
                    <option value="">Select...</option>
                    {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '0.25rem', borderBottom: '1px solid var(--color-secondary-light)', marginTop: canEditAll ? '0.5rem' : 0 }}>
            Personal Details
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" placeholder="+1 234 567 8900" value={editForm.phone || ''} onChange={ef('phone')} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-control" rows={2} placeholder="Street, City, Country" value={editForm.address || ''} onChange={ef('address')} />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-control" rows={2} placeholder="Brief introduction..." value={editForm.bio || ''} onChange={ef('bio')} />
          </div>
          <div className="form-group">
            <label className="form-label">Emergency Contact</label>
            <input className="form-control" placeholder="Name (Relationship) - Phone" value={editForm.emergencyContact || ''} onChange={ef('emergencyContact')} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
