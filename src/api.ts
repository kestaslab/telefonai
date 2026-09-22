import type { CurrentUser, ViolationRecord, StatisticsData, TimeFilterPeriod, WhitelistedUser, StudentIntervention, AutocompleteStudent } from './types';

const USER_STORAGE_KEY = 'tryskiai_user_session';

export function getStoredUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: CurrentUser | null) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user?.email) {
    headers['x-user-email'] = user.email;
  }
  if (user?.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  return headers;
}

export async function fetchServerConfig(): Promise<{
  googleClientId: string;
  defaultAdminEmail: string;
  schoolDomain: string;
}> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Nepavyko gauti serverio konfigūracijos');
  return res.json();
}

export async function loginWithGoogleCredential(credential: string): Promise<{ authorized: boolean; user?: CurrentUser; error?: string }> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  const data = await res.json();
  if (!res.ok || !data.authorized) {
    return {
      authorized: false,
      error: data.error || 'Neturite teisių pasiekti šią sistemą. Kreipkitės į administratorių.',
    };
  }

  setStoredUser(data.user);
  return { authorized: true, user: data.user };
}

export async function demoLogin(email: string, name?: string): Promise<{ authorized: boolean; user?: CurrentUser; error?: string }> {
  const res = await fetch('/api/auth/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });

  const data = await res.json();
  if (!res.ok || !data.authorized) {
    return {
      authorized: false,
      error: data.error || 'Neturite teisių pasiekti šią sistemą. Kreipkitės į administratorių.',
    };
  }

  setStoredUser(data.user);
  return { authorized: true, user: data.user };
}

export async function getAutocomplete(): Promise<{
  students: AutocompleteStudent[];
  locations: string[];
  classes: string[];
}> {
  const res = await fetch('/api/autocomplete', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Nepavyko gauti automatinio užbaigimo duomenų');
  return res.json();
}

export async function getViolations(params?: {
  studentClass?: string;
  student?: string;
  teacher?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'archived' | 'all';
  schoolYear?: string;
}): Promise<ViolationRecord[]> {
  const query = new URLSearchParams();
  if (params?.studentClass && params.studentClass !== 'all') query.set('studentClass', params.studentClass);
  if (params?.student) query.set('student', params.student);
  if (params?.teacher) query.set('teacher', params.teacher);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.status) query.set('status', params.status);
  if (params?.schoolYear && params.schoolYear !== 'all') query.set('schoolYear', params.schoolYear);

  const res = await fetch(`/api/violations?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko gauti pažeidimų sąrašo');
  }
  return res.json();
}

export async function archiveViolation(id: string): Promise<void> {
  const res = await fetch(`/api/violations/${id}/archive`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko archyvuoti įrašo');
  }
}

export async function restoreViolation(id: string): Promise<void> {
  const res = await fetch(`/api/violations/${id}/restore`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko atkurti įrašo iš archyvo');
  }
}

export async function archiveBatch(options: {
  schoolYear?: string;
  beforeDate?: string;
  archiveAllActive?: boolean;
  targetSchoolYear?: string;
}): Promise<{ success: boolean; count: number; message: string }> {
  const res = await fetch('/api/violations/archive-batch', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(options),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko atlikti masinio archyvavimo');
  }
  return res.json();
}

export async function getViolationsCounts(): Promise<{ active: number; currentYear: string }> {
  const res = await fetch('/api/violations/counts', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return { active: 0, currentYear: '' };
  return res.json();
}

export async function getArchiveYears(): Promise<string[]> {
  const res = await fetch('/api/archive/years', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createViolation(data: {
  studentName: string;
  studentClass: string;
  location: string;
  note?: string;
  timestamp: string;
}): Promise<ViolationRecord> {
  const res = await fetch('/api/violations', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko užregistruoti pažeidimo');
  }
  return res.json();
}

export async function deleteViolation(id: string): Promise<void> {
  const res = await fetch(`/api/violations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko ištrinti įrašo');
  }
}

export async function getStatistics(period: TimeFilterPeriod = 'month', limit: number = 10): Promise<StatisticsData> {
  const res = await fetch(`/api/stats?period=${period}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Nepavyko apskaičiuoti statistikos');
  return res.json();
}

export async function getClasses(): Promise<string[]> {
  const res = await fetch('/api/classes', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Nepavyko gauti klasių sąrašo');
  return res.json();
}

export async function addClass(name: string): Promise<string[]> {
  const res = await fetch('/api/classes', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko pridėti klasės');
  }
  return res.json();
}

export async function updateClass(oldName: string, newName: string): Promise<{ classes: string[]; updatedCount: number }> {
  const res = await fetch('/api/classes', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ oldName, newName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko atnaujinti klasės');
  }
  return res.json();
}

export async function deleteClass(name: string): Promise<string[]> {
  const res = await fetch(`/api/classes/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko ištrinti klasės');
  }
  return res.json();
}

export async function resetClasses(): Promise<string[]> {
  const res = await fetch('/api/classes/reset', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko atkurti pradinių klasių');
  }
  return res.json();
}

// Location management API
export async function getLocations(): Promise<string[]> {
  const res = await fetch('/api/locations', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Nepavyko gauti vietų sąrašo');
  return res.json();
}

export async function addLocation(name: string): Promise<string[]> {
  const res = await fetch('/api/locations', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko pridėti vietos');
  }
  return res.json();
}

export async function updateLocation(oldName: string, newName: string): Promise<{ locations: string[]; updatedCount: number }> {
  const res = await fetch('/api/locations', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ oldName, newName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko atnaujinti vietos');
  }
  return res.json();
}

export async function deleteLocation(name: string): Promise<string[]> {
  const res = await fetch(`/api/locations/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko ištrinti vietos');
  }
  return res.json();
}

export async function resetLocations(): Promise<string[]> {
  const res = await fetch('/api/locations/reset', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko atkurti pradinių vietų');
  }
  return res.json();
}

// Preset notes API
export async function getPresetNotes(): Promise<string[]> {
  const res = await fetch('/api/preset-notes', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Nepavyko gauti numatytųjų pastabų sąrašo');
  return res.json();
}

export async function addPresetNote(text: string): Promise<string[]> {
  const res = await fetch('/api/preset-notes', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko pridėti numatytosios pastabos');
  }
  return res.json();
}

export async function updatePresetNote(oldText: string, newText: string): Promise<{ presetNotes: string[]; updatedCount: number }> {
  const res = await fetch('/api/preset-notes', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ oldText, newText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko atnaujinti numatytosios pastabos');
  }
  return res.json();
}

export async function deletePresetNote(text: string): Promise<string[]> {
  const res = await fetch(`/api/preset-notes/${encodeURIComponent(text)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko ištrinti numatytosios pastabos');
  }
  return res.json();
}

export async function resetPresetNotes(): Promise<string[]> {
  const res = await fetch('/api/preset-notes/reset', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko atkurti pradinių pastabų');
  }
  return res.json();
}

// Student Interventions / Pedagogical Actions
export async function getStudentInterventions(params?: { studentName?: string; studentClass?: string }): Promise<StudentIntervention[]> {
  const query = new URLSearchParams();
  if (params?.studentName) query.set('studentName', params.studentName);
  if (params?.studentClass) query.set('studentClass', params.studentClass);

  const res = await fetch(`/api/interventions?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Nepavyko gauti mokinio priemonių sąrašo');
  return res.json();
}

export async function addStudentIntervention(data: {
  studentName: string;
  studentClass: string;
  action: string;
  note?: string;
}): Promise<StudentIntervention> {
  const res = await fetch('/api/interventions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko pridėti priemonės / veiksmo');
  }
  return res.json();
}

export async function deleteStudentIntervention(id: string): Promise<void> {
  const res = await fetch(`/api/interventions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko ištrinti priemonės įrašo');
  }
}

export async function getWhitelist(): Promise<WhitelistedUser[]> {
  const res = await fetch('/api/whitelist', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Nepavyko gauti baltojo sąrašo');
  return res.json();
}

export async function addToWhitelist(user: { email: string; name: string; role: 'admin' | 'teacher' }): Promise<WhitelistedUser> {
  const res = await fetch('/api/whitelist', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko pridėti naudotojo į sąrašą');
  }
  return res.json();
}

export async function removeFromWhitelist(email: string): Promise<void> {
  const res = await fetch(`/api/whitelist/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepavyko pašalinti naudotojo');
  }
}
