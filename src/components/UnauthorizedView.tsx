import React from 'react';
import { AlertTriangle, LogOut, Copy, Check, Mail } from 'lucide-react';

interface UnauthorizedViewProps {
  email: string;
  onLogout: () => void;
  adminEmail?: string;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  email,
  onLogout,
  adminEmail = 'kestutis.labanauskas@tryskiumokykla.lt',
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" id="unauthorized-container">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden text-center p-8">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
          <AlertTriangle className="w-9 h-9" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Prieiga apribota
        </h2>

        {/* The exact prompt requirement message */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-red-800 text-sm font-semibold leading-relaxed">
          Neturite teisių pasiekti šią sistemą. Kreipkitės į administratorių.
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 mb-6 text-left">
          <div className="font-medium text-slate-700 mb-1">Jūsų prisijungimo el. paštas:</div>
          <div className="font-mono bg-white p-2 rounded border border-slate-300 text-slate-800 break-all select-all font-semibold">
            {email || 'Nenurodytas'}
          </div>
          <p className="mt-2 text-slate-500">
            Šis el. pašto adresas nėra įtrauktas į mokyklos įgaliotų mokytojų baltąjį sąrašą.
          </p>
        </div>

        <div className="mb-6 text-left bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
          <div className="font-semibold flex items-center mb-1">
            <Mail className="w-4 h-4 mr-1.5 text-amber-700" />
            Sistemos administratoriaus kontaktai:
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono font-medium text-slate-800 text-xs">{adminEmail}</span>
            <button
              onClick={handleCopy}
              className="px-2 py-1 bg-white border border-amber-300 hover:bg-amber-100 rounded text-[11px] font-semibold flex items-center text-amber-900"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1 text-emerald-600" />
                  Nukopijuota
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Kopijuoti
                </>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onLogout}
          id="unauthorized-logout-btn"
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Atsijungti ir bandyti su kita Google paskyra</span>
        </button>
      </div>
    </div>
  );
};
