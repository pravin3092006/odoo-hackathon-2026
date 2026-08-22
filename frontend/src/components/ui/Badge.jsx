const STATUS_CLASS = {
  'Present':  'badge-success',
  'Approved': 'badge-success',
  'Paid':     'badge-success',
  'Active':   'badge-success',
  'Absent':   'badge-danger',
  'Rejected': 'badge-danger',
  'Leave':    'badge-warning',
  'Half-day': 'badge-warning',
  'Processing': 'badge-warning',
  'Pending':  'badge-pending',
  'Unpaid':   'badge-neutral',
};

export default function Badge({ status, children }) {
  const label = children || status;
  const cls = STATUS_CLASS[label] || 'badge-neutral';
  return <span className={`badge ${cls}`}>{label}</span>;
}
