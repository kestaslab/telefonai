import React, { useState, useEffect } from 'react';
import {
  Settings,
  GraduationCap,
  MapPin,
  FileText,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  School,
  Sparkles,
  Building,
  MessageSquare,
} from 'lucide-react';
import {
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
} from '../api';
import type { CurrentUser } from '../types';

export type SettingsSubTab = 'classes' | 'locations' | 'notes';

interface SettingsManagementProps {
  user: CurrentUser;
  initialSubTab?: SettingsSubTab;
  onClassesUpdated?: (classes: string[]) => void;
  onLocationsUpdated?: (locations: string[]) => void;
  onNotesUpdated?: (notes: string[]) => void;
}

export const SettingsManagement: React.FC<SettingsManagementProps> = ({
  user,
  initialSubTab = 'classes',
  onClassesUpdated,
  onLocationsUpdated,
  onNotesUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);

  // Common notification state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ----------------------------------------------------
  // 1. CLASSES STATE & HANDLERS
  // ----------------------------------------------------
  const [classes, setClasses] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [newClassName, setNewClassName] = useState('');
  const [addingClass, setAddingClass] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editClassNewName, setEditClassNewName] = useState('');
  const [savingClassEdit, setSavingClassEdit] = useState(false);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const list = await getClasses();
      setClasses(list);
      onClassesUpdated?.(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko gauti klasių sąrašo');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) {
      setErrorMsg('Įveskite klasės pavadinimą');
      return;
    }
    if (classes.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Klasė „${trimmed}“ jau egzistuoja sąraše`);
      return;
    }

    setAddingClass(true);
    setErrorMsg(null);
    try {
      const updated = await addClass(trimmed);
      setClasses(updated);
      onClassesUpdated?.(updated);
      setNewClassName('');
      setSuccessMsg(`Klasė „${trimmed}“ sėkmingai pridėta!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pridėti klasės');
    } finally {
      setAddingClass(false);
    }
  };

  const startEditClass = (cls: string) => {
    setEditingClass(cls);
    setEditClassNewName(cls);
    setErrorMsg(null);
  };

  const cancelEditClass = () => {
    setEditingClass(null);
    setEditClassNewName('');
  };

  const handleSaveEditClass = async (oldName: string) => {
    const trimmed = editClassNewName.trim();
    if (!trimmed) {
      setErrorMsg('Klasės pavadinimas negali būti tuščias');
      return;
    }
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      cancelEditClass();
      return;
    }

    setSavingClassEdit(true);
    setErrorMsg(null);
    try {
      const res = await updateClass(oldName, trimmed);
      setClasses(res.classes);
      onClassesUpdated?.(res.classes);
      cancelEditClass();
      setSuccessMsg(
        `Klasė sėkmingai pervadinta į „${trimmed}“${
          res.updatedCount > 0 ? ` (atnaujinta ${res.updatedCount} pažeidimų įrašų)` : ''
        }!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pervadinti klasės');
    } finally {
      setSavingClassEdit(false);
    }
  };

  const handleDeleteClass = async (cls: string) => {
    if (!window.confirm(`Ar tikrai norite pašalinti klasę „${cls}“ iš pasirinkimo sąrašo?`)) {
      return;
    }
    setErrorMsg(null);
    try {
      const updated = await deleteClass(cls);
      setClasses(updated);
      onClassesUpdated?.(updated);
      setSuccessMsg(`Klasė „${cls}“ pašalinta.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pašalinti klasės');
    }
  };

  const handleResetClasses = async () => {
    if (
      !window.confirm(
        'Ar tikrai norite atstatyti pradines Tryškių Lazdynų Pelėdos gimnazijos klases (1-8 ir I-IV po vieną)?'
      )
    ) {
      return;
    }
    setErrorMsg(null);
    try {
      const updated = await resetClasses();
      setClasses(updated);
      onClassesUpdated?.(updated);
      setSuccessMsg('Atstatytos pradinės klasės (1-8 ir I-IV).');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko atstatyti klasių');
    }
  };

  const handleApplySuffixPresets = async (letters: string[]) => {
    if (
      !window.confirm(
        `Ar norite sugeneruoti klases su raidėmis (${letters.join(', ')}) klasėms 5-8 ir I-IV?`
      )
    ) {
      return;
    }
    setErrorMsg(null);
    try {
      const baseLevels = ['1', '2', '3', '4', '5', '6', '7', '8', 'I', 'II', 'III', 'IV'];
      let currentList = [...classes];

      for (const lvl of baseLevels) {
        if (['5', '6', '7', '8'].includes(lvl)) {
          for (const ltr of letters) {
            const variant = `${lvl}${ltr}`;
            if (!currentList.some((c) => c.toLowerCase() === variant.toLowerCase())) {
              currentList = await addClass(variant);
            }
          }
        }
      }
      setClasses(currentList);
      onClassesUpdated?.(currentList);
      setSuccessMsg('Klasės su raidėmis sėkmingai pridėtos!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Klaida pridedant klasių variantus');
    }
  };

  // ----------------------------------------------------
  // 2. LOCATIONS STATE & HANDLERS
  // ----------------------------------------------------
  const [locations, setLocations] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [newLocationName, setNewLocationName] = useState('');
  const [addingLocation, setAddingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editLocationNewName, setEditLocationNewName] = useState('');
  const [savingLocationEdit, setSavingLocationEdit] = useState(false);

  const loadLocations = async () => {
    setLoadingLocations(true);
    try {
      const list = await getLocations();
      setLocations(list);
      onLocationsUpdated?.(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko gauti vietų sąrašo');
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLocationName.trim();
    if (!trimmed) {
      setErrorMsg('Įveskite vietos ar kabineto pavadinimą');
      return;
    }
    if (locations.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Vieta „${trimmed}“ jau egzistuoja sąraše`);
      return;
    }

    setAddingLocation(true);
    setErrorMsg(null);
    try {
      const updated = await addLocation(trimmed);
      setLocations(updated);
      onLocationsUpdated?.(updated);
      setNewLocationName('');
      setSuccessMsg(`Vieta „${trimmed}“ sėkmingai pridėta!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pridėti vietos');
    } finally {
      setAddingLocation(false);
    }
  };

  const startEditLocation = (loc: string) => {
    setEditingLocation(loc);
    setEditLocationNewName(loc);
    setErrorMsg(null);
  };

  const cancelEditLocation = () => {
    setEditingLocation(null);
    setEditLocationNewName('');
  };

  const handleSaveEditLocation = async (oldName: string) => {
    const trimmed = editLocationNewName.trim();
    if (!trimmed) {
      setErrorMsg('Vietos pavadinimas negali būti tuščias');
      return;
    }
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      cancelEditLocation();
      return;
    }

    setSavingLocationEdit(true);
    setErrorMsg(null);
    try {
      const res = await updateLocation(oldName, trimmed);
      setLocations(res.locations);
      onLocationsUpdated?.(res.locations);
      cancelEditLocation();
      setSuccessMsg(
        `Vieta sėkmingai atnaujinta į „${trimmed}“${
          res.updatedCount > 0 ? ` (atnaujinta ${res.updatedCount} pažeidimų įrašų)` : ''
        }!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko atnaujinti vietos');
    } finally {
      setSavingLocationEdit(false);
    }
  };

  const handleDeleteLocation = async (loc: string) => {
    if (!window.confirm(`Ar tikrai norite pašalinti vietą „${loc}“ iš greito pasirinkimo sąrašo?`)) {
      return;
    }
    setErrorMsg(null);
    try {
      const updated = await deleteLocation(loc);
      setLocations(updated);
      onLocationsUpdated?.(updated);
      setSuccessMsg(`Vieta „${loc}“ pašalinta.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pašalinti vietos');
    }
  };

  const handleResetLocations = async () => {
    if (
      !window.confirm(
        'Ar tikrai norite atstatyti pradines numatytąsias mokyklos vietas (kabinetai, koridoriai, valgykla, sporto salė...)?'
      )
    ) {
      return;
    }
    setErrorMsg(null);
    try {
      const updated = await resetLocations();
      setLocations(updated);
      onLocationsUpdated?.(updated);
      setSuccessMsg('Atstatytos pradinės mokyklos vietos.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko atstatyti vietų');
    }
  };

  // ----------------------------------------------------
  // 3. PRESET NOTES STATE & HANDLERS
  // ----------------------------------------------------
  const [presetNotes, setPresetNotes] = useState<string[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteNewText, setEditNoteNewText] = useState('');
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);

  const loadPresetNotes = async () => {
    setLoadingNotes(true);
    try {
      const list = await getPresetNotes();
      setPresetNotes(list);
      onNotesUpdated?.(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko gauti numatytųjų pastabų sąrašo');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddPresetNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNoteText.trim();
    if (!trimmed) {
      setErrorMsg('Įveskite pastabos tekstą');
      return;
    }
    if (presetNotes.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Ši pastaba jau egzistuoja sąraše`);
      return;
    }

    setAddingNote(true);
    setErrorMsg(null);
    try {
      const updated = await addPresetNote(trimmed);
      setPresetNotes(updated);
      onNotesUpdated?.(updated);
      setNewNoteText('');
      setSuccessMsg(`Pastaba sėkmingai pridėta į greito pasirinkimo sąrašą!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pridėti pastabos');
    } finally {
      setAddingNote(false);
    }
  };

  const startEditNote = (noteText: string) => {
    setEditingNote(noteText);
    setEditNoteNewText(noteText);
    setErrorMsg(null);
  };

  const cancelEditNote = () => {
    setEditingNote(null);
    setEditNoteNewText('');
  };

  const handleSaveEditNote = async (oldText: string) => {
    const trimmed = editNoteNewText.trim();
    if (!trimmed) {
      setErrorMsg('Pastabos tekstas negali būti tuščias');
      return;
    }
    if (trimmed.toLowerCase() === oldText.toLowerCase()) {
      cancelEditNote();
      return;
    }

    setSavingNoteEdit(true);
    setErrorMsg(null);
    try {
      const res = await updatePresetNote(oldText, trimmed);
      setPresetNotes(res.presetNotes);
      onNotesUpdated?.(res.presetNotes);
      cancelEditNote();
      setSuccessMsg(
        `Pastaba sėkmingai atnaujinta${
          res.updatedCount > 0 ? ` (atnaujinta ${res.updatedCount} pažeidimų įrašų)` : ''
        }!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko atnaujinti pastabos');
    } finally {
      setSavingNoteEdit(false);
    }
  };

  const handleDeleteNote = async (noteText: string) => {
    if (!window.confirm(`Ar tikrai norite pašalinti šią pastabą iš greito pasirinkimo sąrašo?`)) {
      return;
    }
    setErrorMsg(null);
    try {
      const updated = await deletePresetNote(noteText);
      setPresetNotes(updated);
      onNotesUpdated?.(updated);
      setSuccessMsg(`Pastaba pašalinta.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pašalinti pastabos');
    }
  };

  const handleResetPresetNotes = async () => {
    if (
      !window.confirm(
        'Ar tikrai norite atstatyti pradines numatytąsias pažeidimų pastabas (žaidė žaidimus, naršė TikTok, atsisakė įdėti telefoną į dėžutę...)?'
      )
    ) {
      return;
    }
    setErrorMsg(null);
    try {
      const updated = await resetPresetNotes();
      setPresetNotes(updated);
      onNotesUpdated?.(updated);
      setSuccessMsg('Atstatytos pradinės numatytosios pastabos.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko atstatyti pastabų');
    }
  };

  // Initial load
  useEffect(() => {
    loadClasses();
    loadLocations();
    loadPresetNotes();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6" id="settings-management-view">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Sistemos Nustatymai
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                  Administratoriaus sritis
                </span>
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Konfigūruokite klasių sąrašus, mokyklos patalpas ir numatytųjų pastabų šablonus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Mokykla: <strong>Tryškių Lazdynų Pelėdos gimnazija</strong>
            </span>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100" id="settings-tabs-bar">
          <button
            id="subtab-classes-btn"
            onClick={() => {
              setActiveSubTab('classes');
              setErrorMsg(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'classes'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Klasių nustatymai</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'classes' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {classes.length}
            </span>
          </button>

          <button
            id="subtab-locations-btn"
            onClick={() => {
              setActiveSubTab('locations');
              setErrorMsg(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'locations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Vietų koregavimas</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'locations' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {locations.length}
            </span>
          </button>

          <button
            id="subtab-notes-btn"
            onClick={() => {
              setActiveSubTab('notes');
              setErrorMsg(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'notes'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Numatytųjų pastabų koregavimas</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeSubTab === 'notes' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {presetNotes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. KLASIŲ NUSTATYMAI SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'classes' && (
        <div className="space-y-6" id="classes-settings-panel">
          {/* Add New Class Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-amber-600" />
              Pridėti naują klasę
            </h2>
            <form onSubmit={handleAddClass} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="new-class-input"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Pvz.: 5a, 5b, 7c, IIIa, IVb..."
                  maxLength={15}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                id="add-class-btn"
                disabled={addingClass || !newClassName.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pridėti klasę</span>
              </button>
            </form>

            {/* Quick Suffix Presets */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Greiti šablonai:
              </span>
              <button
                type="button"
                onClick={() => handleApplySuffixPresets(['a', 'b'])}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Generuoti su raidėmis (pvz. 5a, 5b, 6a, 6b...)
              </button>
              <button
                type="button"
                onClick={handleResetClasses}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                title="Atstatyti standartinį sąrašą 1-8 ir I-IV"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Atkurti pradines (1-8, I-IV)</span>
              </button>
            </div>
          </div>

          {/* Current Classes List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-5 h-5 text-amber-600" />
                  Mokyklos klasių sąrašas ({classes.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Šios klasės automatiškai pateikiamos mokytojams registruojant pažeidimus bei žurnalo filtruose.
                </p>
              </div>
            </div>

            {loadingClasses ? (
              <div className="py-8 text-center text-slate-500 text-sm">Kraunamas klasių sąrašas...</div>
            ) : classes.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Klasių sąrašas tuščias. Spustelėkite „Atkurti pradines klases“.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {classes.map((cls) => {
                  const isEditing = editingClass === cls;

                  return (
                    <div
                      key={cls}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isEditing
                          ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editClassNewName}
                            onChange={(e) => setEditClassNewName(e.target.value)}
                            maxLength={15}
                            autoFocus
                            className="w-full px-2 py-1 text-sm font-bold bg-white border border-amber-300 rounded focus:ring-1 focus:ring-amber-500"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSaveEditClass(cls)}
                              disabled={savingClassEdit}
                              className="flex-1 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer"
                            >
                              Išsaugoti
                            </button>
                            <button
                              onClick={cancelEditClass}
                              className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-slate-800 tracking-tight">
                              {cls} klasė
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Aktyvi"></span>
                          </div>

                          <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-slate-200/60">
                            <button
                              onClick={() => startEditClass(cls)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              title={`Pervadinti klasę „${cls}“`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title={`Pašalinti klasę „${cls}“`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIETŲ KOREGAVIMAS SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'locations' && (
        <div className="space-y-6" id="locations-settings-panel">
          {/* Add New Location Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-blue-600" />
              Pridėti naują mokyklos vietą ar kabinetą
            </h2>
            <form onSubmit={handleAddLocation} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="new-location-input"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Pvz.: Kabinetas 304 (Biologija), Aktų salė, Chemijos laboratorija..."
                  maxLength={60}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                id="add-location-btn"
                disabled={addingLocation || !newLocationName.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pridėti vietą</span>
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs">
              <span className="text-slate-500">
                Patarimas: nurodykite kabineto numerį arba zonos pavadinimą, kad mokytojams registruoti būtų lengva vienu paspaudimu.
              </span>
              <button
                type="button"
                onClick={handleResetLocations}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Atstatyti standartines patalpų vietas"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Atkurti pradines vietas</span>
              </button>
            </div>
          </div>

          {/* Current Locations List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Mokyklos patalpų ir zonų sąrašas ({locations.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Šios vietos pateikiamos mokytojams greitam pasirinkimui registruojant pažeidimą. Pervadinus vietą, atitinkamai atsinaujins ir visi esami įrašai.
                </p>
              </div>
            </div>

            {loadingLocations ? (
              <div className="py-8 text-center text-slate-500 text-sm">Kraunamas vietų sąrašas...</div>
            ) : locations.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Vietų sąrašas tuščias. Spustelėkite „Atkurti pradines vietas“.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {locations.map((loc) => {
                  const isEditing = editingLocation === loc;

                  return (
                    <div
                      key={loc}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isEditing
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editLocationNewName}
                            onChange={(e) => setEditLocationNewName(e.target.value)}
                            maxLength={60}
                            autoFocus
                            className="w-full px-2.5 py-1.5 text-sm font-semibold bg-white border border-blue-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSaveEditLocation(loc)}
                              disabled={savingLocationEdit}
                              className="flex-1 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                            >
                              Išsaugoti
                            </button>
                            <button
                              onClick={cancelEditLocation}
                              className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <span className="text-sm font-semibold text-slate-800 leading-snug">
                                {loc}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-slate-200/60">
                            <button
                              onClick={() => startEditLocation(loc)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title={`Pervadinti vietą „${loc}“`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(loc)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title={`Pašalinti vietą „${loc}“`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NUMATYTŲJŲ PASTABŲ KOREGAVIMAS SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'notes' && (
        <div className="space-y-6" id="notes-settings-panel">
          {/* Add New Preset Note Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-emerald-600" />
              Pridėti naują numatytąją pastabą / komentarą
            </h2>
            <form onSubmit={handleAddPresetNote} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="new-note-input"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Pvz.: Žaidė žaidimus, Filmavo be sutikimo, Atsisakė atiduoti telefoną..."
                  maxLength={120}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                id="add-note-btn"
                disabled={addingNote || !newNoteText.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pridėti pastabą</span>
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs">
              <span className="text-slate-500">
                Šie šablonai rodomi mokytojams registravimo formoje kaip greiti mygtukai – vienu paspaudimu įrašo tekstą į komentaro lauką.
              </span>
              <button
                type="button"
                onClick={handleResetPresetNotes}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Atstatyti pradines pastabas"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Atkurti pradines pastabas</span>
              </button>
            </div>
          </div>

          {/* Current Preset Notes List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Numatytosios pastabos ir komentarų šablonai ({presetNotes.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Galite keisti tekstus, šalinti neaktualius arba pridėti specifinius jūsų mokyklos tvarkos taisyklių punktus.
                </p>
              </div>
            </div>

            {loadingNotes ? (
              <div className="py-8 text-center text-slate-500 text-sm">Kraunamas pastabų sąrašas...</div>
            ) : presetNotes.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Pastabų sąrašas tuščias. Spustelėkite „Atkurti pradines pastabas“.
              </div>
            ) : (
              <div className="space-y-2.5">
                {presetNotes.map((noteText, idx) => {
                  const isEditing = editingNote === noteText;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isEditing
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editNoteNewText}
                            onChange={(e) => setEditNoteNewText(e.target.value)}
                            maxLength={120}
                            autoFocus
                            className="w-full px-3 py-1.5 text-sm font-medium bg-white border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                          />
                          <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto">
                            <button
                              onClick={() => handleSaveEditNote(noteText)}
                              disabled={savingNoteEdit}
                              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                            >
                              Išsaugoti
                            </button>
                            <button
                              onClick={cancelEditNote}
                              className="px-2.5 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                            >
                              Atšaukti
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                              {noteText}
                            </span>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 shrink-0">
                            <button
                              onClick={() => startEditNote(noteText)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Redaguoti šią pastabą"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(noteText)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Pašalinti šią pastabą"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
