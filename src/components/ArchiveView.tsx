import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Archive,
  RotateCcw,
  Trash2,
  Download,
  Search,
  Calendar,
  GraduationCap,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  Clock,
  Layers,
  ArchiveRestore,
  Sparkles,
  Check
} from 'lucide-react';
import type { CurrentUser, ViolationRecord } from '../types';
import { getViolations, restoreViolation, deleteViolation, getArchiveYears, archiveBatch, getViolationsCounts } from '../api';
import { exportToExcel, exportToWord, formatLtDate } from '../utils/exportUtils';
import { SchoolLogo } from './SchoolLogo';

interface ArchiveViewProps {
  user: CurrentUser;
  onRefreshActive?: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ user, onRefreshActive }) => {
  const [records, setRecords] = useState<ViolationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Confirmation modals / states
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchYear, setBatchYear] = useState<string>('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMode, setBatchMode] = useState<'new_school_year' | 'by_year'>('new_school_year');
  const [activeCount, setActiveCount] = useState<number>(0);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');

  const loadArchive = useCallback(() => {
    setLoading(true);
    setErrorMsg(null);
    Promise.all([
      getViolations({ status: 'archived', schoolYear: selectedYear }),
      getArchiveYears(),
      getViolationsCounts(),
    ])
      .then(([data, years, counts]) => {
        setRecords(data);
        setAvailableYears(years);
        setActiveCount(counts.active);
        setCurrentSchoolYear(counts.currentYear);
        if (years.length > 0 && !batchYear) {
          setBatchYear(counts.currentYear || years[0]);
        }
      })
      .catch((err) => setErrorMsg(err.message || 'Nepavyko užkrauti archyvo duomenų'))
      .finally(() => setLoading(false));
  }, [selectedYear, batchYear]);

  useEffect(() => {
    loadArchive();
  }, [loadArchive]);

  // Extract unique classes in archive
  const classesList = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => {
      if (r.studentClass) s.add(r.studentClass);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesStudent = r.studentName.toLowerCase().includes(q);
        const matchesNote = (r.note || '').toLowerCase().includes(q);
        const matchesTeacher = r.registeredByTeacherName.toLowerCase().includes(q);
        if (!matchesStudent && !matchesNote && !matchesTeacher) return false;
      }

      if (selectedClass !== 'all') {
        if (r.studentClass.toLowerCase() !== selectedClass.toLowerCase()) return false;
      }

      return true;
    });
  }, [records, searchTerm, selectedClass]);

  const handleRestore = async (id: string) => {
    setActionInProgressId(id);
    setErrorMsg(null);
    try {
      await restoreViolation(id);
      setSuccessMsg('Įrašas sėkmingai sugrąžintas į aktyvų registrą.');
      loadArchive();
      if (onRefreshActive) onRefreshActive();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko atkurti įrašo');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (!window.confirm('Dėmesio: šis įrašas bus ištrintas visam laikui. Ar tęsti?')) {
      return;
    }

    setActionInProgressId(id);
    setErrorMsg(null);
    try {
      await deleteViolation(id);
      setSuccessMsg('Įrašas visam laikui pašalintas iš archyvo.');
      loadArchive();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko ištrinti įrašo');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleBatchArchive = async () => {
    if (!batchYear) return;
    setBatchLoading(true);
    setErrorMsg(null);
    try {
      const res = await archiveBatch({
        schoolYear: batchMode === 'by_year' ? batchYear : undefined,
        archiveAllActive: batchMode === 'new_school_year',
        targetSchoolYear: batchYear,
      });
      setSuccessMsg(`Archyvavimas atliktas sėkmingai! ${res.message}. Aktyvus žurnalas paruoštas naujiems mokslo metams.`);
      setShowBatchModal(false);
      loadArchive();
      if (onRefreshActive) onRefreshActive();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko atlikti archyvavimo');
    } finally {
      setBatchLoading(false);
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-5" id="archive-view-container">
      {/* Header with School Logo Identity */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <SchoolLogo badge size="md" />
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-0.5">
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>Gimnazijos archyvas</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Telefonų taisyklių pažeidimų archyvas
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Archyvuoti praėjusių mokslo metų ir senesni įrašai saugomi apskaitai ir statistikai.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setBatchMode('new_school_year');
                setShowBatchModal(true);
              }}
              className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <ArchiveRestore className="w-4 h-4" />
              <span>Archyvuoti mokslo metus</span>
            </button>
          )}

          <button
            onClick={() => exportToExcel(filteredRecords, 'archyvas_telefonai_tryskiai')}
            disabled={filteredRecords.length === 0}
            className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Eksportuoti šį archyvą į Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Excel (.xls)</span>
          </button>

          <button
            onClick={() => exportToWord(filteredRecords, 'PAŽYMA IŠ TELEFONŲ NAUDOJIMO REGISTRO ARCHYVO', selectedYear === 'all' ? 'Visi archyvo duomenys' : selectedYear)}
            disabled={filteredRecords.length === 0}
            className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Eksportuoti oficialią pažymą į Word"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Word (.doc)</span>
          </button>

          <button
            onClick={loadArchive}
            disabled={loading}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Atnaujinti archyvą"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin New School Year Action Card */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/60 to-yellow-50/50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm sm:text-base">
              <GraduationCap className="w-5 h-5 text-amber-700 shrink-0" />
              <span>Pradėti naujus mokslo metus su švariu žurnalu</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Užbaigę mokslo metus, galite vienu paspaudimu suarchyvuoti visus šiuo metu aktyvius žurnalo įrašus.
              Kasdienis registras mokytojams taps tuščias (0 aktyvių įrašų), o visi duomenys visam laikui liks pasiekiami šioje archyvo skiltyje.
            </p>
            <div className="text-xs font-semibold text-amber-900 pt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100/90 text-amber-900 border border-amber-300/70">
                Šiuo metu aktyvių įrašų žurnale: {activeCount}
              </span>
              {currentSchoolYear && (
                <span className="text-slate-500">
                  Dabartinis laikotarpis: <strong className="text-slate-700">{currentSchoolYear}</strong>
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setBatchMode('new_school_year');
              setShowBatchModal(true);
            }}
            className="shrink-0 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <ArchiveRestore className="w-4 h-4" />
            <span>Pradėti naujus mokslo metus</span>
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-2 text-emerald-900 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* School Year Select */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold text-slate-800"
          >
            <option value="all">Visi mokslo metai</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ieškoti archyve..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
          >
            <option value="all">Visos klasės</option>
            {classesList.map((cls) => (
              <option key={cls} value={cls}>
                {cls} klasė
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Archive Count Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Rasta archyvuotų įrašų: <strong className="text-slate-800">{filteredRecords.length}</strong> (iš {records.length})
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span>Archyvuoti įrašai neįtraukiami į kasdienį aktyvų registrą</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" id="archive-table">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-32">M. metai</th>
                <th className="py-3 px-4 w-40">Data ir laikas</th>
                <th className="py-3 px-4 w-48">Mokinys</th>
                <th className="py-3 px-3 w-20 text-center">Klasė</th>
                <th className="py-3 px-4 w-48">Vieta</th>
                <th className="py-3 px-4">Pastabos / Aplinkybės</th>
                <th className="py-3 px-4 w-40">Užregistravo</th>
                <th className="py-3 px-4 w-36 text-center">Veiksmai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Kraunamas archyvas...' : 'Pagal pasirinktus kriterijus archyvuotų įrašų nėra.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isProcessing = actionInProgressId === r.id;
                  const canManage =
                    user.role === 'admin' ||
                    r.registeredByTeacherEmail.toLowerCase() === user.email.toLowerCase();

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* School year */}
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {r.schoolYear || 'Nenurodyta'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                        {formatLtDate(r.timestamp)}
                      </td>

                      {/* Student */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.studentName}
                      </td>

                      {/* Class */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">
                          {r.studentClass}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {r.location}
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                        {r.note || <span className="text-slate-300 italic">—</span>}
                      </td>

                      {/* Teacher */}
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div className="font-medium text-slate-900">{r.registeredByTeacherName}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        {canManage ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleRestore(r.id)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Atkurti į aktyvų registrą"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                              <span>Atkurti</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeletePermanent(r.id)}
                                disabled={isProcessing}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Ištrinti visam laikui"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3" id="archive-mobile-list">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-sm border border-slate-200">
            {loading ? 'Kraunamas archyvas...' : 'Archyvuotų įrašų nėra.'}
          </div>
        ) : (
          filteredRecords.map((r) => {
            const canManage =
              user.role === 'admin' ||
              r.registeredByTeacherEmail.toLowerCase() === user.email.toLowerCase();

            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-base">{r.studentName}</span>
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-800 rounded">
                      {r.studentClass}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {r.schoolYear}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatLtDate(r.timestamp)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{r.location}</span>
                  </div>
                </div>

                {r.note && (
                  <div className="text-xs bg-slate-50 p-2 rounded text-slate-700 border border-slate-100">
                    {r.note}
                  </div>
                )}

                {canManage && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleRestore(r.id)}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold rounded-lg flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Atkurti į registrą</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeletePermanent(r.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Batch Archive Modal (Admin Only) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-base">
              <ArchiveRestore className="w-5 h-5 text-amber-600" />
              <span>Mokslo metų archyvavimas ir žurnalo valdymas</span>
            </div>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setBatchMode('new_school_year')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                  batchMode === 'new_school_year'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pradėti naujus mokslo metus
              </button>
              <button
                type="button"
                onClick={() => setBatchMode('by_year')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                  batchMode === 'by_year'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pagal mokslo metus
              </button>
            </div>

            {batchMode === 'new_school_year' ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs text-slate-700">
                  <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Švarus žurnalas naujam mokslo metų sezonui</span>
                  </div>
                  <p className="leading-relaxed">
                    Visi šiuo metu aktyvūs žurnalo įrašai (iš viso: <strong className="text-amber-900 font-bold">{activeCount}</strong>) bus perkelti į saugų archyvą ir pažymėti kaip užbaigti.
                  </p>
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold pt-1">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Aktyvus žurnalas taps visiškai tuščias (0 įrašų) – mokytojai pradės nuo švaraus lapo.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priskirti archyvuojamus įrašus mokslo metams:
                  </label>
                  <select
                    value={batchYear}
                    onChange={(e) => setBatchYear(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Visi pasirinktų mokslo metų aktyvūs įrašai bus perkelti į archyvą. Archyve bet kada galėsite peržiūrėti istoriją ar eksportuoti pažymas.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pasirinkite mokslo metus archyvavimui:
                  </label>
                  <select
                    value={batchYear}
                    onChange={(e) => setBatchYear(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Atšaukti
              </button>
              <button
                type="button"
                onClick={handleBatchArchive}
                disabled={batchLoading}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Archive className="w-4 h-4" />
                <span>
                  {batchLoading
                    ? 'Archyvuojama...'
                    : batchMode === 'new_school_year'
                    ? `Archyvuoti ir išvalyti žurnalą (${activeCount})`
                    : 'Patvirtinti archyvavimą'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
