import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { WhitelistedUser, ViolationRecord, TimeFilterPeriod, StatisticsData, StudentViolationSummary, StudentIntervention } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export const DEFAULT_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', 'I', 'II', 'III', 'IV'];

export const DEFAULT_LOCATIONS = [
  'Kabinetas 205 (Matematika)',
  'Kabinetas 104 (Lietuvių k.)',
  'Kabinetas 201 (Užsienio k.)',
  'Kabinetas 302 (Fizika / Gamtos m.)',
  'Kabinetas 108 (Istorija)',
  'Koridorius I a.',
  'Koridorius II a.',
  'Valgykla',
  'Sporto salė',
  'Rūbinė',
  'Biblioteka',
  'Mokyklos kiemas',
];

export const DEFAULT_PRESET_NOTES = [
  'Žaidė žaidimus pamokos metu',
  'Naršė TikTok / Instagram / socialiniuose tinkluose',
  'Susirašinėjo telefonu per pamoką',
  'Telefonas garsiai suskambėjo kontrolinio / pamokos metu',
  'Atsisakė įdėti telefoną į telefono dėžutę',
  'Filmavo ar fotografavo be leidimo',
  'Klausėsi muzikos su ausinėmis pamokos metu',
  'Garsiai leido muziką / vaizdo įrašą',
  'Naudojosi telefonu pertraukos metu neleistinoje zonoje',
];

interface DatabaseSchema {
  whitelist: WhitelistedUser[];
  violations: ViolationRecord[];
  classes?: string[];
  locations?: string[];
  presetNotes?: string[];
  interventions?: StudentIntervention[];
}

const DEFAULT_WHITELIST: WhitelistedUser[] = [
  {
    email: 'kestutis.labanauskas@tryskiumokykla.lt',
    name: 'Kęstutis Labanauskas',
    role: 'admin',
    addedAt: new Date().toISOString(),
    addedBy: 'Sistemos diegimas',
  },
  {
    email: 'direktore@tryskiumokykla.lt',
    name: 'Mokyklos Direktorė',
    role: 'admin',
    addedAt: new Date().toISOString(),
    addedBy: 'kestutis.labanauskas@tryskiumokykla.lt',
  },
  {
    email: 'pavaduotoja@tryskiumokykla.lt',
    name: 'Ugdimo Pavaduotoja',
    role: 'admin',
    addedAt: new Date().toISOString(),
    addedBy: 'kestutis.labanauskas@tryskiumokykla.lt',
  },
  {
    email: 'mokytoja.ona@tryskiumokykla.lt',
    name: 'Ona Kazlauskienė (Lietuvių k.)',
    role: 'teacher',
    addedAt: new Date().toISOString(),
    addedBy: 'kestutis.labanauskas@tryskiumokykla.lt',
  },
  {
    email: 'mokytojas.jonas@tryskiumokykla.lt',
    name: 'Jonas Jonaitis (Matematika)',
    role: 'teacher',
    addedAt: new Date().toISOString(),
    addedBy: 'kestutis.labanauskas@tryskiumokykla.lt',
  },
  {
    email: 'rasa.petraitiene@tryskiumokykla.lt',
    name: 'Rasa Petraitienė (Anglų k.)',
    role: 'teacher',
    addedAt: new Date().toISOString(),
    addedBy: 'kestutis.labanauskas@tryskiumokykla.lt',
  }
];

const DEFAULT_VIOLATIONS: ViolationRecord[] = [
  {
    id: 'v-101',
    studentName: 'Lukas Petrauskas',
    studentClass: '8a',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    location: 'Kabinetas 205 (Matematika)',
    note: 'Žaidė Brawl Stars ant kelių pasidėjęs telefoną pamokos metu.',
    registeredByTeacherEmail: 'mokytojas.jonas@tryskiumokykla.lt',
    registeredByTeacherName: 'Jonas Jonaitis',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'v-102',
    studentName: 'Lukas Petrauskas',
    studentClass: '8a',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    location: 'Kabinetas 104 (Lietuvių k.)',
    note: 'Telefonas skambėjo per diktanto rašymą, atsisakė iš pradžių padėti į dėžutę.',
    registeredByTeacherEmail: 'mokytoja.ona@tryskiumokykla.lt',
    registeredByTeacherName: 'Ona Kazlauskienė',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'v-103',
    studentName: 'Lukas Petrauskas',
    studentClass: '8a',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    location: 'Koridorius II a.',
    note: 'Pertraukos metu filmavo kitus mokinius rūbinėje be sutikimo.',
    registeredByTeacherEmail: 'kestutis.labanauskas@tryskiumokykla.lt',
    registeredByTeacherName: 'Kęstutis Labanauskas',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'v-104',
    studentName: 'Lukas Petrauskas',
    studentClass: '8a',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    location: 'Valgykla',
    note: 'Žiūrėjo vaizdo įrašus su garsu prie pietų stalo, ignoravo budinčios pastabas.',
    registeredByTeacherEmail: 'rasa.petraitiene@tryskiumokykla.lt',
    registeredByTeacherName: 'Rasa Petraitienė',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'v-105',
    studentName: 'Matas Jankauskas',
    studentClass: '9b',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    location: 'Kabinetas 302 (Fizika)',
    note: 'Susirašinėjo per Telegram laboratorinio darbo metu.',
    registeredByTeacherEmail: 'kestutis.labanauskas@tryskiumokykla.lt',
    registeredByTeacherName: 'Kęstutis Labanauskas',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'v-106',
    studentName: 'Matas Jankauskas',
    studentClass: '9b',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    location: 'Sporto salė',
    note: 'Fizinio lavinimo pamokoje sėdėjo ant suoliuko su telefonu.',
    registeredByTeacherEmail: 'mokytojas.jonas@tryskiumokykla.lt',
    registeredByTeacherName: 'Jonas Jonaitis',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'v-107',
    studentName: 'Emilija Balčiūnaitė',
    studentClass: '7a',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    location: 'Kabinetas 201 (Anglų k.)',
    note: 'Naršė TikTok po suolu per žodyno atsiskaitinėjimą.',
    registeredByTeacherEmail: 'rasa.petraitiene@tryskiumokykla.lt',
    registeredByTeacherName: 'Rasa Petraitienė',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'v-108',
    studentName: 'Emilija Balčiūnaitė',
    studentClass: '7a',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    location: 'Koridorius I a.',
    note: 'Skambėjo telefonas prasidėjus pamokai, nebuvo išjungtas garsas.',
    registeredByTeacherEmail: 'mokytoja.ona@tryskiumokykla.lt',
    registeredByTeacherName: 'Ona Kazlauskienė',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: 'v-109',
    studentName: 'Kajus Stankevičius',
    studentClass: '10b',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    location: 'Biblioteka',
    note: 'Klausėsi muzikos su ausinėmis tylos zonoje, atsisakė paslėpti telefoną.',
    registeredByTeacherEmail: 'kestutis.labanauskas@tryskiumokykla.lt',
    registeredByTeacherName: 'Kęstutis Labanauskas',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'v-110',
    studentName: 'Dominykas Vaitkus',
    studentClass: '8a',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    location: 'Kabinetas 205 (Matematika)',
    note: 'Dalinosi ekrano vaizdu ir rodė memus suolo draugui.',
    registeredByTeacherEmail: 'mokytojas.jonas@tryskiumokykla.lt',
    registeredByTeacherName: 'Jonas Jonaitis',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'v-111',
    studentName: 'Gabija Urbonaitė',
    studentClass: '6a',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    location: 'Kabinetas 108 (Gamta)',
    note: 'Fotografavo kontrolinio užduotis.',
    registeredByTeacherEmail: 'mokytoja.ona@tryskiumokykla.lt',
    registeredByTeacherName: 'Ona Kazlauskienė',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'v-112',
    studentName: 'Nojus Žukauskas',
    studentClass: '9a',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    location: 'Koridorius II a.',
    note: 'Skambutis į pamoką jau nuaidėjo, stovėjo koridoriuje ir žaidė.',
    registeredByTeacherEmail: 'kestutis.labanauskas@tryskiumokykla.lt',
    registeredByTeacherName: 'Kęstutis Labanauskas',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
  }
];

function ensureDbFile(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      whitelist: DEFAULT_WHITELIST,
      violations: DEFAULT_VIOLATIONS,
      classes: DEFAULT_CLASSES,
      locations: DEFAULT_LOCATIONS,
      presetNotes: DEFAULT_PRESET_NOTES,
      interventions: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    let changed = false;

    // Ensure kestutis.labanauskas@tryskiumokykla.lt is always in whitelist as admin
    const hasAdmin = parsed.whitelist?.some(
      (u: WhitelistedUser) => u.email.toLowerCase() === 'kestutis.labanauskas@tryskiumokykla.lt'
    );
    if (!hasAdmin) {
      parsed.whitelist = [DEFAULT_WHITELIST[0], ...(parsed.whitelist || [])];
      changed = true;
    }

    // Ensure classes array exists
    if (!parsed.classes || !Array.isArray(parsed.classes) || parsed.classes.length === 0) {
      parsed.classes = DEFAULT_CLASSES;
      changed = true;
    }

    // Ensure locations array exists
    if (!parsed.locations || !Array.isArray(parsed.locations) || parsed.locations.length === 0) {
      parsed.locations = DEFAULT_LOCATIONS;
      changed = true;
    }

    // Ensure presetNotes array exists
    if (!parsed.presetNotes || !Array.isArray(parsed.presetNotes) || parsed.presetNotes.length === 0) {
      parsed.presetNotes = DEFAULT_PRESET_NOTES;
      changed = true;
    }

    // Ensure interventions array exists
    if (!parsed.interventions || !Array.isArray(parsed.interventions)) {
      parsed.interventions = [];
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file, reinitializing:', err);
    const initialData: DatabaseSchema = {
      whitelist: DEFAULT_WHITELIST,
      violations: DEFAULT_VIOLATIONS,
      classes: DEFAULT_CLASSES,
      interventions: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveDb(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// Whitelist operations
export function getWhitelist(): WhitelistedUser[] {
  const db = ensureDbFile();
  return db.whitelist;
}

export function isEmailWhitelisted(email: string): { whitelisted: boolean; user?: WhitelistedUser } {
  const db = ensureDbFile();
  const normalized = email.trim().toLowerCase();
  const user = db.whitelist.find((u) => u.email.toLowerCase() === normalized);
  return {
    whitelisted: !!user,
    user,
  };
}

export function addToWhitelist(user: { email: string; name: string; role: 'admin' | 'teacher'; addedBy: string }): WhitelistedUser {
  const db = ensureDbFile();
  const normalizedEmail = user.email.trim().toLowerCase();

  const existingIdx = db.whitelist.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
  const newUser: WhitelistedUser = {
    email: normalizedEmail,
    name: user.name.trim() || normalizedEmail.split('@')[0],
    role: user.role,
    addedAt: new Date().toISOString(),
    addedBy: user.addedBy,
  };

  if (existingIdx >= 0) {
    db.whitelist[existingIdx] = newUser;
  } else {
    db.whitelist.push(newUser);
  }

  saveDb(db);
  return newUser;
}

export function removeFromWhitelist(email: string): boolean {
  const db = ensureDbFile();
  const normalized = email.trim().toLowerCase();
  
  // Protect the primary admin from accidental deletion
  if (normalized === 'kestutis.labanauskas@tryskiumokykla.lt') {
    return false;
  }

  const initialLen = db.whitelist.length;
  db.whitelist = db.whitelist.filter((u) => u.email.toLowerCase() !== normalized);
  if (db.whitelist.length !== initialLen) {
    saveDb(db);
    return true;
  }
  return false;
}

export function getSchoolYearFromDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 8 = Sept
  if (month >= 8) {
    return `${year}–${year + 1} m. m.`;
  } else {
    return `${year - 1}–${year} m. m.`;
  }
}

// Violations operations
export function getViolations(filter?: {
  class?: string;
  student?: string;
  teacher?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'archived' | 'all';
  schoolYear?: string;
}): ViolationRecord[] {
  const db = ensureDbFile();
  let list = db.violations.map((v) => ({
    ...v,
    schoolYear: v.schoolYear || getSchoolYearFromDate(v.timestamp),
    archived: !!v.archived,
  }));

  // Status filter (default to 'active' if not specified)
  const statusFilter = filter?.status || 'active';
  if (statusFilter === 'active') {
    list = list.filter((v) => !v.archived);
  } else if (statusFilter === 'archived') {
    list = list.filter((v) => !!v.archived);
  }

  // School year filter
  if (filter?.schoolYear && filter.schoolYear !== 'all') {
    list = list.filter((v) => v.schoolYear === filter.schoolYear);
  }

  if (filter?.class && filter.class !== 'all') {
    list = list.filter((v) => v.studentClass.toLowerCase() === filter.class?.toLowerCase());
  }

  if (filter?.student) {
    const q = filter.student.toLowerCase().trim();
    list = list.filter((v) => v.studentName.toLowerCase().includes(q));
  }

  if (filter?.teacher) {
    const t = filter.teacher.toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.registeredByTeacherEmail.toLowerCase().includes(t) ||
        v.registeredByTeacherName.toLowerCase().includes(t)
    );
  }

  if (filter?.startDate) {
    const start = new Date(filter.startDate).getTime();
    list = list.filter((v) => new Date(v.timestamp).getTime() >= start);
  }

  if (filter?.endDate) {
    const end = new Date(filter.endDate).getTime();
    list = list.filter((v) => new Date(v.timestamp).getTime() <= end);
  }

  // Sort by timestamp descending (newest first)
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return list;
}

export function addViolation(record: Omit<ViolationRecord, 'id' | 'createdAt'>): ViolationRecord {
  const db = ensureDbFile();
  const timestamp = record.timestamp || new Date().toISOString();
  const newRecord: ViolationRecord = {
    ...record,
    id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    archived: false,
    schoolYear: record.schoolYear || getSchoolYearFromDate(timestamp),
  };

  db.violations.unshift(newRecord);
  saveDb(db);
  return newRecord;
}

export function archiveViolation(id: string, userEmail: string, userRole: 'admin' | 'teacher'): boolean {
  const db = ensureDbFile();
  const index = db.violations.findIndex((v) => v.id === id);
  if (index === -1) return false;

  const violation = db.violations[index];
  if (userRole === 'admin' || violation.registeredByTeacherEmail.toLowerCase() === userEmail.toLowerCase()) {
    db.violations[index] = {
      ...violation,
      archived: true,
      archivedAt: new Date().toISOString(),
      archivedBy: userEmail,
      schoolYear: violation.schoolYear || getSchoolYearFromDate(violation.timestamp),
    };
    saveDb(db);
    return true;
  }
  return false;
}

export function restoreViolation(id: string, userEmail: string, userRole: 'admin' | 'teacher'): boolean {
  const db = ensureDbFile();
  const index = db.violations.findIndex((v) => v.id === id);
  if (index === -1) return false;

  const violation = db.violations[index];
  if (userRole === 'admin' || violation.registeredByTeacherEmail.toLowerCase() === userEmail.toLowerCase()) {
    db.violations[index] = {
      ...violation,
      archived: false,
      archivedAt: undefined,
      archivedBy: undefined,
    };
    saveDb(db);
    return true;
  }
  return false;
}

export function archiveBatch(options: {
  schoolYear?: string;
  beforeDate?: string;
  userEmail: string;
  archiveAllActive?: boolean;
  targetSchoolYear?: string;
}): number {
  const db = ensureDbFile();
  let count = 0;
  const nowStr = new Date().toISOString();

  db.violations = db.violations.map((v) => {
    if (v.archived) return v;

    const sYear = v.schoolYear || getSchoolYearFromDate(v.timestamp);
    let match = false;

    if (options.archiveAllActive) {
      match = true;
    } else if (options.schoolYear && sYear === options.schoolYear) {
      match = true;
    } else if (options.beforeDate && new Date(v.timestamp).getTime() < new Date(options.beforeDate).getTime()) {
      match = true;
    }

    if (match) {
      count += 1;
      return {
        ...v,
        archived: true,
        archivedAt: nowStr,
        archivedBy: options.userEmail,
        schoolYear: options.targetSchoolYear || sYear,
      };
    }
    return v;
  });

  if (count > 0) {
    saveDb(db);
  }
  return count;
}

export function getActiveViolationsCount(): number {
  const db = ensureDbFile();
  return db.violations.filter((v) => !v.archived).length;
}

export function getArchiveYears(): string[] {
  const db = ensureDbFile();
  const years = new Set<string>();
  
  db.violations.forEach((v) => {
    const y = v.schoolYear || getSchoolYearFromDate(v.timestamp);
    if (y) years.add(y);
  });

  // Always ensure current, past and upcoming school years are available in list
  const now = new Date();
  const currentY = now.getFullYear();
  years.add(`${currentY - 2}–${currentY - 1} m. m.`);
  years.add(`${currentY - 1}–${currentY} m. m.`);
  years.add(`${currentY}–${currentY + 1} m. m.`);
  years.add(`${currentY + 1}–${currentY + 2} m. m.`);

  return Array.from(years).sort().reverse();
}

export function deleteViolation(id: string, userEmail: string, userRole: 'admin' | 'teacher'): boolean {
  const db = ensureDbFile();
  const index = db.violations.findIndex((v) => v.id === id);
  if (index === -1) return false;

  const violation = db.violations[index];
  // Allow if admin or if creator
  if (userRole === 'admin' || violation.registeredByTeacherEmail.toLowerCase() === userEmail.toLowerCase()) {
    db.violations.splice(index, 1);
    saveDb(db);
    return true;
  }
  return false;
}

// Class management operations
export function getClasses(): string[] {
  const db = ensureDbFile();
  return db.classes && Array.isArray(db.classes) && db.classes.length > 0 ? db.classes : DEFAULT_CLASSES;
}

export function addClass(name: string): string[] {
  const db = ensureDbFile();
  const trimmed = name.trim();
  if (!trimmed) return getClasses();

  const current = db.classes || [...DEFAULT_CLASSES];
  const exists = current.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    current.push(trimmed);
    db.classes = current;
    saveDb(db);
  }
  return db.classes || [...DEFAULT_CLASSES];
}

export function updateClass(oldName: string, newName: string): { classes: string[]; updatedCount: number } {
  const db = ensureDbFile();
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();
  if (!trimmedNew) return { classes: getClasses(), updatedCount: 0 };

  const current = db.classes || [...DEFAULT_CLASSES];
  let updatedCount = 0;

  const idx = current.findIndex((c) => c.toLowerCase() === trimmedOld.toLowerCase());
  if (idx !== -1) {
    current[idx] = trimmedNew;
  } else {
    current.push(trimmedNew);
  }
  db.classes = current;

  // Update in all violations where studentClass matches oldName
  for (const v of db.violations) {
    if (v.studentClass && v.studentClass.toLowerCase() === trimmedOld.toLowerCase()) {
      v.studentClass = trimmedNew;
      updatedCount++;
    }
  }

  // Update in interventions
  if (db.interventions) {
    for (const item of db.interventions) {
      if (item.studentClass && item.studentClass.toLowerCase() === trimmedOld.toLowerCase()) {
        item.studentClass = trimmedNew;
      }
    }
  }

  saveDb(db);
  return { classes: db.classes || [...DEFAULT_CLASSES], updatedCount };
}

export function deleteClass(name: string): string[] {
  const db = ensureDbFile();
  const trimmed = name.trim().toLowerCase();
  const current = db.classes || [...DEFAULT_CLASSES];
  db.classes = current.filter((c) => c.toLowerCase() !== trimmed);
  saveDb(db);
  return db.classes || [...DEFAULT_CLASSES];
}

export function resetClasses(): string[] {
  const db = ensureDbFile();
  db.classes = [...DEFAULT_CLASSES];
  saveDb(db);
  return db.classes || [...DEFAULT_CLASSES];
}

// Location management operations
export function getLocations(): string[] {
  const db = ensureDbFile();
  return db.locations && Array.isArray(db.locations) && db.locations.length > 0 ? db.locations : DEFAULT_LOCATIONS;
}

export function addLocation(name: string): string[] {
  const db = ensureDbFile();
  const trimmed = name.trim();
  if (!trimmed) return getLocations();

  const current = db.locations || [...DEFAULT_LOCATIONS];
  const exists = current.some((l) => l.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    current.push(trimmed);
    db.locations = current;
    saveDb(db);
  }
  return db.locations || [...DEFAULT_LOCATIONS];
}

export function updateLocation(oldName: string, newName: string): { locations: string[]; updatedCount: number } {
  const db = ensureDbFile();
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();
  if (!trimmedNew) return { locations: getLocations(), updatedCount: 0 };

  const current = db.locations || [...DEFAULT_LOCATIONS];
  let updatedCount = 0;

  const idx = current.findIndex((l) => l.toLowerCase() === trimmedOld.toLowerCase());
  if (idx !== -1) {
    current[idx] = trimmedNew;
  } else {
    current.push(trimmedNew);
  }
  db.locations = current;

  // Update in existing violations where location matches oldName
  for (const v of db.violations) {
    if (v.location && v.location.toLowerCase() === trimmedOld.toLowerCase()) {
      v.location = trimmedNew;
      updatedCount++;
    }
  }

  saveDb(db);
  return { locations: db.locations || [...DEFAULT_LOCATIONS], updatedCount };
}

export function deleteLocation(name: string): string[] {
  const db = ensureDbFile();
  const trimmed = name.trim().toLowerCase();
  const current = db.locations || [...DEFAULT_LOCATIONS];
  db.locations = current.filter((l) => l.toLowerCase() !== trimmed);
  saveDb(db);
  return db.locations || [...DEFAULT_LOCATIONS];
}

export function resetLocations(): string[] {
  const db = ensureDbFile();
  db.locations = [...DEFAULT_LOCATIONS];
  saveDb(db);
  return db.locations || [...DEFAULT_LOCATIONS];
}

// Preset violation notes management operations
export function getPresetNotes(): string[] {
  const db = ensureDbFile();
  return db.presetNotes && Array.isArray(db.presetNotes) && db.presetNotes.length > 0 ? db.presetNotes : DEFAULT_PRESET_NOTES;
}

export function addPresetNote(text: string): string[] {
  const db = ensureDbFile();
  const trimmed = text.trim();
  if (!trimmed) return getPresetNotes();

  const current = db.presetNotes || [...DEFAULT_PRESET_NOTES];
  const exists = current.some((p) => p.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    current.push(trimmed);
    db.presetNotes = current;
    saveDb(db);
  }
  return db.presetNotes || [...DEFAULT_PRESET_NOTES];
}

export function updatePresetNote(oldText: string, newText: string): { presetNotes: string[]; updatedCount: number } {
  const db = ensureDbFile();
  const trimmedOld = oldText.trim();
  const trimmedNew = newText.trim();
  if (!trimmedNew) return { presetNotes: getPresetNotes(), updatedCount: 0 };

  const current = db.presetNotes || [...DEFAULT_PRESET_NOTES];
  let updatedCount = 0;

  const idx = current.findIndex((p) => p.toLowerCase() === trimmedOld.toLowerCase());
  if (idx !== -1) {
    current[idx] = trimmedNew;
  } else {
    current.push(trimmedNew);
  }
  db.presetNotes = current;

  // Update in existing violations where note exactly matches oldText
  for (const v of db.violations) {
    if (v.note && v.note.trim().toLowerCase() === trimmedOld.toLowerCase()) {
      v.note = trimmedNew;
      updatedCount++;
    }
  }

  saveDb(db);
  return { presetNotes: db.presetNotes || [...DEFAULT_PRESET_NOTES], updatedCount };
}

export function deletePresetNote(text: string): string[] {
  const db = ensureDbFile();
  const trimmed = text.trim().toLowerCase();
  const current = db.presetNotes || [...DEFAULT_PRESET_NOTES];
  db.presetNotes = current.filter((p) => p.toLowerCase() !== trimmed);
  saveDb(db);
  return db.presetNotes || [...DEFAULT_PRESET_NOTES];
}

export function resetPresetNotes(): string[] {
  const db = ensureDbFile();
  db.presetNotes = [...DEFAULT_PRESET_NOTES];
  saveDb(db);
  return db.presetNotes || [...DEFAULT_PRESET_NOTES];
}

// Student Interventions (Pedagogical Actions & Comments)
export function addStudentIntervention(data: {
  studentName: string;
  studentClass: string;
  action: string;
  note?: string;
  teacherEmail: string;
  teacherName: string;
}): StudentIntervention {
  const db = ensureDbFile();
  if (!db.interventions) db.interventions = [];

  const record: StudentIntervention = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentName: toTitleCase(data.studentName.trim()),
    studentClass: data.studentClass.trim(),
    action: data.action.trim(),
    note: data.note?.trim() || '',
    addedByTeacherEmail: data.teacherEmail,
    addedByTeacherName: data.teacherName,
    createdAt: new Date().toISOString(),
  };

  db.interventions.unshift(record);
  saveDb(db);
  return record;
}

export function getStudentInterventions(studentName?: string, studentClass?: string): StudentIntervention[] {
  const db = ensureDbFile();
  const list = db.interventions || [];
  if (!studentName) return list;

  const targetWords = normalizeForSearch(studentName).split(/\s+/).sort().join(' ');
  return list.filter((item) => {
    const itemWords = normalizeForSearch(item.studentName).split(/\s+/).sort().join(' ');
    const nameMatch = itemWords === targetWords || itemWords.includes(targetWords);
    if (studentClass) {
      return nameMatch && item.studentClass.toLowerCase() === studentClass.trim().toLowerCase();
    }
    return nameMatch;
  });
}

export function deleteStudentIntervention(id: string, userEmail: string, userRole: 'admin' | 'teacher'): boolean {
  const db = ensureDbFile();
  if (!db.interventions) return false;

  const idx = db.interventions.findIndex((i) => i.id === id);
  if (idx === -1) return false;

  const item = db.interventions[idx];
  if (userRole === 'admin' || item.addedByTeacherEmail.toLowerCase() === userEmail.toLowerCase()) {
    db.interventions.splice(idx, 1);
    saveDb(db);
    return true;
  }
  return false;
}

// Autocomplete suggestions and Deduplication
export function normalizeForSearch(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function toTitleCase(str: string): string {
  return (str || '')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getAutocompleteData(): {
  students: { name: string; class: string; count: number }[];
  locations: string[];
  classes: string[];
} {
  const db = ensureDbFile();
  const studentMap = new Map<string, { name: string; class: string; count: number; lastDate: string }>();

  const locationsSet = new Set<string>([
    'Kabinetas 205 (Matematika)',
    'Kabinetas 104 (Lietuvių k.)',
    'Kabinetas 201 (Užsienio k.)',
    'Kabinetas 302 (Fizika / Gamtos m.)',
    'Kabinetas 108 (Istorija)',
    'Koridorius I a.',
    'Koridorius II a.',
    'Valgykla',
    'Sporto salė',
    'Rūbinė',
    'Biblioteka',
    'Mokyklos kiemas',
  ]);

  for (const v of db.violations) {
    if (v.studentName && v.studentName.trim()) {
      const canonicalName = toTitleCase(v.studentName.trim());
      const wordsKey = normalizeForSearch(canonicalName).split(/\s+/).sort().join(' ');

      const existing = studentMap.get(wordsKey);
      if (!existing) {
        studentMap.set(wordsKey, {
          name: canonicalName,
          class: v.studentClass || '',
          count: 1,
          lastDate: v.timestamp || '',
        });
      } else {
        existing.count += 1;
        if (new Date(v.timestamp).getTime() > new Date(existing.lastDate).getTime()) {
          existing.class = v.studentClass || existing.class;
          existing.lastDate = v.timestamp;
          existing.name = canonicalName;
        }
      }
    }
    if (v.location) locationsSet.add(v.location);
  }

  const students = Array.from(studentMap.values()).map((s) => ({
    name: s.name,
    class: s.class,
    count: s.count,
  }));
  students.sort((a, b) => a.name.localeCompare(b.name, 'lt'));

  return {
    students,
    locations: Array.from(locationsSet),
    classes: getClasses(),
  };
}

// Calculate Statistics
export function calculateStatistics(period: TimeFilterPeriod = 'month', topLimit: number = 10): StatisticsData {
  const db = ensureDbFile();
  const now = new Date();
  let thresholdDate: Date;

  if (period === 'week') {
    thresholdDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === 'half_year') {
    thresholdDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  } else if (period === 'school_year') {
    // School year in Lithuania starts September 1st
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed: 8 is September
    const schoolYearStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
    thresholdDate = new Date(schoolYearStartYear, 8, 1);
  } else {
    // 'all'
    thresholdDate = new Date(0);
  }

  const periodViolations = db.violations.filter((v) => new Date(v.timestamp) >= thresholdDate);

  // Group by student
  const studentMap = new Map<string, { studentName: string; studentClass: string; records: ViolationRecord[] }>();
  for (const v of periodViolations) {
    const wordsKey = normalizeForSearch(v.studentName).split(/\s+/).sort().join(' ');
    const key = `${wordsKey}:::${(v.studentClass || '').trim().toLowerCase()}`;

    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentName: toTitleCase(v.studentName.trim()),
        studentClass: v.studentClass,
        records: [],
      });
    }
    studentMap.get(key)!.records.push(v);
  }

  const allInterventions = db.interventions || [];

  const studentSummaries: StudentViolationSummary[] = [];
  for (const [, val] of studentMap.entries()) {
    val.records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Attach interventions for this student
    const studentWordsKey = normalizeForSearch(val.studentName).split(/\s+/).sort().join(' ');
    const studentInterventions = allInterventions.filter((it) => {
      const itWordsKey = normalizeForSearch(it.studentName).split(/\s+/).sort().join(' ');
      return itWordsKey === studentWordsKey;
    });

    studentSummaries.push({
      studentName: val.studentName,
      studentClass: val.studentClass,
      violationCount: val.records.length,
      lastViolationDate: val.records[0]?.timestamp || '',
      records: val.records,
      interventions: studentInterventions,
    });
  }

  // Sort descending by count, then by latest violation
  studentSummaries.sort((a, b) => {
    if (b.violationCount !== a.violationCount) {
      return b.violationCount - a.violationCount;
    }
    return new Date(b.lastViolationDate).getTime() - new Date(a.lastViolationDate).getTime();
  });

  const topViolators = topLimit > 0 ? studentSummaries.slice(0, topLimit) : studentSummaries;

  // By class
  const classCounts = new Map<string, number>();
  for (const v of periodViolations) {
    const c = v.studentClass || 'Nenurodyta';
    classCounts.set(c, (classCounts.get(c) || 0) + 1);
  }
  const byClass = Array.from(classCounts.entries())
    .map(([classNumber, count]) => ({ classNumber, count }))
    .sort((a, b) => b.count - a.count);

  // By location
  const locationCounts = new Map<string, number>();
  for (const v of periodViolations) {
    const loc = v.location || 'Kita';
    locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
  }
  const byLocation = Array.from(locationCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalViolations: db.violations.length,
    periodViolationsCount: periodViolations.length,
    uniqueStudentsCount: studentSummaries.length,
    topViolators,
    allStudentsSummary: studentSummaries,
    byClass,
    byLocation,
    byMonth: [],
  };
}
