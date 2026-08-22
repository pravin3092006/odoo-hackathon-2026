import { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Eye, Users, Mail, Phone, Building2 } from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { DEPARTMENTS, JOB_TITLES } from '../data/mockData';

export default function Employees() {
  const { state, actions } = useHRMS();
  const navigate = useNavigate();
  const isAdmin = state.viewingRole === 'admin';
  const employees = state.users;

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, name: '' });
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', empId: '', email: '', role: 'employee', department: '', jobTitle: '', joiningDate: '', baseSalary: '' });
  const [addErrors, setAddErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);

  const depts = ['All', ...DEPARTMENTS];

  const filtered = employees.filter(u => {
    const profile = state.profiles[u.id];
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.empId.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || profile?.department?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || profile?.department === deptFilter;
    return matchSearch && matchDept;
  });

  const validateAdd = () => {
    const e = {};
    if (!addForm.name.trim()) e.name = 'Name required.';
    if (!addForm.empId.trim()) e.empId = 'Employee ID required.';
    if (!addForm.email.trim()) e.email = 'Email required.';
    else if (state.users.find(u => u.email === addForm.email)) e.email = 'Email already exists.';
    if (!addForm.department) e.department = 'Department required.';
    if (!addForm.jobTitle) e.jobTitle = 'Job title required.';
    return e;
  };

  const handleAddEmployee = async (e) => {
    e?.preventDefault();
    const errs = validateAdd();
    if (Object.keys(errs).length) { setAddErrors(errs); return; }
    setAddLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const newUser = {
      empId: addForm.empId, email: addForm.email, password: 'welcome123',
      role: addForm.role, name: addForm.name,
      avatarInitials: addForm.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      avatarColor: ['#7C3AED','#0D9488','#2563EB','#D97706','#DC2626','#059669'][Math.floor(Math.random()*6)],
    };
    const newProfile = {
      firstName: addForm.name.split(' ')[0], lastName: addForm.name.split(' ').slice(1).join(' '),
      phone: '', address: '', jobTitle: addForm.jobTitle, department: addForm.department,
      joiningDate: addForm.joiningDate || new Date().toISOString().split('T')[0],
      managerId: null, employmentType: 'Full-time', workLocation: 'Office',
    };
    const sal = parseInt(addForm.baseSalary) || 60000;
    const newPayroll = { baseSalary: sal, hra: Math.round(sal * 0.2), medical: 10000, transport: 5000, tax: Math.round(sal * 0.1), pf: Math.round(sal * 0.12), netSalary: Math.round(sal * 0.98), currency: 'USD', payPeriod: 'Monthly' };
    actions.addUser(newUser, newProfile, newPayroll);
    setAddModal(false);
    setAddForm({ name: '', empId: '', email: '', role: 'employee', department: '', jobTitle: '', joiningDate: '', baseSalary: '' });
    setAddErrors({});
    setAddLoading(false);
  };

  const fa = (field) => (e) => {
    setAddForm(f => ({ ...f, [field]: e.target.value }));
    if (addErrors[field]) setAddErrors(er => { const n = { ...er }; delete n[field]; return n; });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage and view all team members ({employees.length} total)</p>
        </div>
        {isAdmin && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setAddModal(true)}><Plus size={15} /> Add Employee</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search className="search-icon" />
          <input className="search-input" placeholder="Search by name, ID, email, department..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {depts.map(d => (
            <button key={d} className={`btn btn-sm ${deptFilter === d ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDeptFilter(d)}>{d}</button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title="No employees found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid-3">
          {filtered.map(u => {
            const profile = state.profiles[u.id];
            return (
              <div key={u.id} className="card" style={{ overflow: 'hidden', transition: 'all var(--transition)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                  <Avatar name={u.name} color={u.avatarColor} size="xl" />
                  <div style={{ marginTop: '0.875rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '0.125rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{profile?.jobTitle || '–'}</div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                        {u.empId}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0.875rem 1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      <Building2 size={13} style={{ flexShrink: 0 }} />
                      <span>{profile?.department || '–'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      <Mail size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                    </div>
                    {u.id && state.profiles[u.id]?.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        <Phone size={13} style={{ flexShrink: 0 }} />
                        <span>{state.profiles[u.id].phone}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/profile/${u.id}`)}>
                      <Eye size={13} /> View
                    </button>
                    {isAdmin && (
                      <button className="btn btn-sm btn-outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        onClick={() => setDeleteDialog({ open: true, userId: u.id, name: u.name })}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, userId: null, name: '' })}
        onConfirm={() => { actions.deleteUser(deleteDialog.userId, deleteDialog.name); setDeleteDialog({ open: false, userId: null, name: '' }); }}
        title="Remove Employee"
        message={`Are you sure you want to remove ${deleteDialog.name} from the system? This action cannot be undone.`}
        confirmLabel="Remove Employee"
      />

      {/* Add Employee Modal */}
      <Modal
        open={addModal}
        onClose={() => { setAddModal(false); setAddErrors({}); }}
        title="Add New Employee"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAddModal(false)} disabled={addLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddEmployee} disabled={addLoading}>
              {addLoading ? <span className="spinner" /> : <><Plus size={14} /> Add Employee</>}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input className={`form-control ${addErrors.name ? 'form-control-error' : ''}`} placeholder="Jane Smith" value={addForm.name} onChange={fa('name')} />
              {addErrors.name && <span className="form-error">{addErrors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Employee ID <span className="required">*</span></label>
              <input className={`form-control ${addErrors.empId ? 'form-control-error' : ''}`} placeholder="EMP007" value={addForm.empId} onChange={fa('empId')} />
              {addErrors.empId && <span className="form-error">{addErrors.empId}</span>}
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email <span className="required">*</span></label>
              <input type="email" className={`form-control ${addErrors.email ? 'form-control-error' : ''}`} placeholder="jane@company.com" value={addForm.email} onChange={fa('email')} />
              {addErrors.email && <span className="form-error">{addErrors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={addForm.role} onChange={fa('role')}>
                <option value="employee">Employee</option>
                <option value="admin">Admin / HR</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department <span className="required">*</span></label>
              <select className={`form-control ${addErrors.department ? 'form-control-error' : ''}`} value={addForm.department} onChange={fa('department')}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {addErrors.department && <span className="form-error">{addErrors.department}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Job Title <span className="required">*</span></label>
              <select className={`form-control ${addErrors.jobTitle ? 'form-control-error' : ''}`} value={addForm.jobTitle} onChange={fa('jobTitle')}>
                <option value="">Select title...</option>
                {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {addErrors.jobTitle && <span className="form-error">{addErrors.jobTitle}</span>}
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input type="date" className="form-control" value={addForm.joiningDate} onChange={fa('joiningDate')} />
            </div>
            <div className="form-group">
              <label className="form-label">Base Salary</label>
              <input type="number" className="form-control" placeholder="e.g. 80000" value={addForm.baseSalary} onChange={fa('baseSalary')} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
