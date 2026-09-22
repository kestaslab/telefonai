import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  CheckCircle,
  Clock,
  MapPin,
  User,
  GraduationCap,
  FileText,
  AlertCircle,
  AlertTriangle,
  Plus,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { createViolation, getAutocomplete, getClasses, getLocations, getPresetNotes } from '../api';
import type { CurrentUser, AutocompleteStudent } from '../types';

interface ViolationFormProps {
  user: CurrentUser;
  onSuccess: () => void;
  onOpenSettings?: (subTab?: 'classes' | 'locations' | 'notes') => void;
  onOpenClasses?: () => void; // for backward compatibility
}

const COMMON_LOCATIONS = [
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

const QUICK_NOTES = [
  'Žaidė žaidimus pamokos metu',
  'Naršė TikTok / Instagram',
  'Susirašinėjo telefonu per pamoką',
  'Telefonas skambėjo kontrolinio metu',
  'Atsisakė įdėti telefoną į dėžutę',
  'Filmavo be leidimo koridoriuje',
  'Klausėsi muzikos su ausinėmis',
];

function getLocalDateTimeForInput(d = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

function normalizeText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getWords(str: string): string[] {
  return normalizeText(str)
    .replace(/[,.-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function toTitleCase(str: string): string {
  return (str || '')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const ViolationForm: React.FC<ViolationFormProps> = ({ user, onSuccess, onOpenSettings, onOpenClasses }) => {
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [dateTime, setDateTime] = useState(getLocalDateTimeForInput());
  const [location, setLocation] = useState('Kabinetas 205 (Matematika)');
  const [customLocation, setCustomLocation] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic classes loaded from server (defaults to 1-8, I-IV)
  const [availableClasses, setAvailableClasses] = useState<string[]>([
    '1', '2', '3', '4', '5', '6', '7', '8', 'I', 'II', 'III', 'IV'
  ]);

  // Dynamic locations and preset notes
  const [availableLocations, setAvailableLocations] = useState<string[]>(COMMON_LOCATIONS);
  const [availablePresetNotes, setAvailablePresetNotes] = useState<string[]>(QUICK_NOTES);

  // Autocomplete data & deduplication
  const [knownStudents, setKnownStudents] = useState<AutocompleteStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<AutocompleteStudent[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateWarningStudent, setDuplicateWarningStudent] = useState<AutocompleteStudent | null>(null);
  const studentInputRef = useRef<HTMLInputElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    getAutocomplete()
      .then((data) => {
        if (data.students) setKnownStudents(data.students);
        if (data.classes && data.classes.length > 0) {
          setAvailableClasses(data.classes);
        }
      })
      .catch((err) => console.error('Error fetching autocomplete:', err));

    getClasses()
      .then((cls) => {
        if (cls && cls.length > 0) setAvailableClasses(cls);
      })
      .catch(() => {});

    getLocations()
      .then((locs) => {
        if (locs && locs.length > 0) {
          setAvailableLocations(locs);
          if (!locs.includes(location) && locs[0]) {
            setLocation(locs[0]);
          }
        }
      })
      .catch(() => {});

    getPresetNotes()
      .then((notes) => {
        if (notes && notes.length > 0) setAvailablePresetNotes(notes);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsBoxRef.current &&
        !suggestionsBoxRef.current.contains(event.target as Node) &&
        studentInputRef.current &&
        !studentInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStudentNameChange = (val: string) => {
    setStudentName(val);
    setErrorMessage(null);

    if (!val.trim()) {
      setFilteredStudents([]);
      setShowSuggestions(false);
      setDuplicateWarningStudent(null);
      return;
    }

    const inputWords = getWords(val);
    const inputSortedKey = inputWords.slice().sort().join(' ');
    const inputNorm = normalizeText(val);

    // 1. Search for matches
    const matches = knownStudents.filter((s) => {
      const sWords = getWords(s.name);
      const sNorm = normalizeText(s.name);

      // Direct substring match
      if (sNorm.includes(inputNorm)) return true;

      // Word-by-word match (e.g. "petrauskas" or "lukas")
      if (inputWords.length > 0 && inputWords.every((iw) => sWords.some((sw) => sw.startsWith(iw) || sw.includes(iw)))) {
        return true;
      }

      return false;
    });

    setFilteredStudents(matches);
    setShowSuggestions(matches.length > 0);

    // 2. Check for reversed name or exact duplicate warning (e.g., typed "petrauskas lukas" while "Lukas Petrauskas" exists)
    const duplicate = knownStudents.find((s) => {
      const sWords = getWords(s.name);
      if (sWords.length >= 2 && inputWords.length >= 2) {
        const sSortedKey = sWords.slice().sort().join(' ');
        // If words match regardless of order, and the typed string is different from canonical form
        if (sSortedKey === inputSortedKey && val.trim() !== s.name) {
          return true;
        }
      }
      return false;
    });

    setDuplicateWarningStudent(duplicate || null);
  };

  const selectStudentSuggestion = (s: AutocompleteStudent) => {
    setStudentName(s.name);
    if (s.class) {
      setStudentClass(s.class);
    }
    setShowSuggestions(false);
    setDuplicateWarningStudent(null);
  };

  const handleBlurStudentName = () => {
    // Auto-capitalize name to Title Case on blur if typed in all lowercase
    if (studentName.trim() && studentName === studentName.toLowerCase()) {
      setStudentName(toTitleCase(studentName.trim()));
    }
  };

  const handleSetCurrentTime = () => {
    setDateTime(getLocalDateTimeForInput());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = toTitleCase(studentName.trim());

    if (!cleanName) {
      setErrorMessage('Prašome įvesti mokinio vardą ir pavardę.');
      studentInputRef.current?.focus();
      return;
    }
    if (!studentClass.trim()) {
      setErrorMessage('Prašome pasirinkti arba įvesti mokinio klasę.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const finalLocation = location === 'Kita' && customLocation.trim() ? customLocation.trim() : location;

    try {
      const record = await createViolation({
        studentName: cleanName,
        studentClass: studentClass.trim(),
        location: finalLocation,
        note: note.trim(),
        timestamp: new Date(dateTime).toISOString(),
      });

      setSuccessToast(`Pažeidimas sėkmingai užregistruotas moksleiviui ${record.studentName} (${record.studentClass})!`);

      // Reset form fields
      setStudentName('');
      setNote('');
      setDateTime(getLocalDateTimeForInput());
      setDuplicateWarningStudent(null);

      // Refresh autocomplete cache & parent
      loadData();
      onSuccess();

      setTimeout(() => {
        setSuccessToast(null);
      }, 4500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Nepavyko išsaugoti pažeidimo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-3 sm:px-6" id="violation-form-container">
      {/* Mobile Title Banner */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">
          <Smartphone className="w-4 h-4 text-amber-600" />
          <span>Greitasis įvedimas</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Registruoti telefono naudojimo pažeidimą
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Užpildykite informaciją apie taisykles pažeidusį mokinį. Sistema automatiškai padeda išvengti vardo dubliavimosi.
        </p>
      </div>

      {successToast && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-3 text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-semibold">{successToast}</div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-6 space-y-5">
        {/* 1. Student Name with Smart Autocomplete & Deduplication */}
        <div className="relative">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Mokinio vardas ir pavardė <span className="text-red-500 ml-0.5">*</span>
            </span>
            <span className="text-[11px] font-normal lowercase text-slate-400">
              ieško žurnale, apsaugo nuo dublikatų
            </span>
          </label>
          <div className="relative">
            <input
              ref={studentInputRef}
              id="student-name-input"
              type="text"
              required
              autoComplete="off"
              placeholder="pvz., Lukas Petrauskas"
              value={studentName}
              onChange={(e) => handleStudentNameChange(e.target.value)}
              onBlur={handleBlurStudentName}
              onFocus={() => {
                if (studentName.trim() && filteredStudents.length > 0) setShowSuggestions(true);
              }}
              className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Duplicate / Reversed Name Warning Alert */}
          {duplicateWarningStudent && (
            <div className="mt-2 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-start sm:items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-medium">Rastas mokinys žurnale: </span>
                  <strong className="text-slate-900 font-bold">{duplicateWarningStudent.name}</strong>{' '}
                  <span className="bg-amber-200/80 text-amber-900 font-semibold px-1.5 py-0.5 rounded">
                    {duplicateWarningStudent.class} kl.
                  </span>
                  {duplicateWarningStudent.count > 0 && (
                    <span className="text-slate-600 ml-1">({duplicateWarningStudent.count} pažeidimai)</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => selectStudentSuggestion(duplicateWarningStudent)}
                className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition shadow-2xs shrink-0 cursor-pointer"
              >
                Pasirinkti šį mokinį
              </button>
            </div>
          )}

          {/* Autocomplete dropdown suggestions */}
          {showSuggestions && filteredStudents.length > 0 && (
            <div
              ref={suggestionsBoxRef}
              className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto py-1 divide-y divide-slate-100"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
                <span>Rasti mokiniai žurnale ({filteredStudents.length})</span>
                <span className="text-slate-400 font-normal">Spustelėkite pasirinkimui</span>
              </div>
              {filteredStudents.map((s, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => selectStudentSuggestion(s)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50/80 flex items-center justify-between text-sm transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 group-hover:text-amber-900">{s.name}</span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-md">
                      {s.class} kl.
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium group-hover:text-amber-700">
                    {s.count ? `${s.count} pažeidimai` : 'Užregistruotas'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Class Selection (Dynamic from DB) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <GraduationCap className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Klasė <span className="text-red-500 ml-0.5">*</span>
            </label>
            {user.role === 'admin' && (onOpenSettings || onOpenClasses) && (
              <button
                type="button"
                onClick={() => (onOpenSettings ? onOpenSettings('classes') : onOpenClasses?.())}
                className="text-xs text-slate-500 hover:text-amber-700 flex items-center space-x-1 font-semibold transition cursor-pointer"
                title="Administruoti mokyklos klasių sąrašą"
              >
                <Settings className="w-3 h-3 text-amber-600" />
                <span>Tvarkyti klases</span>
              </button>
            )}
          </div>

          {/* Quick pill selector for one-tap on mobile/desktop */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {availableClasses.map((cls) => (
              <button
                type="button"
                key={cls}
                onClick={() => setStudentClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  studentClass.toLowerCase() === cls.toLowerCase()
                    ? 'bg-amber-500 text-white shadow-xs scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="student-class-input"
              type="text"
              placeholder="Arba įrašykite klasę rankiniu būdu (pvz., 5a, 8b)"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* 3. Date & Time */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Data ir laikas <span className="text-red-500 ml-0.5">*</span>
            </label>
            <button
              type="button"
              onClick={handleSetCurrentTime}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center cursor-pointer"
            >
              Nustatyti „Dabar“
            </button>
          </div>
          <input
            id="violation-datetime-input"
            type="datetime-local"
            required
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono text-slate-800"
          />
        </div>

        {/* 4. Location */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Vieta
            </label>
            {user.role === 'admin' && onOpenSettings && (
              <button
                type="button"
                onClick={() => onOpenSettings('locations')}
                className="text-xs text-slate-500 hover:text-blue-700 flex items-center space-x-1 font-semibold transition cursor-pointer"
                title="Administruoti mokyklos patalpas ir vietas"
              >
                <Settings className="w-3 h-3 text-blue-600" />
                <span>Koreguoti vietas</span>
              </button>
            )}
          </div>
          <select
            id="violation-location-select"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium"
          >
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
            <option value="Kita">Kita (įrašyti ranka...)</option>
          </select>

          {location === 'Kita' && (
            <input
              type="text"
              placeholder="Nurodykite vietą (pvz., Prie mokyklos įėjimo)"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              className="mt-2 w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          )}
        </div>

        {/* 5. Note / Comment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Pastaba / Komentaras <span className="text-slate-400 font-normal lowercase ml-1">(neprivaloma)</span>
            </label>
            {user.role === 'admin' && onOpenSettings && (
              <button
                type="button"
                onClick={() => onOpenSettings('notes')}
                className="text-xs text-slate-500 hover:text-emerald-700 flex items-center space-x-1 font-semibold transition cursor-pointer"
                title="Administruoti numatytųjų pastabų šablonus"
              >
                <Settings className="w-3 h-3 text-emerald-600" />
                <span>Koreguoti pastabas</span>
              </button>
            )}
          </div>

          {/* Quick note chips from dynamic preset notes */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {availablePresetNotes.map((qn, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setNote((prev) => (prev ? `${prev}; ${qn}` : qn))}
                className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 rounded-md text-xs transition-colors flex items-center cursor-pointer"
              >
                <Plus className="w-3 h-3 mr-0.5 text-slate-400" />
                {qn}
              </button>
            ))}
          </div>

          <textarea
            id="violation-note-textarea"
            rows={2}
            placeholder="pvz., Žaidė Brawl Stars pamokos metu, nereagavo į prašymą padėti telefoną..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
          />
        </div>

        {/* Registered by info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
          <span>Užregistruos mokytojas(-a):</span>
          <span className="font-semibold text-slate-800">{user.name}</span>
        </div>

        {/* Submit button */}
        <button
          id="submit-violation-btn"
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <Smartphone className="w-5 h-5" />
          <span>{submitting ? 'Registruojama...' : 'Registruoti pažeidimą'}</span>
        </button>
      </form>
    </div>
  );
};

