/**
 * Helper utilities for formatting lecturer and student names across UI
 */

/**
 * Strips role/position/department suffixes in parentheses from lecturer/advisor/council names.
 * Example:
 * - "Nguyen Thanh Son (Advisor - AI / CS)" -> "Nguyen Thanh Son"
 * - "Phan Thanh Hai (Senior Council Member)" -> "Phan Thanh Hai"
 * - "Huynh Tan Dat (Council Reviewer - Networks)" -> "Huynh Tan Dat"
 * - "MSc. Tran Hoang Nam (Advisor Lecturer - SE)" -> "MSc. Tran Hoang Nam"
 */
export function formatLecturerName(lecturer) {
  if (!lecturer) return '';
  const raw = typeof lecturer === 'string'
    ? lecturer
    : (lecturer.fullName || lecturer.lecturerName || lecturer.name || '');
  return raw.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Strips team/member details from student names and only marks the leader as "(Leader)".
 * Example:
 * - "Doan Van Hau (Leader - Team Vision AI)" -> "Doan Van Hau (Leader)"
 * - "Nguyen Quang Hai (Member - Team Vision AI)" -> "Nguyen Quang Hai"
 * - "Nguyen Tien Linh (Member - Team Vision AI)" -> "Nguyen Tien Linh"
 */
export function formatStudentTeamMember(student, options = {}) {
  if (!student) return '';
  const raw = typeof student === 'string'
    ? student
    : (student.fullName || student.name || '');
  const clean = raw.replace(/\s*\([^)]*\)/g, '').trim();

  const isLeader = Boolean(
    options.isLeader ??
    student.isLeader ??
    (student.roleInTeam === 'LEADER') ??
    (typeof raw === 'string' && /leader|trưởng\s*nhóm/i.test(raw))
  );

  if (isLeader) {
    return `${clean} (Leader)`;
  }
  return clean;
}

