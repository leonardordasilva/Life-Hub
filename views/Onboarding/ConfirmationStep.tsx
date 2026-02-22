import React from 'react';
import { User, Wallet, Plane, Film, Gamepad2, Globe, Check } from 'lucide-react';

interface ConfirmationStepProps {
  displayName: string;
  email: string;
  dateOfBirth: string;
  avatarPreview: string | null;
  modules: {
    finance: { enabled: boolean; community: boolean };
    vacation: { enabled: boolean; community: boolean };
    entertainment: boolean;
    entSubTypes: {
      series: { enabled: boolean; community: boolean };
      movies: { enabled: boolean; community: boolean };
      animes: { enabled: boolean; community: boolean };
      books: { enabled: boolean; community: boolean };
    };
    games: { enabled: boolean; community: boolean };
  };
}

const CommunityBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
    <Globe className="w-3 h-3" /> Comunidade
  </span>
);

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  displayName, email, dateOfBirth, avatarPreview, modules
}) => {
  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const activeModules = [
    modules.finance.enabled && { label: 'Financeiro', icon: <Wallet className="w-4 h-4" />, community: modules.finance.community },
    modules.vacation.enabled && { label: 'Férias', icon: <Plane className="w-4 h-4" />, community: modules.vacation.community },
    modules.entertainment && { label: 'Entretenimento', icon: <Film className="w-4 h-4" />, community: false, subTypes: true },
    modules.games.enabled && { label: 'Jogos', icon: <Gamepad2 className="w-4 h-4" />, community: modules.games.community },
  ].filter(Boolean) as any[];

  const entSubLabels = [
    modules.entSubTypes.series.enabled && { label: 'Séries', community: modules.entSubTypes.series.community },
    modules.entSubTypes.movies.enabled && { label: 'Filmes', community: modules.entSubTypes.movies.community },
    modules.entSubTypes.animes.enabled && { label: 'Animes', community: modules.entSubTypes.animes.community },
    modules.entSubTypes.books.enabled && { label: 'Livros', community: modules.entSubTypes.books.community },
  ].filter(Boolean) as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-white/5">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-slate-600" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{displayName}</h3>
          <p className="text-xs text-slate-400">{email}</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(dateOfBirth)}</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Módulos Ativos</h4>
        <div className="space-y-2">
          {activeModules.map((mod: any) => (
            <div key={mod.label} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-white font-medium">{mod.label}</span>
              </div>
              {mod.community && <CommunityBadge />}
            </div>
          ))}
        </div>
      </div>

      {modules.entertainment && entSubLabels.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Sub-tipos de Entretenimento</h4>
          <div className="grid grid-cols-2 gap-2">
            {entSubLabels.map((sub: any) => (
              <div key={sub.label} className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-white">{sub.label}</span>
                </div>
                {sub.community && <Globe className="w-3 h-3 text-emerald-400" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
