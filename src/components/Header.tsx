import React, { useState, useRef, useEffect } from 'react';
import type { CurrentUser } from '../types';
import {
  ShieldCheck,
  LogOut,
  Smartphone,
  BookOpen,
  BarChart3,
  Users,
  HelpCircle,
  Archive,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';

export type AppTab = 'register' | 'table' | 'archive' | 'stats' | 'settings' | 'classes' | 'whitelist' | 'guide';

interface HeaderProps {
  user: CurrentUser;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  onSelectTab,
  onLogout,
}) => {
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Close admin menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setAdminMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdminTab =
    activeTab === 'archive' ||
    activeTab === 'settings' ||
    activeTab === 'classes' ||
    activeTab === 'whitelist' ||
    activeTab === 'guide';

  const getAdminTabLabel = (tab: AppTab) => {
    switch (tab) {
      case 'archive':
        return 'Archyvas';
      case 'settings':
      case 'classes':
        return 'Nustatymai';
      case 'whitelist':
        return 'Mokytojai';
      case 'guide':
        return 'Subdomenas';
      default:
        return 'Valdymas';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] py-1.5 sm:py-2">
          {/* Institutional Brand and School Emblem - Rock solid across all screen widths */}
          <div
            className="flex items-center space-x-2.5 sm:space-x-3.5 cursor-pointer shrink-0 py-0.5 select-none group"
            onClick={() => onSelectTab('register')}
            title="Tryškių Lazdynų Pelėdos gimnazija – Telefonų registras"
          >
            <SchoolLogo badge size="responsive" />

            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base lg:text-lg leading-tight group-hover:text-amber-900 transition-colors">
                  <span className="sm:hidden">Tryškių L. Pelėdos gimn.</span>
                  <span className="hidden sm:inline">Tryškių Lazdynų Pelėdos gimnazija</span>
                </span>
                <span className="hidden 2xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded border border-amber-200 uppercase">
                  Oficialus
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-amber-800 font-semibold mt-0.5">
                <Smartphone className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">Telefonų taisyklių registras</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation - Responsive & Adaptive */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0" id="desktop-nav">
            <button
              id="tab-register-btn"
              onClick={() => onSelectTab('register')}
              className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'bg-amber-100/80 text-amber-950 font-bold border border-amber-300/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Registruoti</span>
            </button>

            <button
              id="tab-table-btn"
              onClick={() => onSelectTab('table')}
              className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-colors ${
                activeTab === 'table'
                  ? 'bg-blue-100/80 text-blue-950 font-bold border border-blue-300/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Žurnalas</span>
            </button>

            <button
              id="tab-stats-btn"
              onClick={() => onSelectTab('stats')}
              className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-emerald-100/80 text-emerald-950 font-bold border border-emerald-300/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Statistika</span>
            </button>

            {/* Administrative tabs: visible ONLY to admin */}
            {user.role === 'admin' && (
              <>
                {/* On extra-large screens (xl: >= 1280px): show individual buttons */}
                <div className="hidden xl:flex items-center space-x-1 pl-1 border-l border-slate-200">
                  <button
                    id="tab-archive-btn"
                    onClick={() => onSelectTab('archive')}
                    className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'archive'
                        ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Pažeidimų archyvas ir mokslo metų valdymas"
                  >
                    <Archive className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Archyvas</span>
                  </button>

                  <button
                    id="tab-settings-btn"
                    onClick={() => onSelectTab('settings')}
                    className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'settings' || activeTab === 'classes'
                        ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Sistemos nustatymai: klasės, vietos, numatytosios pastabos"
                  >
                    <Settings className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Nustatymai</span>
                  </button>

                  <button
                    id="tab-whitelist-btn"
                    onClick={() => onSelectTab('whitelist')}
                    className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'whitelist'
                        ? 'bg-purple-100 text-purple-950 font-bold border border-purple-300 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Leidžiamų mokytojų el. paštų ir teisių valdymas"
                  >
                    <Users className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Mokytojai</span>
                  </button>

                  <button
                    id="tab-guide-btn"
                    onClick={() => onSelectTab('guide')}
                    className={`flex items-center space-x-1 px-2.5 py-2 rounded-xl text-xs lg:text-sm font-medium transition-colors ${
                      activeTab === 'guide'
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Talpinimo ir subdomeno gidas"
                  >
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>Subdomenas</span>
                  </button>
                </div>

                {/* On medium/laptop screens (md: 768px to xl: 1279px): Dropdown to prevent header squashing */}
                <div className="xl:hidden relative" ref={adminDropdownRef}>
                  <button
                    id="tab-admin-dropdown-btn"
                    type="button"
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                      isAdminTab
                        ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                        : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                    title="Administratoriaus valdymo funkcijos"
                  >
                    <Settings className={`w-3.5 h-3.5 ${isAdminTab ? 'text-amber-800' : 'text-slate-600'}`} />
                    <span>{getAdminTabLabel(activeTab)}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {adminMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Administratoriaus valdymas
                      </div>

                      <button
                        onClick={() => {
                          onSelectTab('settings');
                          setAdminMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs transition-colors ${
                          activeTab === 'settings' || activeTab === 'classes'
                            ? 'bg-amber-50 text-amber-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Settings className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="font-semibold">Nustatymai</div>
                          <div className="text-[10px] text-slate-500">Klasės, vietos, numatytosios pastabos</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onSelectTab('archive');
                          setAdminMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs transition-colors ${
                          activeTab === 'archive'
                            ? 'bg-amber-50 text-amber-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Archive className="w-4 h-4 text-amber-700 shrink-0" />
                        <div>
                          <div className="font-semibold">Archyvas</div>
                          <div className="text-[10px] text-slate-500">Mokslo metų pabaiga ir archyvavimas</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onSelectTab('whitelist');
                          setAdminMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs transition-colors ${
                          activeTab === 'whitelist'
                            ? 'bg-purple-50 text-purple-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Users className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <div className="font-semibold">Mokytojų sąrašas</div>
                          <div className="text-[10px] text-slate-500">Baltasis sąrašas ir teisių valdymas</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onSelectTab('guide');
                          setAdminMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs transition-colors ${
                          activeTab === 'guide'
                            ? 'bg-slate-100 text-slate-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                          <div className="font-semibold">Subdomenas</div>
                          <div className="text-[10px] text-slate-500">Talpinimo ir DNS nustatymai</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0" id="user-profile-widget">
            <div className="text-right hidden lg:block">
              <div className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight truncate max-w-[150px]">
                {user.name}
              </div>
              <div className="flex items-center justify-end space-x-1 text-[11px]">
                {user.role === 'admin' ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    <ShieldCheck className="w-3 h-3 mr-0.5" />
                    Admin
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">Mokytojas</span>
                )}
              </div>
            </div>

            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs sm:text-sm overflow-hidden shadow-2xs shrink-0"
              title={`${user.name} (${user.email})`}
            >
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <button
              id="logout-button"
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              title="Atsijungti"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar Navigation for fast phone access */}
      <div
        className={`md:hidden border-t border-slate-200 bg-white grid ${
          user.role === 'admin' ? 'grid-cols-6' : 'grid-cols-3'
        } px-1 py-1`}
        id="mobile-nav"
      >
        <button
          onClick={() => onSelectTab('register')}
          className={`flex flex-col items-center py-1.5 rounded-md text-[10px] font-medium ${
            activeTab === 'register' ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-600'
          }`}
        >
          <Smartphone className="w-4 h-4 mb-0.5" />
          <span>Registruoti</span>
        </button>
        <button
          onClick={() => onSelectTab('table')}
          className={`flex flex-col items-center py-1.5 rounded-md text-[10px] font-medium ${
            activeTab === 'table' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Žurnalas</span>
        </button>
        <button
          onClick={() => onSelectTab('stats')}
          className={`flex flex-col items-center py-1.5 rounded-md text-[10px] font-medium ${
            activeTab === 'stats' ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-600'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Statistika</span>
        </button>

        {/* Admin only mobile buttons */}
        {user.role === 'admin' && (
          <>
            <button
              onClick={() => onSelectTab('archive')}
              className={`flex flex-col items-center py-1.5 rounded-md text-[10px] font-medium ${
                activeTab === 'archive' ? 'text-amber-900 font-bold bg-amber-100' : 'text-slate-600'
              }`}
            >
              <Archive className="w-4 h-4 mb-0.5" />
              <span>Archyvas</span>
            </button>
            <button
              onClick={() => onSelectTab('settings')}
              className={`flex flex-col items-center py-1.5 rounded-md text-[10px] font-medium ${
                activeTab === 'settings' || activeTab === 'classes' ? 'text-amber-800 font-bold bg-amber-100' : 'text-slate-600'
              }`}
            >
              <Settings className="w-4 h-4 mb-0.5" />
              <span>Nustatymai</span>
            </button>
            <button
              onClick={() => onSelectTab('whitelist')}
              className={`flex flex-col items-center py-1.5 rounded-md text-[10px] font-medium ${
                activeTab === 'whitelist' ? 'text-purple-700 font-bold bg-purple-50' : 'text-slate-600'
              }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span>Mokytojai</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

