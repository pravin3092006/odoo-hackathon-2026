// Converts Supabase (snake_case) rows into the camelCase shapes the
// existing Nexora HR pages already expect, so page components didn't
// need to change when the backend moved from mock data to Supabase.

export function rowToUser(row) {
  return {
    id: row.id,
    empId: row.emp_id,
    email: row.email,
    role: row.role,
    name: row.name,
    avatarInitials: row.avatar_initials,
    avatarColor: row.avatar_color,
  };
}

export function rowToProfile(row) {
  return {
    userId: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    address: row.address,
    jobTitle: row.job_title,
    department: row.department,
    joiningDate: row.joining_date,
    managerId: row.manager_id,
    employmentType: row.employment_type,
    workLocation: row.work_location,
    bio: row.bio,
    emergencyContact: row.emergency_contact,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    nationality: row.nationality,
  };
}

export function profileToRow(data) {
  const map = {
    firstName: 'first_name', lastName: 'last_name', phone: 'phone', address: 'address',
    jobTitle: 'job_title', department: 'department', joiningDate: 'joining_date',
    managerId: 'manager_id', employmentType: 'employment_type', workLocation: 'work_location',
    bio: 'bio', emergencyContact: 'emergency_contact', dateOfBirth: 'date_of_birth',
    gender: 'gender', nationality: 'nationality', name: 'name',
  };
  const row = {};
  Object.entries(data).forEach(([k, v]) => { if (map[k]) row[map[k]] = v; });
  return row;
}

export function rowToPayroll(row) {
  return {
    baseSalary: Number(row.base_salary), hra: Number(row.hra), medical: Number(row.medical),
    transport: Number(row.transport), tax: Number(row.tax), pf: Number(row.pf),
    netSalary: Number(row.net_salary), currency: row.currency, payPeriod: row.pay_period,
  };
}

export function payrollToRow(data) {
  const map = {
    baseSalary: 'base_salary', hra: 'hra', medical: 'medical', transport: 'transport',
    tax: 'tax', pf: 'pf', netSalary: 'net_salary', currency: 'currency', payPeriod: 'pay_period',
  };
  const row = {};
  Object.entries(data).forEach(([k, v]) => { if (map[k]) row[map[k]] = v; });
  return row;
}

export function rowToAttendance(row) {
  return {
    id: row.id, userId: row.user_id, date: row.date, status: row.status,
    checkIn: row.check_in, checkOut: row.check_out, hours: row.hours ? Number(row.hours) : 0,
    checkInTs: row.check_in_ts ? Number(row.check_in_ts) : null,
    checkOutTs: row.check_out_ts ? Number(row.check_out_ts) : null,
  };
}

export function rowToLeaveRequest(row) {
  return {
    id: row.id, userId: row.user_id, leaveType: row.leave_type, startDate: row.start_date,
    endDate: row.end_date, days: row.days, remarks: row.remarks, status: row.status,
    reviewedBy: row.reviewed_by, reviewComments: row.review_comments, createdAt: row.created_at?.split?.('T')[0] || row.created_at,
  };
}

export function rowToLeaveBalance(row) {
  return {
    paid: { total: row.paid_total, used: row.paid_used },
    sick: { total: row.sick_total, used: row.sick_used },
    unpaid: { total: row.unpaid_total, used: row.unpaid_used },
  };
}

export function rowToNotification(row) {
  return {
    id: row.id, title: row.title, message: row.message,
    time: timeAgo(row.created_at), read: row.read, type: row.type, userId: row.user_id,
  };
}

export function rowToPaySlip(row) {
  return { id: row.id, period: row.period, paidOn: row.paid_on, status: row.status };
}

export function rowToActivity(row) {
  return { id: row.id, type: row.type, userId: row.user_id, message: row.message, timestamp: row.created_at, time: timeAgo(row.created_at) };
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
