import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, UserCheck, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import type { CurrentUser, WhitelistedUser, UserRole } from '../types';
import { getWhitelist, addToWhitelist, removeFromWhitelist } from '../api';

interface WhitelistManagementProps {
  user: CurrentUser;
}

export const WhitelistManagement: React.FC<WhitelistManagementProps> = ({ user }) => {
  const [list, setList] = useState<WhitelistedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [submitting, setSubmitting] = useState(false);

  const loadList = () => {
    setLoading(true);
    getWhitelist()
      .then((data) => setList(data))
      .catch((err) => setErrorMsg(err.message || 'Nepavyko gauti leidžiamų mokytojų sąrašo'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setErrorMsg('Nurodykite teisingą el. pašto adresą.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await addToWhitelist({
        email: newEmail.trim().toLowerCase(),
        name: newName.trim() || newEmail.split('@')[0],
        role: newRole,
      });

      setSuccessMsg(`Mokytojas (-a) ${newEmail} sėkmingai pridėtas į baltąjį sąrašą!`);
      setNewEmail('');
      setNewName('');
      loadList();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pridėti naudotojo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (email.toLowerCase() === 'kestutis.labanauskas@tryskiumokykla.lt') {
      setErrorMsg('Pagrindinis administratorius negali būti pašalintas.');
      return;
    }

    if (!window.confirm(`Ar tikrai norite atimti prieigą iš ${email}?`)) {
      return;
    }

    try {
      await removeFromWhitelist(email);
      setSuccessMsg(`Prieiga atimta iš ${email}.`);
      loadList();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepavyko pašalinti naudotojo');
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-6" id="whitelist-management-container">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-700 mb-1">
          <Users className="w-4 h-4 text-purple-600" />
          <span>Prieigos kontrolė</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Leidžiamų mokytojų sąrašas (Baltasis sąrašas)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Tik šiame sąraše esantys Google paskyrų el. paštai gali prisijungti prie registravimo sistemos.
        </p>
      </div>

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

      {/* Add New Teacher Form (Admin Only) */}
      {isAdmin ? (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-2xs p-4 sm:p-6" id="add-teacher-form">
          <div className="flex items-center space-x-2 mb-3">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Pridėti naują mokytoją į sistemą
            </h2>
          </div>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Google el. paštas <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="mokytojas@tryskiumokykla.lt"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vardas ir Pavardė
              </label>
              <input
                type="text"
                placeholder="pvz., Jonas Jonaitis (Fizika)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vaidmuo
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value="teacher">Mokytojas</option>
                <option value="admin">Administratorius</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Pridedama...' : 'Pridėti'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Jūs esate prisijungęs kaip <strong>Mokytojas</strong> (peržiūros teisė). Naujus el. pašto adresus įtraukti gali tik <strong>Administratorius</strong>.
          </span>
        </div>
      )}

      {/* Whitelist Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden" id="whitelist-table-card">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-sm">
            Aktyvūs įgalioti vartotojai ({list.length})
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Kraunamas sąrašas...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((item) => {
              const isProtectedAdmin = item.email.toLowerCase() === 'kestutis.labanauskas@tryskiumokykla.lt';

              return (
                <div key={item.email} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs ${
                      item.role === 'admin' ? 'bg-purple-600' : 'bg-slate-700'
                    }`}>
                      {item.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-sm sm:text-base">
                          {item.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.role === 'admin' ? 'Administratorius' : 'Mokytojas'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-500 font-mono space-x-2 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.email}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isAdmin && !isProtectedAdmin && (
                      <button
                        onClick={() => handleRemove(item.email)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Pašalinti iš sąrašo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isProtectedAdmin && (
                      <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                        Pagrindinis administratorius
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
