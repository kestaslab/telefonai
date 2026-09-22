import React, { useState } from 'react';
import {
  Globe,
  Server,
  Shield,
  Check,
  Copy,
  Terminal,
  FileCode,
  ExternalLink,
  CheckCircle2,
  Zap,
  Network,
  ArrowRight
} from 'lucide-react';

export const SubdomainGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const envConfig = `PORT=3000
NODE_ENV=production
APP_URL="https://telefonai.tryskiumokykla.lt"
GOOGLE_CLIENT_ID="548879036435-974ooqs0ujglk8j2n4fsoircvhpudt2.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID="548879036435-974ooqs0ujglk8j2n4fsoircvhpudt2.apps.googleusercontent.com"
ADMIN_EMAIL="kestutis.labanauskas@tryskiumokykla.lt"`;

  const proxmoxCommand = `# ==============================================================================
# PROXMOX LXC KONTEINERIO DIEGIMAS IR PALEIDIMAS (Debian 12 / Ubuntu 24.04)
# Be Nginx ir be Certbot konteineryje – srautas ateina per išorinį HTTPS tunelį
# ==============================================================================

# 1. Atnaujiname paketus ir įdiegiame bazines priemones
apt update && apt upgrade -y
apt install -y curl git nano

# 2. Įdiegiame naujausią Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Patikriname versiją:
node -v

# 3. Sukuriame aplikacijos aplanką ir pereiname į jį
mkdir -p /opt/telefonai
cd /opt/telefonai

# (Įkelkite šios aplikacijos failus į /opt/telefonai aplanką)

# 4. Įdiegiame priklausomybes ir sukompiliuojame produkcinį paketą
npm install
npm run build

# 5. Sukuriame .env konfigūracinį failą
cat << 'EOF' > .env
PORT=3000
NODE_ENV=production
APP_URL="https://telefonai.tryskiumokykla.lt"
GOOGLE_CLIENT_ID="548879036435-974ooqs0ujglk8j2n4fsoircvhpudt2.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID="548879036435-974ooqs0ujglk8j2n4fsoircvhpudt2.apps.googleusercontent.com"
ADMIN_EMAIL="kestutis.labanauskas@tryskiumokykla.lt"
EOF

# 6. Įdiegiame PM2 procesų valdytoją ir paleidžiame tarnybą
npm install -g pm2
pm2 start dist/server.cjs --name "telefonai"
pm2 save
pm2 startup
# (Nukopijuokite ir paleiskite 'pm2 startup' išvestą komandą automatinam startavimui po perkrovimo)

# 7. Patikriname, ar aplikacija veikia lokaliai:
curl -I http://localhost:3000/api/health
`;

  const tunnelConfig = `# Pavyzdinė tunelio (pvz., Cloudflare Tunnel / cloudflared) taisyklė:
# Prieiga: https://telefonai.tryskiumokykla.lt

ingress:
  - hostname: telefonai.tryskiumokykla.lt
    service: http://localhost:3000
    # arba jei tunelis veikia kitame mazge:
    # service: http://<PROXMOX_LXC_IP>:3000
  - service: http_status:404
`;

  return (
    <div className="max-w-5xl mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-6" id="subdomain-guide-container">
      {/* Title & Architecture Badge */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
            <Globe className="w-4 h-4 text-amber-600" />
            <span>Proxmox LXC + Išorinis Tunelis</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Be Nginx / Be Certbot konteineryje
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Diegimas Proxmox LXC su išoriniu tuneliu
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          Aplikacija pasiekiama adresu <strong className="text-blue-700 font-mono">https://telefonai.tryskiumokykla.lt</strong> per
          išorinį tunelį (pvz., Cloudflare Tunnel ar išorinį atvirkštinį proxy). Vietiniame konteineryje Nginx ir Certbot nereikalingi – aplikaciją tiesiogiai prižiūri Node.js / PM2 ant 3000 prievado, o HTTPS apsaugą suteikia tunelis.
        </p>

        {/* Traffic Flow Schema */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-700">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Vartotojo naršyklė: <code className="text-blue-700 font-mono">https://telefonai.tryskiumokykla.lt</code></span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
          <div className="flex items-center space-x-1.5 text-amber-800">
            <Network className="w-4 h-4 text-amber-600" />
            <span>Išorinis tunelis (HTTPS / SSL)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
          <div className="flex items-center space-x-1.5 text-slate-900">
            <Server className="w-4 h-4 text-slate-700" />
            <span>Proxmox LXC CT: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">Port 3000</code></span>
          </div>
        </div>
      </div>

      {/* .env Configuration (Exact values provided) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-800 text-sm">1. Serverio .env failas (/opt/telefonai/.env)</span>
          </div>
          <button
            onClick={() => copyToClipboard(envConfig, 'env')}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
          >
            {copiedId === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedId === 'env' ? 'Nukopijuota!' : 'Kopijuoti .env'}</span>
          </button>
        </div>
        <pre className="p-4 bg-slate-900 text-amber-300 text-xs font-mono overflow-x-auto leading-relaxed">
          {envConfig}
        </pre>
      </div>

      {/* Proxmox LXC Shell Commands */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-800 text-sm">2. Komandos Proxmox LXC konteineryje (Debian 12 / Ubuntu 24.04)</span>
          </div>
          <button
            onClick={() => copyToClipboard(proxmoxCommand, 'proxmox')}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
          >
            {copiedId === 'proxmox' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedId === 'proxmox' ? 'Nukopijuota!' : 'Kopijuoti Proxmox komandas'}</span>
          </button>
        </div>
        <pre className="p-4 bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto leading-relaxed">
          {proxmoxCommand}
        </pre>
      </div>

      {/* Tunelio nukreipimo nustatymas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-800 text-sm">3. Tunelio nukreipimo taisyklė</span>
          </div>
          <button
            onClick={() => copyToClipboard(tunnelConfig, 'tunnel')}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
          >
            {copiedId === 'tunnel' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedId === 'tunnel' ? 'Nukopijuota!' : 'Kopijuoti tunelio taisyklę'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-50 text-xs text-slate-600 border-b border-slate-200">
          Savo tunelio valdymo pulte (pvz., Cloudflare Zero Trust / Networks / Tunnels arba lokaliame <code>config.yml</code>) nukreipkite srautą tiesiai į Node.js:
        </div>
        <pre className="p-4 bg-slate-900 text-cyan-300 text-xs font-mono overflow-x-auto leading-relaxed">
          {tunnelConfig}
        </pre>
      </div>

      {/* Google Cloud Console OAuth 2.0 reikalavimai */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm sm:text-base">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span>Google OAuth 2.0 nustatymai Google Cloud Console</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Kadangi tunelis užtikrina tikrą viešą <strong>HTTPS</strong> ryšį, Google prisijungimas veiks 100% sklandžiai.
          Patikrinkite savo Google Cloud projekto nustatymus:
        </p>

        <div className="bg-white border border-blue-200/80 rounded-xl p-4 space-y-2 text-xs text-slate-800 font-mono">
          <div>
            <strong className="text-slate-600 uppercase text-2xs block mb-0.5">Authorized JavaScript origins:</strong>
            <span className="text-blue-700 font-bold text-sm">https://telefonai.tryskiumokykla.lt</span>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <strong className="text-slate-600 uppercase text-2xs block mb-0.5">Client ID:</strong>
            <span className="text-slate-900 font-semibold break-all">548879036435-974ooqs0ujglk8j2n4fsoircvhpudt2.apps.googleusercontent.com</span>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-1 pt-1">
          <p>
            • <strong>Prisijungti galės:</strong> Tik mokytojai ir vadovai, kurių el. paštas yra patvirtintas sistemos darbuotojų sąraše (Whitelist).
          </p>
          <p>
            • <strong>Pagrindinis administratorius:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-semibold">kestutis.labanauskas@tryskiumokykla.lt</code> turi pilnas teises valdyti naudotojus, nustatymus ir atlikti archyvavimą.
          </p>
        </div>
      </div>

      {/* Useful PM2 Management Commands */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
        <div className="font-bold text-slate-800 text-sm flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <span>Naudingos priežiūros komandos Proxmox serveryje:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-slate-700">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <strong>pm2 status</strong> – peržiūrėti tarnybos būseną ir atminties sąnaudas
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <strong>pm2 logs telefonai</strong> – stebėti realaus laiko prisijungimo įrašus
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <strong>pm2 restart telefonai</strong> – perkrauti aplikaciją atlikus kodo atnaujinimus
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <strong>pm2 stop telefonai</strong> – laikinai sustabdyti aplikaciją
          </div>
        </div>
      </div>
    </div>
  );
};
