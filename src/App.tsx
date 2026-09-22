import React, { useState, useEffect, useCallback } from 'react';
import type { CurrentUser, ViolationRecord } from './types';
import { getStoredUser, setStoredUser, fetchServerConfig, getViolations } from './api';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { UnauthorizedView } from './components/UnauthorizedView';
import { ViolationForm } from './components/ViolationForm';
import { ViolationsTable } from './components/ViolationsTable';
import { ArchiveView } from './components/ArchiveView';
import { StatisticsView } from './components/StatisticsView';
import { WhitelistManagement } from './components/WhitelistManagement';
import { SubdomainGuide } from './components/SubdomainGuide';
import { SettingsManagement, SettingsSubTab } from './components/SettingsManagement';
import type { AppTab } from './components/Header';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => getStoredUser());
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('register');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('classes');

  // Mokytojai turi prieigą TIK prie 'register', 'table' ir 'stats'
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && !['register', 'table', 'stats'].includes(activeTab)) {
      setActiveTab('table');
    }
  }, [currentUser, activeTab]);
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [defaultAdminEmail, setDefaultAdminEmail] = useState<string>('kestutis.labanauskas@tryskiumokykla.lt');

  const [records, setRecords] = useState<ViolationRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Fetch initial config (Google client ID, default admin email)
  useEffect(() => {
    fetchServerConfig()
      .then((cfg) => {
        if (cfg.googleClientId) setGoogleClientId(cfg.googleClientId);
        if (cfg.defaultAdminEmail) setDefaultAdminEmail(cfg.defaultAdminEmail);
      })
      .catch((err) => console.warn('Could not fetch server config:', err));
  }, []);

  // Fetch violations when user is authenticated
  const loadRecords = useCallback(() => {
    if (!currentUser) return;
    setLoadingRecords(true);
    getViolations()
      .then((data) => setRecords(data))
      .catch((err) => {
        console.error('Failed to load violations:', err);
        if (err.message && err.message.includes('Neturite teisių')) {
          setUnauthorizedEmail(currentUser.email);
        }
      })
      .finally(() => setLoadingRecords(false));
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadRecords();
    }
  }, [currentUser, loadRecords]);

  const handleLoginSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    setUnauthorizedEmail(null);
    setStoredUser(user);
  };

  const handleUnauthorized = (email: string) => {
    setUnauthorizedEmail(email);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUnauthorizedEmail(null);
    setStoredUser(null);
  };

  // If user attempted login with an email not on whitelist:
  if (unauthorizedEmail) {
    return (
      <UnauthorizedView
        email={unauthorizedEmail}
        onLogout={handleLogout}
        adminEmail={defaultAdminEmail}
      />
    );
  }

  // If not logged in, show Login view
  if (!currentUser) {
    return (
      <LoginView
        onSuccess={handleLoginSuccess}
        onUnauthorized={handleUnauthorized}
        googleClientId={googleClientId}
        defaultAdminEmail={defaultAdminEmail}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        user={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16 md:pb-8">
        {activeTab === 'register' && (
          <ViolationForm
            user={currentUser}
            onSuccess={() => {
              loadRecords();
            }}
            onOpenSettings={(subTab = 'classes') => {
              setSettingsSubTab(subTab);
              setActiveTab('settings');
            }}
            onOpenClasses={() => {
              setSettingsSubTab('classes');
              setActiveTab('settings');
            }}
          />
        )}

        {activeTab === 'table' && (
          <ViolationsTable
            user={currentUser}
            records={records}
            loading={loadingRecords}
            onRefresh={loadRecords}
            onGoToArchive={() => setActiveTab('archive')}
          />
        )}

        {activeTab === 'archive' && currentUser.role === 'admin' && (
          <ArchiveView
            user={currentUser}
            onRefreshActive={loadRecords}
          />
        )}

        {activeTab === 'stats' && <StatisticsView user={currentUser} />}

        {(activeTab === 'settings' || activeTab === 'classes') && currentUser.role === 'admin' && (
          <SettingsManagement user={currentUser} initialSubTab={settingsSubTab} />
        )}

        {activeTab === 'whitelist' && currentUser.role === 'admin' && <WhitelistManagement user={currentUser} />}

        {activeTab === 'guide' && currentUser.role === 'admin' && <SubdomainGuide />}
      </main>
    </div>
  );
}
