import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, ShieldCheck, UserCheck, AlertCircle, ArrowRight, School, KeyRound, Sparkles } from 'lucide-react';
import { loginWithGoogleCredential, demoLogin } from '../api';
import type { CurrentUser } from '../types';
import { SchoolLogo } from './SchoolLogo';

interface LoginViewProps {
  onSuccess: (user: CurrentUser) => void;
  onUnauthorized: (email: string) => void;
  googleClientId?: string;
  defaultAdminEmail?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement | null, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccess,
  onUnauthorized,
  googleClientId = '',
  defaultAdminEmail = 'kestutis.labanauskas@tryskiumokykla.lt',
}) => {
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

    const interval = setInterval(() => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        clearInterval(interval);
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response.credential) return;
            setLoading(true);
            setErrorMsg(null);
            try {
              const res = await loginWithGoogleCredential(response.credential);
              if (res.authorized && res.user) {
                onSuccess(res.user);
              } else {
                onUnauthorized(res.error || 'Nurodytas el. paštas neturi prieigos');
              }
            } catch (err: any) {
              setErrorMsg(err.message || 'Nepavyko prisijungti su Google paskyra');
            } finally {
              setLoading(false);
            }
          },
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    }, 300);

    return () => clearInterval(interval);
  }, [googleClientId, onSuccess, onUnauthorized]);

  const handleDemoLogin = async (email: string, name?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await demoLogin(email, name);
      if (res.authorized && res.user) {
        onSuccess(res.user);
      } else {
        onUnauthorized(email);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Neturite teisių')) {
        onUnauthorized(email);
      } else {
        setErrorMsg(err.message || 'Prisijungimo klaida');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 to-slate-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" id="login-container">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <SchoolLogo badge size="lg" />
        </div>
        <div className="flex items-center justify-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-200/80 py-1 px-3 rounded-full w-fit mx-auto mb-2.5 shadow-2xs">
          <School className="w-3.5 h-3.5 text-amber-700" />
          <span>Tryškių Lazdynų Pelėdos gimnazija</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Telefonų pažeidimų registras
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
          Moksleivių telefonų naudojimo taisyklių pažeidimų fiksavimo ir apskaitos sistema
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-xl rounded-2xl border border-slate-200/80">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Real Google OAuth Button (Active when Client ID is configured) */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Prisijungimas su Google paskyra
            </label>

            <div className="flex flex-col items-center justify-center min-h-[48px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <div ref={googleBtnRef} className="w-full flex justify-center" id="google-signin-element" />

              {!googleClientId && (
                <div className="text-center py-2 px-3 text-xs text-slate-500">
                  <div className="flex items-center justify-center text-amber-700 font-medium mb-1">
                    <Sparkles className="w-4 h-4 mr-1 text-amber-600" />
                    <span>Google OAuth paruoštas naudojimui</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Kai subdomene bus įrašytas <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">GOOGLE_CLIENT_ID</code>, čia veiks tiesioginis Google mygtukas.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-medium">
                Greita prieiga mokytojams
              </span>
            </div>
          </div>

          {/* Quick preset logins for instant evaluation & demonstration */}
          <div className="space-y-2.5">
            <button
              id="login-admin-kestutis"
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin(defaultAdminEmail, 'Kęstutis Labanauskas')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-purple-950 text-sm flex items-center">
                    Kęstutis Labanauskas
                    <span className="ml-1.5 px-1.5 py-0.2 bg-purple-200 text-purple-800 rounded text-[10px] font-bold">
                      Admin
                    </span>
                  </div>
                  <div className="text-xs text-purple-700/80 font-mono">{defaultAdminEmail}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              id="login-teacher-ona"
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('mokytoja.ona@tryskiumokykla.lt', 'Ona Kazlauskienė')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-amber-950 text-sm flex items-center">
                    Ona Kazlauskienė
                    <span className="ml-1.5 px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded text-[10px] font-bold">
                      Mokytoja
                    </span>
                  </div>
                  <div className="text-xs text-amber-700/80 font-mono">mokytoja.ona@tryskiumokykla.lt</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Test whitelist rejection button */}
            <button
              id="login-unauthorized-test"
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('nepakviestas.asmuo@gmail.com', 'Neautorizuotas Asmuo')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-400 group-hover:bg-red-500 text-white flex items-center justify-center font-bold text-xs transition-colors">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-slate-700 group-hover:text-red-900 text-xs">
                    Išbandyti neautorizuotą paskyrą (patikrinimas)
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">nepakviestas.asmuo@gmail.com</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-red-600">
                Tikrinti draudimą
              </span>
            </button>
          </div>

          {/* Custom email login (for testing any other email against whitelist) */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <details className="text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900 mb-2 select-none">
                Prisijungti su kitu mokyklos el. paštu...
              </summary>
              <div className="space-y-2 pt-2">
                <input
                  type="email"
                  placeholder="vardas.pavarde@tryskiumokykla.lt"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Vardas Pavardė (neprivaloma)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={loading || !customEmail}
                  onClick={() => handleDemoLogin(customEmail, customName)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Jungiamasi...' : 'Tikrinti leidimą ir prisijungti'}
                </button>
              </div>
            </details>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Tik mokyklos administracijos patvirtinti mokytojų el. pašto adresai gali prisijungti prie šios sistemos.
          </div>
        </div>
      </div>
    </div>
  );
};
