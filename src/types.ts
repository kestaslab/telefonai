export type UserRole = 'admin' | 'teacher';

export interface WhitelistedUser {
  email: string;
  name: string;
  role: UserRole;
  addedAt: string;
  addedBy: string;
}

export interface CurrentUser {
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  token?: string;
}

export interface ViolationRecord {
  id: string;
  studentName: string;
  studentClass: string;
  timestamp: string; // ISO string
  location: string;
  note?: string;
  registeredByTeacherEmail: string;
  registeredByTeacherName: string;
  createdAt: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  schoolYear?: string; // e.g. "2025–2026 m. m."
}

export type TimeFilterPeriod = 'week' | 'month' | 'half_year' | 'school_year' | 'all';

export interface StudentIntervention {
  id: string;
  studentName: string;
  studentClass: string;
  action: string; // e.g., 'Atimtas telefonas', 'Išsikviesti tėvai', 'VGK posėdis'
  note?: string;
  addedByTeacherEmail: string;
  addedByTeacherName: string;
  createdAt: string;
}

export interface ArchiveFilterOptions {
  schoolYear?: string;
  search?: string;
  studentClass?: string;
}

export interface StudentViolationSummary {
  studentName: string;
  studentClass: string;
  violationCount: number;
  lastViolationDate: string;
  records: ViolationRecord[];
  interventions?: StudentIntervention[];
}

export interface StatisticsData {
  totalViolations: number;
  periodViolationsCount: number;
  uniqueStudentsCount: number;
  topViolators: StudentViolationSummary[];
  allStudentsSummary: StudentViolationSummary[];
  byClass: { classNumber: string; count: number }[];
  byLocation: { location: string; count: number }[];
  byMonth: { monthLabel: string; count: number }[];
}

export interface AutocompleteStudent {
  name: string;
  class: string;
  count: number;
}
