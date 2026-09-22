import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  School,
  Sparkles,
} from 'lucide-react';
import { getClasses, addClass, updateClass, deleteClass, resetClasses } from '../api';
import type { CurrentUser } from '../types';

interface ClassManagementProps {
  user: CurrentUser;
  onClassesUpdated?: (classes: string[]) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({ user, onClassesUpdated }) => {
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add class state
  const [newClassName, setNewClassName] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit / Rename class state
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editNewName, setEditNewName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const list = await getClasses();
      setClasses(list);
      onClassesUpdated?.(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko gauti klasių sąrašo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
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

    setAdding(true);
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
      setAdding(false);
    }
  };

  const startEdit = (cls: string) => {
    setEditingClass(cls);
    setEditNewName(cls);
    setErrorMsg(null);
  };

  const cancelEdit = () => {
    setEditingClass(null);
    setEditNewName('');
  };

  const handleSaveEdit = async (oldName: string) => {
    const trimmed = editNewName.trim();
    if (!trimmed) {
      setErrorMsg('Klasės pavadinimas negali būti tuščias');
      return;
    }
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      cancelEdit();
      return;
    }

    setSavingEdit(true);
    setErrorMsg(null);
    try {
      const res = await updateClass(oldName, trimmed);
      setClasses(res.classes);
      onClassesUpdated?.(res.classes);
      cancelEdit();
      setSuccessMsg(
        `Klasė sėkmingai pervadinta į „${trimmed}“${
          res.updatedCount > 0 ? ` (atnaujinta ${res.updatedCount} pažeidimų įrašų)` : ''
        }!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pervadinti klasės');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (cls: string) => {
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

  const handleReset = async () => {
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
      setSuccessMsg('Klasių sąrašas sėkmingai atstatytas į pradines reikšmes (1–8 ir I–IV).');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko atstatyti klasių');
    }
  };

  // Quick preset chips if user wants to add parallel letters (e.g. 5a, 5b)
  const quickSuggestions = ['5a', '5b', '6a', '6b', '7a', '7b', '8a', '8b', 'Ia', 'Ib'].filter(
    (s) => !classes.some((c) => c.toLowerCase() === s.toLowerCase())
  );

  return (
    <div id="class-management-container" className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Mokyklos klasių sąrašo valdymas
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  Administratorius
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Konfigūruokite klases, kurios bus rodomos mokytojams registruojant pažeidimus bei statistikos filtruose.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-reset-classes"
            onClick={handleReset}
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200 shrink-0"
            title="Atstatyti standartines 1-8 ir I-IV klases"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Atstatyti pradines (1–8, I–IV)</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Add Class Form */}
        <form onSubmit={handleAdd} className="mt-5 pt-5 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Pridėti naują klasę arba paralelinę grupę (pvz., 5a, 5b, IVg)
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                id="input-new-class"
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Pvz.: 5a, 5b, 8b, I a, IV g..."
                maxLength={10}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
            <button
              id="btn-add-class"
              type="submit"
              disabled={adding || !newClassName.trim()}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{adding ? 'Pridedama...' : 'Pridėti klasę'}</span>
            </button>
          </div>

          {/* Quick chips if available */}
          {quickSuggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="flex items-center space-x-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Greitas pridėjimas:</span>
              </span>
              {quickSuggestions.slice(0, 6).map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => setNewClassName(suggested)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-md transition text-slate-700 font-semibold"
                >
                  +{suggested}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Active Classes Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <School className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Esamos klasės sistemoje ({classes.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Spustelėkite pieštuko piktogramą klasės pervadinimui
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Kraunamas klasių sąrašas...</div>
        ) : classes.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">
            Klasių sąrašas tuščias. Spustelėkite „Atstatyti pradines“, kad įkeltumėte standartines 1–8 ir I–IV klases.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {classes.map((cls) => {
              const isEditing = editingClass === cls;

              if (isEditing) {
                return (
                  <div
                    key={cls}
                    className="p-3 bg-emerald-50/80 border-2 border-emerald-500 rounded-xl shadow-xs space-y-2 col-span-2 sm:col-span-1"
                  >
                    <div className="text-xs font-bold text-emerald-800">Pervadinti klasę:</div>
                    <input
                      type="text"
                      value={editNewName}
                      onChange={(e) => setEditNewName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cls)}
                        disabled={savingEdit || !editNewName.trim()}
                        className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition"
                      >
                        {savingEdit ? 'Saugo...' : 'Išsaugoti'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-semibold transition"
                      >
                        Atšaukti
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cls}
                  className="group flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200 rounded-xl transition duration-150"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-900 font-bold text-sm rounded-lg shadow-2xs">
                      {cls}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {cls.includes('kl') ? cls : `${cls} klasė`}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => startEdit(cls)}
                      title={`Pervadinti klasę „${cls}“`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cls)}
                      title={`Pašalinti klasę „${cls}“`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700 flex items-center space-x-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pervadinimo informacija:</span>
          </div>
          <p>
            Jei pervadinsite klasę (pvz., iš <strong>8</strong> į <strong>8a</strong>), visi iki šiol žurnale užregistruoti šios klasės pažeidimai bus automatiškai atnaujinti nauju klasės pavadinimu, tad statistika išliks vientisa.
          </p>
        </div>
      </div>
    </div>
  );
};
