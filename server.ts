import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { OAuth2Client } from 'google-auth-library';
import {
  getWhitelist,
  isEmailWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  getViolations,
  addViolation,
  deleteViolation,
  archiveViolation,
  restoreViolation,
  archiveBatch,
  getArchiveYears,
  getActiveViolationsCount,
  getSchoolYearFromDate,
  getAutocompleteData,
  calculateStatistics,
  getClasses,
  addClass,
  updateClass,
  deleteClass,
  resetClasses,
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  resetLocations,
  getPresetNotes,
  addPresetNote,
  updatePresetNote,
  deletePresetNote,
  resetPresetNotes,
  addStudentIntervention,
  getStudentInterventions,
  deleteStudentIntervention,
  toTitleCase,
} from './server/db.js';
import type { TimeFilterPeriod } from './src/types';

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const oauthClient = new OAuth2Client(googleClientId);

async function verifyGoogleToken(token: string): Promise<{ email: string; name: string; picture?: string } | null> {
  try {
    if (googleClientId) {
      const ticket = await oauthClient.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) return null;
      return {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
      };
    }
  } catch (err) {
    console.warn('Google token signature verification failed with client ID, trying payload decode:', err);
  }

  // Fallback payload parsing (for demo / dev tokens or preview without client secret)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);
      if (payload.email) {
        return {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture,
        };
      }
    }
  } catch (err) {
    console.error('Error decoding token payload:', err);
  }

  return null;
}

// Simple in-memory session or header authentication check
interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    name: string;
    role: 'admin' | 'teacher';
  };
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const clientEmail = (req.headers['x-user-email'] as string) || '';

  if (!authHeader && !clientEmail) {
    return res.status(401).json({ error: 'Nepatvirtinta tapatybė. Prašome prisijungti.' });
  }

  // Check email against whitelist
  const targetEmail = clientEmail.toLowerCase().trim();
  const check = isEmailWhitelisted(targetEmail);

  if (!check.whitelisted || !check.user) {
    return res.status(403).json({
      error: 'Neturite teisių pasiekti šią sistemą. Kreipkitės į administratorių.',
      unauthorized: true,
      email: targetEmail,
    });
  }

  req.user = {
    email: check.user.email,
    name: check.user.name,
    role: check.user.role,
  };

  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Public config info (Google Client ID if configured)
  app.get('/api/config', (req, res) => {
    res.json({
      googleClientId: googleClientId || '',
      defaultAdminEmail: 'kestutis.labanauskas@tryskiumokykla.lt',
      schoolDomain: 'tryskiumokykla.lt',
    });
  });

  // Google Login / Verification endpoint
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ error: 'Trūksta Google prisijungimo žetono.' });
      }

      const verified = await verifyGoogleToken(credential);
      if (!verified) {
        return res.status(401).json({ error: 'Netinkamas Google prisijungimo žetonas.' });
      }

      const check = isEmailWhitelisted(verified.email);
      if (!check.whitelisted || !check.user) {
        return res.status(403).json({
          authorized: false,
          error: 'Neturite teisių pasiekti šią sistemą. Kreipkitės į administratorių.',
          email: verified.email,
          name: verified.name,
        });
      }

      return res.json({
        authorized: true,
        user: {
          email: check.user.email,
          name: check.user.name || verified.name,
          role: check.user.role,
          picture: verified.picture,
        },
      });
    } catch (err) {
      console.error('Auth error:', err);
      return res.status(500).json({ error: 'Autentifikavimo serverio klaida' });
    }
  });

  // Demo Login (for quick testing, local preview, or immediate evaluation)
  app.post('/api/auth/demo-login', (req, res) => {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Nurodykite el. pašto adresą.' });
    }

    const check = isEmailWhitelisted(email);
    if (!check.whitelisted || !check.user) {
      return res.status(403).json({
        authorized: false,
        error: 'Neturite teisių pasiekti šią sistemą. Kreipkitės į administratorių.',
        email,
        name: name || email.split('@')[0],
      });
    }

    return res.json({
      authorized: true,
      user: {
        email: check.user.email,
        name: check.user.name || name || check.user.email.split('@')[0],
        role: check.user.role,
      },
    });
  });

  // Autocomplete data (students, classes, locations)
  app.get('/api/autocomplete', authMiddleware, (req, res) => {
    const data = getAutocompleteData();
    res.json(data);
  });

  // Violations list (supports active, archived, all)
  app.get('/api/violations', authMiddleware, (req, res) => {
    const { studentClass, student, teacher, startDate, endDate, status, schoolYear } = req.query;
    const records = getViolations({
      class: studentClass as string,
      student: student as string,
      teacher: teacher as string,
      startDate: startDate as string,
      endDate: endDate as string,
      status: (status as 'active' | 'archived' | 'all') || 'active',
      schoolYear: schoolYear as string,
    });
    res.json(records);
  });

  // Archive distinct school years list
  app.get('/api/archive/years', authMiddleware, (req, res) => {
    const years = getArchiveYears();
    res.json(years);
  });

  // Archive a single violation (Admin only)
  app.post('/api/violations/:id/archive', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali archyvuoti įrašus.' });
    }
    const { id } = req.params;
    const success = archiveViolation(id, req.user!.email, req.user!.role);
    if (!success) {
      return res.status(403).json({ error: 'Nepavyko archyvuoti įrašo.' });
    }
    res.json({ success: true, message: 'Įrašas perkeltas į archyvą.' });
  });

  // Restore a single violation from archive (Admin only)
  app.post('/api/violations/:id/restore', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali atkurti įrašus iš archyvo.' });
    }
    const { id } = req.params;
    const success = restoreViolation(id, req.user!.email, req.user!.role);
    if (!success) {
      return res.status(403).json({ error: 'Nepavyko atkurti įrašo iš archyvo.' });
    }
    res.json({ success: true, message: 'Įrašas sugrąžintas į aktyvų registrą.' });
  });

  // Get counts of active violations and current school year
  app.get('/api/violations/counts', authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
    const active = getActiveViolationsCount();
    const currentYear = getSchoolYearFromDate(new Date());
    res.json({ active, currentYear });
  });

  // Batch archive violations (e.g. by school year, date, or all active for new school year)
  app.post('/api/violations/archive-batch', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali atlikti masinį archyvavimą.' });
    }
    const { schoolYear, beforeDate, archiveAllActive, targetSchoolYear } = req.body;
    const count = archiveBatch({
      schoolYear,
      beforeDate,
      archiveAllActive: !!archiveAllActive,
      targetSchoolYear,
      userEmail: req.user!.email,
    });
    res.json({ success: true, count, message: `Sėkmingai suarchyvuota įrašų: ${count}` });
  });

  // Register a new violation
  app.post('/api/violations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { studentName, studentClass, location, note, timestamp } = req.body;

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ error: 'Mokinio vardas ir pavardė yra privalomi.' });
    }

    if (!studentClass || !studentClass.trim()) {
      return res.status(400).json({ error: 'Klasė yra privaloma.' });
    }

    const classes = getClasses();
    const matchedClass = classes.find((c) => c.toLowerCase() === studentClass.trim().toLowerCase()) || studentClass.trim();

    const record = addViolation({
      studentName: toTitleCase(studentName.trim()),
      studentClass: matchedClass,
      location: location?.trim() || 'Kabinetas',
      note: note?.trim() || '',
      timestamp: timestamp || new Date().toISOString(),
      registeredByTeacherEmail: req.user!.email,
      registeredByTeacherName: req.user!.name,
    });

    res.status(201).json(record);
  });

  // Delete violation
  app.delete('/api/violations/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const success = deleteViolation(id, req.user!.email, req.user!.role);

    if (!success) {
      return res.status(403).json({
        error: 'Neturite teisės trinti šio įrašo (ištrinti gali tik įrašą sukūręs mokytojas arba administratorius).',
      });
    }

    res.json({ success: true, message: 'Įrašas sėkmingai ištrintas.' });
  });

  // Statistics & Analytics (supports periods and top limit: 10, 20, 30, or 0/all for all students)
  app.get('/api/stats', authMiddleware, (req, res) => {
    const period = (req.query.period as TimeFilterPeriod) || 'month';
    const limitQuery = req.query.limit as string;
    let limit = 10;
    if (limitQuery === '0' || limitQuery === 'all') {
      limit = 0; // 0 means return all recorded students
    } else if (limitQuery !== undefined) {
      const parsed = parseInt(limitQuery, 10);
      if (!isNaN(parsed)) limit = parsed;
    }
    const stats = calculateStatistics(period, limit);
    res.json(stats);
  });

  // Class Management Endpoints (Admin can edit, rename, add, delete classes)
  app.get('/api/classes', authMiddleware, (req, res) => {
    res.json(getClasses());
  });

  app.post('/api/classes', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali redaguoti klasių sąrašą.' });
    }
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Klasės pavadinimas negali būti tuščias.' });
    }
    const updated = addClass(name);
    res.status(201).json(updated);
  });

  app.put('/api/classes', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali redaguoti klasių sąrašą.' });
    }
    const { oldName, newName } = req.body;
    if (!oldName || !newName || !newName.trim()) {
      return res.status(400).json({ error: 'Nurodykite senąjį ir naująjį klasės pavadinimus.' });
    }
    const result = updateClass(oldName, newName);
    res.json(result);
  });

  app.delete('/api/classes/:name', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali trinti klases.' });
    }
    const { name } = req.params;
    const updated = deleteClass(name);
    res.json(updated);
  });

  app.post('/api/classes/reset', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali atkurti pradines klases.' });
    }
    const updated = resetClasses();
    res.json(updated);
  });

  // Locations management
  app.get('/api/locations', authMiddleware, (_req, res) => {
    const locations = getLocations();
    res.json(locations);
  });

  app.post('/api/locations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali pridėti naujas vietas.' });
    }
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Vietos pavadinimas negali būti tuščias.' });
    }
    const updated = addLocation(name);
    res.status(201).json(updated);
  });

  app.put('/api/locations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali redaguoti vietų sąrašą.' });
    }
    const { oldName, newName } = req.body;
    if (!oldName || !newName || !newName.trim()) {
      return res.status(400).json({ error: 'Nurodykite senąjį ir naująjį vietos pavadinimus.' });
    }
    const result = updateLocation(oldName, newName);
    res.json(result);
  });

  app.delete('/api/locations/:name', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali trinti vietas.' });
    }
    const { name } = req.params;
    const updated = deleteLocation(decodeURIComponent(name));
    res.json(updated);
  });

  app.post('/api/locations/reset', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali atkurti pradines vietas.' });
    }
    const updated = resetLocations();
    res.json(updated);
  });

  // Preset notes management
  app.get('/api/preset-notes', authMiddleware, (_req, res) => {
    const notes = getPresetNotes();
    res.json(notes);
  });

  app.post('/api/preset-notes', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali pridėti numatytąsias pastabas.' });
    }
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Pastabos tekstas negali būti tuščias.' });
    }
    const updated = addPresetNote(text);
    res.status(201).json(updated);
  });

  app.put('/api/preset-notes', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali redaguoti numatytąsias pastabas.' });
    }
    const { oldText, newText } = req.body;
    if (!oldText || !newText || !newText.trim()) {
      return res.status(400).json({ error: 'Nurodykite senąjį ir naująjį pastabos tekstus.' });
    }
    const result = updatePresetNote(oldText, newText);
    res.json(result);
  });

  app.delete('/api/preset-notes/:text', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali trinti numatytąsias pastabas.' });
    }
    const { text } = req.params;
    const updated = deletePresetNote(decodeURIComponent(text));
    res.json(updated);
  });

  app.post('/api/preset-notes/reset', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali atkurti pradines pastabas.' });
    }
    const updated = resetPresetNotes();
    res.json(updated);
  });

  // Student Interventions (Pedagogical Actions & Comments: 'atimtas telefonas', 'issikviesti tevai'...)
  app.get('/api/interventions', authMiddleware, (req, res) => {
    const { studentName, studentClass } = req.query;
    const list = getStudentInterventions(studentName as string, studentClass as string);
    res.json(list);
  });

  app.post('/api/interventions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { studentName, studentClass, action, note } = req.body;
    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ error: 'Mokinio vardas yra privalomas.' });
    }
    if (!action || !action.trim()) {
      return res.status(400).json({ error: 'Priemonė / veiksmas yra privalomas.' });
    }

    const record = addStudentIntervention({
      studentName: studentName.trim(),
      studentClass: studentClass?.trim() || '',
      action: action.trim(),
      note: note?.trim(),
      teacherEmail: req.user!.email,
      teacherName: req.user!.name,
    });

    res.status(201).json(record);
  });

  app.delete('/api/interventions/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const success = deleteStudentIntervention(id, req.user!.email, req.user!.role);
    if (!success) {
      return res.status(403).json({ error: 'Neturite teisės pašalinti šio komentaro / priemonės.' });
    }
    res.json({ success: true, message: 'Priemonė sėkmingai pašalinta.' });
  });

  // Whitelist management
  app.get('/api/whitelist', authMiddleware, (req, res) => {
    const list = getWhitelist();
    res.json(list);
  });

  app.post('/api/whitelist', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali pridėti naujus vartotojus į baltąjį sąrašą.' });
    }

    const { email, name, role } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Nurodykite teisingą el. pašto adresą.' });
    }

    const added = addToWhitelist({
      email,
      name: name || email.split('@')[0],
      role: role === 'admin' ? 'admin' : 'teacher',
      addedBy: req.user!.email,
    });

    res.status(201).json(added);
  });

  app.delete('/api/whitelist/:email', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Tik administratorius gali pašalinti vartotojus iš baltojo sąrašo.' });
    }

    const { email } = req.params;
    const success = removeFromWhitelist(email);
    if (!success) {
      return res.status(400).json({ error: 'Nepavyko pašalinti (pagrindinis administratorius negali būti pašalintas).' });
    }

    res.json({ success: true, message: 'Vartotojas sėkmingai pašalintas iš sąrašo.' });
  });

  // CSV Export for Google Sheets / Excel
  app.get('/api/export/csv', authMiddleware, (req, res) => {
    const records = getViolations();
    const headers = ['Data ir Laikas', 'Mokinys', 'Klase', 'Vieta', 'Pastaba / Komentaras', 'Mokytojo el. pastas', 'Mokytojo vardas'];
    const rows = records.map((r) => [
      `"${new Date(r.timestamp).toLocaleString('lt-LT')}"`,
      `"${r.studentName.replace(/"/g, '""')}"`,
      `"${r.studentClass}"`,
      `"${r.location.replace(/"/g, '""')}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`,
      `"${r.registeredByTeacherEmail}"`,
      `"${r.registeredByTeacherName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="telefonu_pazeidimai_tryskiai.csv"');
    res.send(csvContent);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
