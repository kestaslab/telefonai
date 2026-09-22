import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  BarChart3,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  School,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  Users,
} from 'lucide-react';
import type { TimeFilterPeriod, StatisticsData, CurrentUser, StudentIntervention } from '../types';
import { getStatistics, getStudentInterventions, addStudentIntervention, deleteStudentIntervention } from '../api';

interface StatisticsViewProps {
  user?: CurrentUser;
}

const ACTION_PRESETS = [
  'Atimtas telefonas iki pamokų pabaigos',
  'Išsikviesti tėvai pokalbiui',
  'Pranešimas tėvams per TAMO dienyną',
  'Pokalbis su socialiniu pedagogu',
  'Klausimas svarstytas Vaiko gerovės komisijoje (VGK)',
  'Įspėjimas / Direktoriaus papeikimas',
];

export const StatisticsView: React.FC<StatisticsViewProps> = ({ user }) => {
  const [period, setPeriod] = useState<TimeFilterPeriod>('month');
  const [topLimit, setTopLimit] = useState<number>(10); // 10, 20, 30, 0 (0 = all)
  const [thresholdFilter, setThresholdFilter] = useState<'all' | '3plus' | '5plus'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStudentKey, setExpandedStudentKey] = useState<string | null>(null);

  // Student interventions cache: studentKey -> StudentIntervention[]
  const [interventionsMap, setInterventionsMap] = useState<Record<string, StudentIntervention[]>>({});
  const [loadingInterventions, setLoadingInterventions] = useState<Record<string, boolean>>({});

  // Adding intervention state
  const [newActionInput, setNewActionInput] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [savingAction, setSavingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadStats = () => {
    setLoading(true);
    getStatistics(period, topLimit)
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, [period, topLimit]);

  const loadStudentInterventions = async (studentName: string, studentClass: string) => {
    const key = `${studentName}-${studentClass}`;
    setLoadingInterventions((prev) => ({ ...prev, [key]: true }));
    try {
      const data = await getStudentInterventions({ studentName, studentClass });
      setInterventionsMap((prev) => ({ ...prev, [key]: data }));
    } catch (err) {
      console.error('Failed to load interventions:', err);
    } finally {
      setLoadingInterventions((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleStudent = (key: string, studentName: string, studentClass: string) => {
    if (expandedStudentKey === key) {
      setExpandedStudentKey(null);
    } else {
      setExpandedStudentKey(key);
      setNewActionInput('');
      setNewNoteInput('');
      setActionSuccessMsg(null);
      loadStudentInterventions(studentName, studentClass);
    }
  };

  const handleAddIntervention = async (studentName: string, studentClass: string) => {
    if (!newActionInput.trim()) return;

    setSavingAction(true);
    try {
      await addStudentIntervention({
        studentName,
        studentClass,
        action: newActionInput.trim(),
        note: newNoteInput.trim() || undefined,
      });

      setNewActionInput('');
      setNewNoteInput('');
      setActionSuccessMsg('Priemonė / veiksmas sėkmingai išsaugotas!');
      await loadStudentInterventions(studentName, studentClass);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Nepavyko išsaugoti priemonės');
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteIntervention = async (id: string, studentName: string, studentClass: string) => {
    if (!window.confirm('Ar tikrai norite pašalinti šį priemonės įrašą?')) return;
    try {
      await deleteStudentIntervention(id);
      loadStudentInterventions(studentName, studentClass);
    } catch (err: any) {
      alert(err.message || 'Nepavyko pašalinti priemonės');
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-extrabold flex items-center justify-center text-xs shadow-xs border border-amber-300 shrink-0">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-extrabold flex items-center justify-center text-xs shadow-xs border border-slate-400 shrink-0">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-700/80 text-white font-extrabold flex items-center justify-center text-xs shadow-xs border border-amber-600 shrink-0">
          3
        </span>
      );
    }
    return (
      <span
        className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
          rank > 30
            ? 'bg-purple-100 text-purple-800 border border-purple-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}
      >
        {rank}
      </span>
    );
  };

  const getSeverityBadge = (count: number) => {
    if (count >= 5) {
      return {
        label: 'Kritinis lygis (VGK / Tėvai)',
        color: 'bg-red-100 text-red-800 border-red-200',
        action: 'Reikalingas Vaiko gerovės komisijos posėdis ir tėvų iškvietimas',
      };
    }
    if (count >= 3) {
      return {
        label: 'Pranešimas tėvams',
        color: 'bg-amber-100 text-amber-900 border-amber-200',
        action: 'Klasės vadovo skambutis tėvams, įspėjimas TAMO dienyne',
      };
    }
    return {
      label: 'Pirminis perspėjimas',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      action: 'Pastaba ir pokalbis su mokiniu',
    };
  };

  // Full list of students for chosen period
  const allStudents = useMemo(() => {
    return stats?.allStudentsSummary || stats?.topViolators || [];
  }, [stats]);

  const count3Plus = useMemo(() => {
    return allStudents.filter((s) => s.violationCount >= 3).length;
  }, [allStudents]);

  const count5Plus = useMemo(() => {
    return allStudents.filter((s) => s.violationCount >= 5).length;
  }, [allStudents]);

  // Candidate students to show: if topLimit === 0 (All) or threshold/search active, use allStudents
  const candidateList = useMemo(() => {
    if (topLimit === 0 || thresholdFilter !== 'all' || searchQuery.trim()) {
      return allStudents;
    }
    return stats?.topViolators || [];
  }, [topLimit, thresholdFilter, searchQuery, allStudents, stats]);

  // Final filtered list based on search and threshold
  const displayedStudents = useMemo(() => {
    return candidateList.filter((s) => {
      if (thresholdFilter === '3plus' && s.violationCount < 3) return false;
      if (thresholdFilter === '5plus' && s.violationCount < 5) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.studentName.toLowerCase().includes(q);
        const matchClass = s.studentClass.toLowerCase().includes(q);
        if (!matchName && !matchClass) return false;
      }
      return true;
    });
  }, [candidateList, thresholdFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-6" id="analytics-container">
      {/* Title & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span>Analitika ir ataskaitos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {topLimit === 0
              ? 'Visų užfiksuotų mokinių apskaita'
              : `Telefonų pažeidimų apskaita ir TOP ${topLimit}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Drausmės suvestinė pagal moksleivius, klases, taikytas priemones ir pasirinktą laikotarpį.
          </p>
        </div>

        {/* Filter Controls: Period & Top Limit */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Top Limit Selector: Top 10, Top 20, Top 30, Visi */}
          <div className="bg-slate-200/90 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Rodyti:</span>
            {[10, 20, 30].map((limitVal) => (
              <button
                key={limitVal}
                id={`btn-top-${limitVal}`}
                onClick={() => {
                  setTopLimit(limitVal);
                  setThresholdFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  topLimit === limitVal && thresholdFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                TOP {limitVal}
              </button>
            ))}
            <button
              id="btn-top-all"
              onClick={() => {
                setTopLimit(0);
                setThresholdFilter('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                topLimit === 0 && thresholdFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Rodyti visus užfiksuotus mokinius be jokių apribojimų"
            >
              Visi ({stats?.uniqueStudentsCount ?? 0})
            </button>
          </div>

          {/* Period Selector Tabs: Savaitė, Mėnuo, Pusmetis, Mokslo metai, Visi laikai */}
          <div className="bg-slate-200/90 p-1 rounded-xl flex items-center flex-wrap gap-1 shadow-2xs" id="stats-period-selector">
            <button
              id="period-week-btn"
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Savaitė
            </button>
            <button
              id="period-month-btn"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mėnuo
            </button>
            <button
              id="period-halfyear-btn"
              onClick={() => setPeriod('half_year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'half_year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pusmetis
            </button>
            <button
              id="period-schoolyear-btn"
              onClick={() => setPeriod('school_year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'school_year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mokslo metai
            </button>
            <button
              id="period-all-btn"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visi laikai
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm font-medium">Skaičiuojama statistika...</p>
        </div>
      ) : !stats ? null : (
        <>
          {/* Summary Metric Cards: 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {stats.periodViolationsCount}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Pažeidimų pasirinktu laikotarpiu
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setTopLimit(0);
                setThresholdFilter('all');
              }}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center space-x-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/20 transition"
              title="Spustelėkite, norėdami peržiūrėti visus mokinius"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {stats.uniqueStudentsCount}
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                  <span>Užfiksuotų moksleivių</span>
                  <span className="text-emerald-700 font-bold underline">Visi</span>
                </div>
              </div>
            </div>

            {/* Crucial 3+ violations indicator card */}
            <div
              onClick={() => {
                setTopLimit(0);
                setThresholdFilter(thresholdFilter === '3plus' ? 'all' : '3plus');
              }}
              className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-2xs flex items-center space-x-4 cursor-pointer transition ${
                thresholdFilter === '3plus'
                  ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/40'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
              title="Spustelėkite, norėdami filtruoti mokinius su ≥ 3 pažeidimais"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-900">
                  {count3Plus}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Mokiniai su ≥ 3 pažeidimais
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {stats.byClass[0]?.classNumber || '—'}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Daugiausiai pažeidusi klasė ({stats.byClass[0]?.count || 0} k.)
                </div>
              </div>
            </div>
          </div>

          {/* MAIN SECTION: NUSIKALTĖLIŲ TOPAS / VISI PAŽEIDĖJAI */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden" id="top-violators-section">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {thresholdFilter === '3plus'
                      ? `Mokiniai su ≥ 3 pažeidimais (${displayedStudents.length})`
                      : thresholdFilter === '5plus'
                      ? `Kritiniai pažeidėjai (≥ 5 k.) (${displayedStudents.length})`
                      : topLimit === 0
                      ? `Visi užfiksuoti mokiniai (${displayedStudents.length})`
                      : `Nusikaltėlių TOPAS (TOP ${topLimit})`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Spustelėkite mokinio eilutę, norėdami peržiūrėti pažeidimus arba įrašyti taikytą pedagoginę priemonę
                  </p>
                </div>
              </div>

              {/* Threshold Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Threshold Pills */}
                <div className="bg-white p-0.5 border border-slate-200 rounded-xl flex items-center shadow-2xs text-xs">
                  <button
                    type="button"
                    onClick={() => setThresholdFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      thresholdFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Visi
                  </button>
                  <button
                    type="button"
                    onClick={() => setThresholdFilter('3plus')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                      thresholdFilter === '3plus'
                        ? 'bg-amber-500 text-white'
                        : 'text-amber-800 hover:bg-amber-50'
                    }`}
                    title="Rodyti visus mokinius, surinkusius 3 ar daugiau pažeidimų"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>≥ 3 k. ({count3Plus})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThresholdFilter('5plus')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                      thresholdFilter === '5plus'
                        ? 'bg-red-600 text-white'
                        : 'text-red-700 hover:bg-red-50'
                    }`}
                    title="Rodyti kritinius pažeidėjus (5 ir daugiau pažeidimų)"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>≥ 5 k. ({count5Plus})</span>
                  </button>
                </div>

                {/* Instant Student Search */}
                <div className="relative min-w-[200px] sm:min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ieškoti mokinio ar klasės..."
                    className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                  {period === 'week' && 'Paskutinė savaitė'}
                  {period === 'month' && 'Paskutinis mėnuo'}
                  {period === 'half_year' && 'Pusmetis'}
                  {period === 'school_year' && 'Mokslo metai'}
                  {period === 'all' && 'Visi laikai'}
                </span>
              </div>
            </div>

            {/* Warning when some students with 3+ violations are outside the current TOP limit */}
            {topLimit > 0 && thresholdFilter === 'all' && !searchQuery && stats.uniqueStudentsCount > topLimit && (
              <div className="p-3 bg-amber-50/80 border-b border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Rodoma TOP {topLimit} iš {stats.uniqueStudentsCount} užfiksuotų mokinių
                    {count3Plus > topLimit && (
                      <strong className="font-bold ml-1">
                        (iš viso net {count3Plus} mokiniai turi 3 ar daugiau pažeidimų!).
                      </strong>
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setThresholdFilter('3plus')}
                    className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold text-xs cursor-pointer transition"
                  >
                    Rodyti visus su ≥ 3 k. ({count3Plus})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopLimit(0)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer transition"
                  >
                    Rodyti visus ({stats.uniqueStudentsCount})
                  </button>
                </div>
              </div>
            )}

            {displayedStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                {stats.uniqueStudentsCount === 0
                  ? 'Pasirinktu laikotarpiu pažeidimų nėra užregistruota.'
                  : 'Pagal pasirinktus filtrus ar paiešką mokinių nerasta.'}
                {(thresholdFilter !== 'all' || searchQuery) && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setThresholdFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                    >
                      Išvalyti filtrus ir paiešką
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayedStudents.map((student, idx) => {
                  const fullIndex = allStudents.findIndex(
                    (orig) => orig.studentName === student.studentName && orig.studentClass === student.studentClass
                  );
                  const rank = fullIndex >= 0 ? fullIndex + 1 : idx + 1;
                  const key = `${student.studentName}-${student.studentClass}`;
                  const isExpanded = expandedStudentKey === key;
                  const severity = getSeverityBadge(student.violationCount);
                  const studentInterventions = interventionsMap[key] || [];
                  const isLoadingInterventions = loadingInterventions[key] || false;

                  return (
                    <div key={key} className="transition-colors hover:bg-slate-50/50">
                      <div
                        onClick={() => toggleStudent(key, student.studentName, student.studentClass)}
                        className="p-4 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          {getRankBadge(rank)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-sm sm:text-base">
                                {student.studentName}
                              </span>
                              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-md">
                                {student.studentClass} kl.
                              </span>
                              {studentInterventions.length > 0 && (
                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {studentInterventions.length} priemonė(-ės)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                              <span>Paskutinis kartas: {new Date(student.lastViolationDate).toLocaleDateString('lt-LT')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <span
                            className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${severity.color}`}
                          >
                            {severity.label}
                          </span>

                          <div className="text-right">
                            <div className="text-base sm:text-lg font-extrabold text-red-600">
                              {student.violationCount}{' '}
                              <span className="text-xs font-medium text-slate-500">k.</span>
                            </div>
                          </div>

                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section: Violations + Pedagogical Actions / Comments */}
                      {isExpanded && (
                        <div className="px-4 pb-5 pt-2 bg-slate-50/90 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
                          {/* Severity Action Box */}
                          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-start space-x-2 shadow-2xs">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-900">Rekomenduojama priemonė: </span>
                              {severity.action}
                            </div>
                          </div>

                          {/* SECTION: Student Interventions / Actions Taken */}
                          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <div className="flex items-center space-x-2">
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                  Taikytos pedagoginės priemonės ir komentarai ({studentInterventions.length})
                                </h4>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                Matoma visiems mokytojams
                              </span>
                            </div>

                            {/* List of existing interventions */}
                            {isLoadingInterventions ? (
                              <div className="text-xs text-slate-400 py-2">Kraunamos taikytos priemonės...</div>
                            ) : studentInterventions.length === 0 ? (
                              <p className="text-xs text-slate-400 py-1">
                                Šiam mokiniui dar nėra užfiksuota jokių pedagoginių priemonių (pvz., telefonas atimtas, iškviesti tėvai). Galite pridėti žemiau.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {studentInterventions.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start justify-between p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-xs"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                                        <span>{item.action}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          {new Date(item.createdAt).toLocaleDateString('lt-LT')} {new Date(item.createdAt).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      {item.note && (
                                        <p className="text-slate-600 italic">„{item.note}“</p>
                                      )}
                                      <div className="text-[10px] text-slate-400">
                                        Užfiksavo: {item.addedByTeacherName}
                                      </div>
                                    </div>

                                    {(user?.role === 'admin' || user?.email === item.addedByTeacherEmail) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteIntervention(item.id, student.studentName, student.studentClass)}
                                        className="p-1 text-slate-400 hover:text-rose-600 transition ml-2"
                                        title="Pašalinti šią priemonę"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Intervention Form */}
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <label className="block text-xs font-semibold text-slate-700">
                                Pridėti naują priemonę / veiksmą:
                              </label>

                              {/* Preset quick action buttons */}
                              <div className="flex flex-wrap gap-1.5">
                                {ACTION_PRESETS.map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setNewActionInput(preset)}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition"
                                  >
                                    +{preset}
                                  </button>
                                ))}
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={newActionInput}
                                  onChange={(e) => setNewActionInput(e.target.value)}
                                  placeholder="Veiksmas (pvz., Atimtas telefonas, išsikviesti tėvai...)"
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <input
                                  type="text"
                                  value={newNoteInput}
                                  onChange={(e) => setNewNoteInput(e.target.value)}
                                  placeholder="Papildoma pastaba (neprivaloma)..."
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                  type="button"
                                  disabled={savingAction || !newActionInput.trim()}
                                  onClick={() => handleAddIntervention(student.studentName, student.studentClass)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shrink-0 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{savingAction ? 'Saugo...' : 'Išsaugoti'}</span>
                                </button>
                              </div>

                              {actionSuccessMsg && (
                                <div className="text-xs text-emerald-700 flex items-center space-x-1 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>{actionSuccessMsg}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* SECTION: All Violations for this Student in period */}
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                              Visi šio mokinio pažeidimai pasirinktu laikotarpiu ({student.records.length}):
                            </div>

                            <div className="space-y-2">
                              {student.records.map((rec) => (
                                <div
                                  key={rec.id}
                                  className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between text-slate-600">
                                    <div className="flex items-center space-x-2">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="font-medium text-slate-800">
                                        {new Date(rec.timestamp).toLocaleString('lt-LT')}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-slate-500">
                                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{rec.location}</span>
                                    </div>
                                  </div>
                                  {rec.note && (
                                    <p className="text-slate-700 italic bg-amber-50/50 p-1.5 rounded">
                                      „{rec.note}“
                                    </p>
                                  )}
                                  <div className="text-[11px] text-slate-400">
                                    Užregistravo: {rec.registeredByTeacherName} ({rec.registeredByTeacherEmail})
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Breakdown Grids: By Class and By Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Class */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Pagal klases</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
                Pažeidimų pasiskirstymas klasėse
              </h3>

              <div className="space-y-2">
                {stats.byClass.map((c) => {
                  const maxCount = stats.byClass[0]?.count || 1;
                  const pct = Math.round((c.count / maxCount) * 100);

                  return (
                    <div key={c.classNumber} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">
                          {c.classNumber.includes('kl') ? c.classNumber : `${c.classNumber} klasė`}
                        </span>
                        <span className="text-slate-600 font-bold">{c.count} pažeidimai</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Location */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Pagal vietas</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
                Kur dažniausiai užfiksuojama
              </h3>

              <div className="space-y-2">
                {stats.byLocation.slice(0, 7).map((loc) => {
                  const maxCount = stats.byLocation[0]?.count || 1;
                  const pct = Math.round((loc.count / maxCount) * 100);

                  return (
                    <div key={loc.location} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800 truncate max-w-[200px]">{loc.location}</span>
                        <span className="text-slate-600 font-bold">{loc.count} k.</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
