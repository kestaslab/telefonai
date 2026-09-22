import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Filter, Trash2, Download, Calendar, GraduationCap, MapPin, 
  User, RefreshCw, AlertCircle, FileSpreadsheet, Check, Archive, FileText, ChevronDown, CheckCircle
} from 'lucide-react';
import type { CurrentUser, ViolationRecord } from '../types';
import { deleteViolation, archiveViolation, getClasses } from '../api';
import { exportToExcel, exportToWord } from '../utils/exportUtils';
import { SchoolLogo } from './SchoolLogo';

interface ViolationsTableProps {
  user: CurrentUser;
  records: ViolationRecord[];
  loading: boolean;
  onRefresh: () => void;
  onGoToArchive?: () => void;
}

export const ViolationsTable: React.FC<ViolationsTableProps> = ({
  user,
  records,
  loading,
  onRefresh,
  onGoToArchive,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [configuredClasses, setConfiguredClasses] = useState<string[]>([]);

  useEffect(() => {
    getClasses()
      .then(setConfiguredClasses)
      .catch(() => {});
  }, []);

  // Extract unique classes
  const classesList = useMemo(() => {
    const s = new Set<string>(configuredClasses);
    records.forEach((r) => {
      if (r.studentClass) s.add(r.studentClass);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [records, configuredClasses]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesStudent = r.studentName.toLowerCase().includes(q);
        const matchesNote = (r.note || '').toLowerCase().includes(q);
        const matchesTeacher = r.registeredByTeacherName.toLowerCase().includes(q);
        if (!matchesStudent && !matchesNote && !matchesTeacher) return false;
      }

      // Class filter
      if (selectedClass !== 'all') {
        if (r.studentClass.toLowerCase() !== selectedClass.toLowerCase()) return false;
      }

      // Date range filter
      if (dateRange !== 'all') {
        const recordDate = new Date(r.timestamp);
        const now = new Date();
        if (dateRange === 'today') {
          const isToday =
            recordDate.getDate() === now.getDate() &&
            recordDate.getMonth() === now.getMonth() &&
            recordDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateRange === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (recordDate < oneWeekAgo) return false;
        } else if (dateRange === 'month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (recordDate < oneMonthAgo) return false;
        }
      }

      return true;
    });
  }, [records, searchTerm, selectedClass, dateRange]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteViolation(id);
      setConfirmDeleteId(null);
      setActionSuccessMsg('Įrašas sėkmingai ištrintas.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
      onRefresh();
    } catch (err: any) {
      setDeleteError(err.message || 'Nepavyko ištrinti įrašo');
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    setDeleteError(null);
    try {
      await archiveViolation(id);
      setActionSuccessMsg('Įrašas sėkmingai perkeltas į archyvą.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      onRefresh();
    } catch (err: any) {
      setDeleteError(err.message || 'Nepavyko suarchyvuoti įrašo');
    } finally {
      setArchivingId(null);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(filteredRecords, 'telefonu_registras_tryskiai');
    setExportOpen(false);
  };

  const handleExportWord = () => {
    exportToWord(filteredRecords, 'PAŽYMA DĖL MOKSLEIVIŲ MOBILIŲJŲ TELEFONŲ NAUDOJIMO TAISYKLIŲ LAIKYMOSI');
    setExportOpen(false);
  };

  const handleExportCsv = () => {
    window.location.href = '/api/export/csv';
    setExportOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 lg:px-8" id="violations-journal-container">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Pažeidimų žurnalas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Aktyvus pažeidimų registras
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Iš viso įrašų: <span className="font-semibold text-slate-900">{filteredRecords.length}</span> (iš {records.length})
            {user.role === 'admin' && onGoToArchive && (
              <button
                onClick={onGoToArchive}
                className="ml-3 text-xs font-semibold text-amber-700 hover:text-amber-800 underline inline-flex items-center space-x-1"
              >
                <Archive className="w-3 h-3" />
                <span>Atidaryti archyvą</span>
              </button>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors flex items-center text-xs font-semibold cursor-pointer"
            title="Atnaujinti duomenis"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              id="export-dropdown-btn"
              onClick={() => setExportOpen(!exportOpen)}
              className="py-2 px-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Eksportuoti duomenis</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-lg py-2 z-40">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pasirinkite formatą:
                </div>

                <button
                  id="export-excel-btn"
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Excel (.xls)</div>
                    <div className="text-[11px] text-slate-500 font-normal">Suformatuota skaičiuoklė</div>
                  </div>
                </button>

                <button
                  id="export-word-btn"
                  onClick={handleExportWord}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Word (.doc)</div>
                    <div className="text-[11px] text-slate-500 font-normal">Oficiali pažyma su logotipu</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  id="export-csv-btn"
                  onClick={handleExportCsv}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Klasikinis CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-2 text-emerald-900 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Filter Toolbar (Google Sheets style) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="filter-search-input"
            type="text"
            placeholder="Ieškoti mokinio, mokytojo ar pastabos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="filter-class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          >
            <option value="all">Visos klasės</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                {cls} klasė
              </option>
            ))}
          </select>
        </div>

        {/* Date Period Filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="filter-date-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          >
            <option value="all">Visos datos</option>
            <option value="today">Šiandien</option>
            <option value="week">Pastarąsias 7 dienas</option>
            <option value="month">Pastarąsias 30 dienų</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Table View (Desktop & Tablet) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" id="violations-spreadsheet-table">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-44">Data ir Laikas</th>
                <th className="py-3.5 px-4 w-52">Mokinys</th>
                <th className="py-3.5 px-3 w-20 text-center">Klasė</th>
                <th className="py-3.5 px-4 w-56">Vieta</th>
                <th className="py-3.5 px-4">Pastaba / Aplinkybės</th>
                <th className="py-3.5 px-4 w-48">Užregistravo</th>
                <th className="py-3.5 px-3 w-20 text-center">Veiksmai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    Pagal pasirinktus filtrus jokių pažeidimų nerasta.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const canDelete =
                    user.role === 'admin' ||
                    r.registeredByTeacherEmail.toLowerCase() === user.email.toLowerCase();

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                        <div className="font-semibold">
                          {new Date(r.timestamp).toLocaleDateString('lt-LT', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {new Date(r.timestamp).toLocaleTimeString('lt-LT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {r.studentName}
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                          {r.studentClass}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                          <span>{r.location}</span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        {r.note ? (
                          <span className="line-clamp-2">{r.note}</span>
                        ) : (
                          <span className="text-slate-400 italic">Be papildomo komentaro</span>
                        )}
                      </td>

                      {/* Teacher */}
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <div className="font-medium text-slate-900">{r.registeredByTeacherName}</div>
                        <div className="text-[11px] text-slate-400 truncate font-mono">
                          {r.registeredByTeacherEmail}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center">
                        {canDelete ? (
                          confirmDeleteId === r.id ? (
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleDelete(r.id)}
                                disabled={deletingId === r.id}
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs cursor-pointer"
                                title="Patvirtinti trynimą"
                              >
                                {deletingId === r.id ? '...' : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs cursor-pointer"
                                title="Atšaukti"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1">
                              {user.role === 'admin' && (
                                <button
                                  onClick={() => handleArchive(r.id)}
                                  disabled={archivingId === r.id}
                                  className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Perkelti į archyvą"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmDeleteId(r.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Ištrinti įrašą"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (Phones) */}
      <div className="md:hidden space-y-3" id="violations-mobile-list">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-sm border border-slate-200">
            Pagal pasirinktus filtrus įrašų nėra.
          </div>
        ) : (
          filteredRecords.map((r) => {
            const canDelete =
              user.role === 'admin' ||
              r.registeredByTeacherEmail.toLowerCase() === user.email.toLowerCase();

            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-base">{r.studentName}</span>
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-md">
                      {r.studentClass}
                    </span>
                  </div>

                  {canDelete && (
                    <div className="flex items-center space-x-1">
                      {confirmDeleteId === r.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold"
                          >
                            Trinti
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                          >
                            Atšaukti
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleArchive(r.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 rounded"
                            title="Archyvuoti"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                            title="Trinti"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center text-xs text-slate-500 space-x-3">
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span>{new Date(r.timestamp).toLocaleString('lt-LT', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span>{r.location}</span>
                  </div>
                </div>

                {r.note && (
                  <div className="text-xs bg-slate-50 p-2.5 rounded-lg text-slate-700 border border-slate-100">
                    <span className="font-medium text-slate-900">Pastaba: </span>
                    {r.note}
                  </div>
                )}

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Registravo: {r.registeredByTeacherName}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
