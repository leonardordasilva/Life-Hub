import React from 'react';
import { Wallet, Plane, Film, Gamepad2, Globe, Info } from 'lucide-react';

interface ModuleConfig {
  enabled: boolean;
  community: boolean;
}

interface EntertainmentSubTypes {
  series: { enabled: boolean; community: boolean };
  movies: { enabled: boolean; community: boolean };
  animes: { enabled: boolean; community: boolean };
  books: { enabled: boolean; community: boolean };
}

interface ModulesStepProps {
  finance: ModuleConfig;
  setFinance: (v: ModuleConfig) => void;
  vacation: ModuleConfig;
  setVacation: (v: ModuleConfig) => void;
  entertainment: boolean;
  setEntertainment: (v: boolean) => void;
  entSubTypes: EntertainmentSubTypes;
  setEntSubTypes: (v: EntertainmentSubTypes) => void;
  games: ModuleConfig;
  setGames: (v: ModuleConfig) => void;
}

const ModuleToggle: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  community: boolean;
  onCommunityToggle: (v: boolean) => void;
  colorClass: string;
}> = ({ icon, label, description, enabled, onToggle, community, onCommunityToggle, colorClass }) => (
  <div className={`p-4 rounded-2xl border transition-all duration-300 ${enabled ? `bg-slate-800/80 border-white/10` : 'bg-slate-900/40 border-white/5 opacity-60'}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${enabled ? colorClass : 'bg-slate-800 text-slate-600'} transition-colors`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">{label}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`w-12 h-7 rounded-full transition-all duration-300 relative ${enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
      >
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
    {enabled && (
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Globe className="w-3 h-3" />
          <span>Compartilhar com comunidade</span>
        </div>
        <button
          onClick={() => onCommunityToggle(!community)}
          className={`w-10 h-6 rounded-full transition-all duration-300 relative ${community ? 'bg-emerald-600' : 'bg-slate-700'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${community ? 'left-4.5' : 'left-0.5'}`} />
        </button>
      </div>
    )}
  </div>
);

const SubTypeToggle: React.FC<{
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  community: boolean;
  onCommunityToggle: (v: boolean) => void;
}> = ({ label, enabled, onToggle, community, onCommunityToggle }) => (
  <div className={`flex items-center justify-between py-2 px-3 rounded-xl ${enabled ? 'bg-slate-800/50' : 'opacity-50'}`}>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onToggle(!enabled)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${enabled ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}
      >
        {enabled && <span className="text-white text-xs">✓</span>}
      </button>
      <span className="text-sm text-white">{label}</span>
    </div>
    {enabled && (
      <button
        onClick={() => onCommunityToggle(!community)}
        className={`p-1 rounded transition-colors ${community ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
        title={community ? 'Visível para comunidade' : 'Privado'}
      >
        <Globe className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const ModulesStep: React.FC<ModulesStepProps> = ({
  finance, setFinance, vacation, setVacation,
  entertainment, setEntertainment, entSubTypes, setEntSubTypes,
  games, setGames
}) => {
  const handleEntToggle = (enabled: boolean) => {
    setEntertainment(enabled);
    if (!enabled) {
      setEntSubTypes({
        series: { enabled: false, community: false },
        movies: { enabled: false, community: false },
        animes: { enabled: false, community: false },
        books: { enabled: false, community: false },
      });
    }
  };

  const updateSubType = (key: keyof EntertainmentSubTypes, field: 'enabled' | 'community', value: boolean) => {
    const updated = { ...entSubTypes };
    updated[key] = { ...updated[key], [field]: value };
    if (field === 'enabled' && !value) updated[key].community = false;
    setEntSubTypes(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>A funcionalidade de comunidade está em desenvolvimento. Por enquanto, marcar a opção apenas registra sua preferência para quando estiver disponível.</span>
      </div>

      <ModuleToggle
        icon={<Wallet className="w-5 h-5" />}
        label="Financeiro"
        description="Receitas, despesas e reservas"
        enabled={finance.enabled}
        onToggle={(v) => setFinance({ enabled: v, community: v ? finance.community : false })}
        community={finance.community}
        onCommunityToggle={(v) => setFinance({ ...finance, community: v })}
        colorClass="bg-amber-500/20 text-amber-400"
      />

      <ModuleToggle
        icon={<Plane className="w-5 h-5" />}
        label="Férias"
        description="Viagens, voos, hotéis e passeios"
        enabled={vacation.enabled}
        onToggle={(v) => setVacation({ enabled: v, community: v ? vacation.community : false })}
        community={vacation.community}
        onCommunityToggle={(v) => setVacation({ ...vacation, community: v })}
        colorClass="bg-cyan-500/20 text-cyan-400"
      />

      {/* Entertainment with sub-types */}
      <div className={`rounded-2xl border transition-all duration-300 ${entertainment ? 'bg-slate-800/80 border-white/10' : 'bg-slate-900/40 border-white/5 opacity-60'}`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${entertainment ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-slate-600'} transition-colors`}>
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Entretenimento</h4>
              <p className="text-xs text-slate-500">Séries, filmes, animes e livros</p>
            </div>
          </div>
          <button
            onClick={() => handleEntToggle(!entertainment)}
            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${entertainment ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${entertainment ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        {entertainment && (
          <div className="px-4 pb-4 space-y-1 border-t border-white/5 pt-3">
            <SubTypeToggle label="Séries" enabled={entSubTypes.series.enabled} onToggle={(v) => updateSubType('series', 'enabled', v)} community={entSubTypes.series.community} onCommunityToggle={(v) => updateSubType('series', 'community', v)} />
            <SubTypeToggle label="Filmes" enabled={entSubTypes.movies.enabled} onToggle={(v) => updateSubType('movies', 'enabled', v)} community={entSubTypes.movies.community} onCommunityToggle={(v) => updateSubType('movies', 'community', v)} />
            <SubTypeToggle label="Animes" enabled={entSubTypes.animes.enabled} onToggle={(v) => updateSubType('animes', 'enabled', v)} community={entSubTypes.animes.community} onCommunityToggle={(v) => updateSubType('animes', 'community', v)} />
            <SubTypeToggle label="Livros" enabled={entSubTypes.books.enabled} onToggle={(v) => updateSubType('books', 'enabled', v)} community={entSubTypes.books.community} onCommunityToggle={(v) => updateSubType('books', 'community', v)} />
          </div>
        )}
      </div>

      <ModuleToggle
        icon={<Gamepad2 className="w-5 h-5" />}
        label="Jogos"
        description="Biblioteca e progresso de jogos"
        enabled={games.enabled}
        onToggle={(v) => setGames({ enabled: v, community: v ? games.community : false })}
        community={games.community}
        onCommunityToggle={(v) => setGames({ ...games, community: v })}
        colorClass="bg-violet-500/20 text-violet-400"
      />
    </div>
  );
};
