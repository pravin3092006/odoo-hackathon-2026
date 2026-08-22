// Shared constants & utilities for Nexora HR – Smart Human Resource Management System
// NOTE: This app is now backed by Supabase (see src/context/HRMSContext.jsx and
// src/lib/supabaseClient.js). This file only keeps the small set of constants and
// pure helper functions the UI still relies on.

export const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'HR', 'Finance', 'Marketing', 'Operations'];
export const JOB_TITLES = ['Software Engineer', 'Senior Engineer', 'Lead Engineer', 'UX Designer', 'Product Manager', 'HR Manager', 'HR Officer', 'Finance Analyst', 'Marketing Manager', 'Operations Lead'];

// ─── UTILITY ─────────────────────────────────────────────
/**
 * Calculate inclusive working days between two date strings (YYYY-MM-DD).
 * Same day = 1. Excludes weekends.
 */
export function calcLeaveDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate + 'T00:00:00');
  const e = new Date(endDate + 'T00:00:00');
  if (e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(count, 1); // at least 1 if any date is provided
}

/**
 * Format milliseconds into HH:MM:SS string.
 */
export function msToHMS(ms) {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format milliseconds as decimal hours rounded to 2dp.
 */
export function msToHours(ms) {
  return Math.round((ms / 3600000) * 100) / 100;
}
