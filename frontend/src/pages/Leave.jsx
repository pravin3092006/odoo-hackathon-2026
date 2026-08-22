import { useState } from 'react';
import { Plus, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { calcLeaveDays } from '../data/mockData';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

export default function Leave() {
  const { state, actions } = useHRMS();
  const isAdmin = state.viewingRole === 'admin';
  const userId = state.currentUser?.id;

  const [activeTab, setActiveTab] = useState(isAdmin ? 'pending' : 'my');
  const [filterStatus, setFilterStatus] = useState('All');

  // Apply Leave Modal
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ leaveType: 'Paid', startDate: '', endDate: '', remarks: '' });
  const [applyErrors, setApplyErrors] = useState({});
  const [applyLoading, setApplyLoading] = useState(false);

  // Reject Modal
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null, comments: '' });
  const [rejectLoading, setRejectLoading] = useState(false);

  // Review detail modal
  const [reviewModal, setReviewModal] = useState({ open: false, request: null });

  const myRequests = state.leaveRequests.filter(r => r.userId === userId);
  const allRequests = state.leaveRequests;
  const pendingRequests = allRequests.filter(r => r.status === 'Pending');

  const getUser = (uid) => state.users.find(u => u.id === uid);
  const myBalance = state.leaveBalance[userId] || { paid: { total: 20, used: 0 }, sick: { total: 10, used: 0 }, unpaid: { total: 5, used: 0 } };

  const displayRequests = isAdmin
    ? (activeTab === 'pending' ? pendingRequests : allRequests).filter(r => filterStatus === 'All' || r.status === filterStatus)
    : myRequests.filter(r => filterStatus === 'All' || r.status === filterStatus);

  // FIXED: Use calcLeaveDays from mockData which correctly counts inclusive working days
  const applyDays = calcLeaveDays(applyForm.startDate, applyForm.endDate);

  const validateApply = () => {
    const e = {};
    if (!applyForm.startDate) e.startDate = 'Start date required.';
    if (!applyForm.endDate) e.endDate = 'End date required.';
    else if (applyForm.endDate < applyForm.startDate) e.endDate = 'End date must be on or after start date.';
    if (!applyForm.remarks.trim()) e.remarks = 'Please provide a reason.';
    return e;
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    const errs = validateApply();
    if (Object.keys(errs).length) { setApplyErrors(errs); return; }
    setApplyLoading(true);
    await new Promise(r => setTimeout(r, 700));
    actions.applyLeave(userId, { ...applyForm, days: applyDays });
    setApplyOpen(false);
    setApplyForm({ leaveType: 'Paid', startDate: '', endDate: '', remarks: '' });
    setApplyErrors({});
    setApplyLoading(false);
  };

  const handleReject = async () => {
    if (!rejectModal.comments.trim()) return;
    setRejectLoading(true);
    await new Promise(r => setTimeout(r, 500));
    actions.rejectLeave(rejectModal.requestId, userId, rejectModal.comments);
    setRejectModal({ open: false, requestId: null, comments: '' });
    setRejectLoading(false);
  };

  const handleApprove = async (requestId) => {
    await new Promise(r => setTimeout(r, 300));
    actions.approveLeave(requestId, userId, 'Approved.');
    setReviewModal({ open: false, request: null });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Leave & Time Off</h1>
          <p className="page-subtitle">{isAdmin ? 'Review and manage employee leave requests' : 'Apply for leave and track your requests'}</p>
        </div>
        <div className="page-header-actions">
          {!isAdmin && (
            <button className="btn btn-primary" onClick={() => setApplyOpen(true)}>
              <Plus size={15} /> Apply for Leave
            </button>
          )}
        </div>
      </div>

      {/* Employee leave balance */}
      {!isAdmin && (
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          {[
            { label: 'Paid Leave', key: 'paid', color: '#7C3AED', bg: '#EDE9FE' },
            { label: 'Sick Leave', key: 'sick', color: '#0D9488', bg: '#CCFBF1' },
            { label: 'Unpaid Leave', key: 'unpaid', color: '#D97706', bg: '#FEF3C7' },
          ].map(({ label, key, color, bg }) => {
            const bal = myBalance[key];
            const avail = bal.total - bal.used;
            const pct = Math.round((bal.used / bal.total) * 100);
            return (
              <div key={key} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</span>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={16} style={{ color }} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1, marginBottom: '0.25rem' }}>{avail}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>of {bal.total} days available</div>
                <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 'var(--radius-full)' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>{bal.used} days used</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Summary */}
      {isAdmin && (
        <div className="grid-4" style={{ marginBottom: '1rem' }}>
          {[
            { label: 'Pending', count: allRequests.filter(r => r.status === 'Pending').length, color: '#7C3AED', bg: '#EDE9FE' },
            { label: 'Approved', count: allRequests.filter(r => r.status === 'Approved').length, color: '#059669', bg: '#D1FAE5' },
            { label: 'Rejected', count: allRequests.filter(r => r.status === 'Rejected').length, color: '#DC2626', bg: '#FEE2E2' },
            { label: 'Total Requests', count: allRequests.length, color: '#2563EB', bg: '#DBEAFE' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-icon" style={{ background: s.bg }}>
                <CalendarDays size={20} style={{ color: s.color }} />
              </div>
              <div className="stat-card-body">
                <div className="stat-card-value">{s.count}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 0 }}>
            {isAdmin ? (
              <>
                <button className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                  Pending
                  {pendingRequests.length > 0 && (
                    <span className="nav-item-badge" style={{ position: 'static', marginLeft: '0.375rem' }}>{pendingRequests.length}</span>
                  )}
                </button>
                <button className={`tab-item ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                  All Requests
                </button>
              </>
            ) : (
              <span className="card-title">My Leave Requests</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
              <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterStatus(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          {displayRequests.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={28} />}
              title="No leave requests"
              description={isAdmin ? 'No leave requests match the current filters.' : "You haven't submitted any leave requests yet."}
              action={!isAdmin && (
                <button className="btn btn-primary" onClick={() => setApplyOpen(true)}>
                  <Plus size={14} /> Apply for Leave
                </button>
              )}
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Leave Type</th>
                  <th>Period</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                  {!isAdmin && <th>HR Comments</th>}
                </tr>
              </thead>
              <tbody>
                {displayRequests.map(req => {
                  // Resolve employee via userId — never "??"
                  const emp = getUser(req.userId);
                  return (
                    <tr key={req.id}>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <Avatar name={emp?.name || '?'} color={emp?.avatarColor || '#9CA3AF'} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{emp?.name || 'Unknown Employee'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{emp?.empId || '–'}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{req.leaveType}</span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {req.startDate}{req.startDate !== req.endDate ? ` → ${req.endDate}` : ''}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {/* Re-calculate for display in case days was stored incorrectly */}
                        {req.days}d
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 200 }}>
                          {req.remarks}
                        </span>
                      </td>
                      <td><Badge status={req.status} /></td>
                      {isAdmin && (
                        <td>
                          {req.status === 'Pending' ? (
                            <button className="btn btn-sm btn-success" onClick={() => setReviewModal({ open: true, request: req })}>
                              <CheckCircle size={13} /> Review
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-ghost" onClick={() => setReviewModal({ open: true, request: req })}>
                              View
                            </button>
                          )}
                        </td>
                      )}
                      {!isAdmin && (
                        <td style={{ fontSize: '0.8125rem', color: req.reviewComments ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
                          {req.reviewComments || (req.status === 'Pending' ? 'Awaiting review' : '–')}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        open={applyOpen}
        onClose={() => { setApplyOpen(false); setApplyErrors({}); }}
        title="Apply for Leave"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setApplyOpen(false)} disabled={applyLoading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleApplySubmit} disabled={applyLoading}>
              {applyLoading ? <span className="spinner" /> : 'Submit Request'}
            </button>
          </>
        }
      >
        <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Leave Type <span className="required">*</span></label>
            <select className="form-control" value={applyForm.leaveType} onChange={e => setApplyForm(f => ({ ...f, leaveType: e.target.value }))}>
              <option value="Paid">Paid Leave ({myBalance.paid.total - myBalance.paid.used} days available)</option>
              <option value="Sick">Sick Leave ({myBalance.sick.total - myBalance.sick.used} days available)</option>
              <option value="Unpaid">Unpaid Leave ({myBalance.unpaid.total - myBalance.unpaid.used} days available)</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Date <span className="required">*</span></label>
              <input
                type="date"
                className={`form-control ${applyErrors.startDate ? 'form-control-error' : ''}`}
                value={applyForm.startDate}
                onChange={e => { setApplyForm(f => ({ ...f, startDate: e.target.value })); setApplyErrors(er => { const n = { ...er }; delete n.startDate; return n; }); }}
              />
              {applyErrors.startDate && <span className="form-error">{applyErrors.startDate}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">End Date <span className="required">*</span></label>
              <input
                type="date"
                className={`form-control ${applyErrors.endDate ? 'form-control-error' : ''}`}
                min={applyForm.startDate || today}
                value={applyForm.endDate}
                onChange={e => { setApplyForm(f => ({ ...f, endDate: e.target.value })); setApplyErrors(er => { const n = { ...er }; delete n.endDate; return n; }); }}
              />
              {applyErrors.endDate && <span className="form-error">{applyErrors.endDate}</span>}
            </div>
          </div>

          {/* Duration preview — uses correct inclusive calculation */}
          {applyDays > 0 && (
            <div style={{ padding: '0.75rem 1rem', background: 'var(--color-primary-light)', borderRadius: 'var(--radius)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                📅 Duration: {applyDays} working day{applyDays !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Reason / Remarks <span className="required">*</span></label>
            <textarea
              className={`form-control ${applyErrors.remarks ? 'form-control-error' : ''}`}
              rows={3}
              placeholder="Please provide a brief reason for your leave..."
              value={applyForm.remarks}
              onChange={e => { setApplyForm(f => ({ ...f, remarks: e.target.value })); setApplyErrors(er => { const n = { ...er }; delete n.remarks; return n; }); }}
            />
            {applyErrors.remarks && <span className="form-error">{applyErrors.remarks}</span>}
          </div>
        </form>
      </Modal>

      {/* Review / Approve/Reject Modal */}
      <Modal
        open={reviewModal.open}
        onClose={() => setReviewModal({ open: false, request: null })}
        title="Leave Request Details"
        size="lg"
        footer={
          reviewModal.request?.status === 'Pending' ? (
            <>
              <button className="btn btn-outline" onClick={() => setReviewModal({ open: false, request: null })}>Close</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setReviewModal({ open: false, request: null });
                  setRejectModal({ open: true, requestId: reviewModal.request?.id, comments: '' });
                }}
              >
                <XCircle size={14} /> Reject
              </button>
              <button className="btn btn-success" onClick={() => handleApprove(reviewModal.request?.id)}>
                <CheckCircle size={14} /> Approve
              </button>
            </>
          ) : (
            <button className="btn btn-outline" onClick={() => setReviewModal({ open: false, request: null })}>Close</button>
          )
        }
      >
        {reviewModal.request && (() => {
          const req = reviewModal.request;
          const emp = getUser(req.userId);
          const reviewer = req.reviewedBy ? getUser(req.reviewedBy) : null;
          // Re-calculate displayed days using the correct inclusive function
          const displayDays = calcLeaveDays(req.startDate, req.endDate);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)' }}>
                <Avatar name={emp?.name || '?'} color={emp?.avatarColor || '#9CA3AF'} size="lg" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{emp?.name || 'Employee'}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {emp?.empId} · {state.profiles[emp?.id]?.department || '–'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}><Badge status={req.status} /></div>
              </div>
              <div className="grid-2">
                {[
                  { label: 'Leave Type', value: req.leaveType },
                  { label: 'Duration', value: `${displayDays} working day${displayDays !== 1 ? 's' : ''}` },
                  { label: 'Start Date', value: req.startDate },
                  { label: 'End Date', value: req.endDate },
                  { label: 'Submitted', value: req.createdAt },
                  { label: 'Request ID', value: req.id },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0.875rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Employee Remarks</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', margin: 0 }}>{req.remarks}</p>
              </div>
              {req.reviewComments && (
                <div style={{ padding: '0.875rem', background: req.status === 'Approved' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', borderRadius: 'var(--radius)', border: `1px solid ${req.status === 'Approved' ? '#A7F3D0' : '#FECACA'}` }}>
                  <div style={{ fontSize: '0.75rem', color: req.status === 'Approved' ? 'var(--color-success)' : 'var(--color-danger)', marginBottom: '0.375rem', fontWeight: 600 }}>
                    HR Comments{reviewer ? ` by ${reviewer.name}` : ''}
                  </div>
                  <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--color-text-primary)' }}>{req.reviewComments}</p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, requestId: null, comments: '' })}
        title="Reject Leave Request"
        size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setRejectModal({ open: false, requestId: null, comments: '' })} disabled={rejectLoading}>Cancel</button>
            <button className="btn btn-danger" onClick={handleReject} disabled={rejectLoading || !rejectModal.comments.trim()}>
              {rejectLoading ? <span className="spinner" /> : <><XCircle size={14} /> Reject Request</>}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Please provide a reason for rejecting this leave request. This message will be visible to the employee.
          </p>
          <div className="form-group">
            <label className="form-label">Rejection Reason <span className="required">*</span></label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g., Sprint deadline this week. Please reschedule for the following week."
              value={rejectModal.comments}
              onChange={e => setRejectModal(r => ({ ...r, comments: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
