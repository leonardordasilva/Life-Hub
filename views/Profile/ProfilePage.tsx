import React, { useState, useEffect } from 'react';
import { UserProfile, useProfile } from '../../hooks/useProfile';
import { useToast } from '../../components/Toast';
import { Camera, User, Save, Loader2, Wallet, Plane, Film, Gamepad2, Globe, Info } from 'lucide-react';

interface ProfilePageProps {
  userId: string;
  profile: UserProfile;
  userEmail: string;
  onUpdate: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId, profile, userEmail, onUpdate }) => {
  const { updateProfile, uploadAvatar } = useProfile(userId);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [moduleFinance, setModuleFinance] = useState(profile.module_finance);
  const [moduleVacation, setModuleVacation] = useState(profile.module_vacation);
  const [moduleEntertainment, setModuleEntertainment] = useState(profile.module_entertainment);
  const [moduleGames, setModuleGames] = useState(profile.module_games);

  const [entSeries, setEntSeries] = useState(profile.ent_series);
  const [entMovies, setEntMovies] = useState(profile.ent_movies);
  const [entAnimes, setEntAnimes] = useState(profile.ent_animes);
  const [entBooks, setEntBooks] = useState(profile.ent_books);

  const [communityFinance, setCommunityFinance] = useState(profile.community_finance);
  const [communityVacation, setCommunityVacation] = useState(profile.community_vacation);
  const [communityGames, setCommunityGames] = useState(profile.community_games);
  const [communitySeries, setCommunitySeries] = useState(profile.community_series);
  const [communityMovies, setCommunityMovies] = useState(profile.community_movies);
  const [communityAnimes, setCommunityAnimes] = useState(profile.community_animes);
  const [communityBooks, setCommunityBooks] = useState(profile.community_books);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const hasAnyModule = moduleFinance || moduleVacation || moduleEntertainment || moduleGames;
  const hasEntSubType = !moduleEntertainment || entSeries || entMovies || entAnimes || entBooks;

  const handleSave = async () => {
    if (displayName.trim().length < 2) {
      showToast('Nome deve ter pelo menos 2 caracteres.', 'error');
      return;
    }
    if (!dateOfBirth) {
      showToast('Data de nascimento é obrigatória.', 'error');
      return;
    }
    if (!hasAnyModule) {
      showToast('Pelo menos 1 módulo deve estar ativo.', 'error');
      return;
    }
    if (!hasEntSubType) {
      showToast('Selecione pelo menos 1 tipo de entretenimento.', 'error');
      return;
    }

    setSaving(true);
    try {
      let newAvatarUrl = profile.avatar_url;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile);
      }

      await updateProfile({
        display_name: displayName.trim(),
        date_of_birth: dateOfBirth,
        avatar_url: newAvatarUrl,
        module_finance: moduleFinance,
        module_vacation: moduleVacation,
        module_entertainment: moduleEntertainment,
        module_games: moduleGames,
        ent_series: entSeries,
        ent_movies: entMovies,
        ent_animes: entAnimes,
        ent_books: entBooks,
        community_finance: moduleFinance ? communityFinance : false,
        community_vacation: moduleVacation ? communityVacation : false,
        community_games: moduleGames ? communityGames : false,
        community_series: entSeries ? communitySeries : false,
        community_movies: entMovies ? communityMovies : false,
        community_animes: entAnimes ? communityAnimes : false,
        community_books: entBooks ? communityBooks : false,
      });

      showToast('Perfil atualizado com sucesso!', 'success');
      onUpdate();
    } catch (e: any) {
      showToast(e.message || 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleClass = (on: boolean) => `w-12 h-7 rounded-full transition-all duration-300 relative ${on ? 'bg-indigo-600' : 'bg-slate-700'}`;
  const dotClass = (on: boolean) => `absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${on ? 'left-6' : 'left-1'}`;

  const ModuleRow: React.FC<{ label: string; icon: React.ReactNode; enabled: boolean; onToggle: (v: boolean) => void; community: boolean; onCommunityToggle: (v: boolean) => void }> = ({ label, icon, enabled, onToggle, community, onCommunityToggle }) => (
    <div className={`p-4 rounded-xl border transition-all ${enabled ? 'bg-slate-800/60 border-white/10' : 'bg-slate-900/30 border-white/5 opacity-60'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <button onClick={() => onToggle(!enabled)} className={toggleClass(enabled)}>
          <div className={dotClass(enabled)} />
        </button>
      </div>
      {enabled && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1"><Globe className="w-3 h-3" /> Comunidade</span>
          <button onClick={() => onCommunityToggle(!community)} className={`w-10 h-6 rounded-full transition-all relative ${community ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${community ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full min-h-full p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Meu Perfil</h1>

      {/* Avatar + Name */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden flex items-center justify-center">
            {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-600" />}
          </div>
          <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="w-5 h-5 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome de exibição</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" maxLength={50} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
            <input type="email" value={profile.email || userEmail} disabled className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed text-sm" />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-medium text-slate-400 mb-1">Data de nascimento</label>
        <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Módulos</h2>
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>A visibilidade comunitária é uma preferência para uma funcionalidade futura.</span>
        </div>
        <ModuleRow label="Financeiro" icon={<Wallet className="w-5 h-5 text-amber-400" />} enabled={moduleFinance} onToggle={(v) => { setModuleFinance(v); if (!v) setCommunityFinance(false); }} community={communityFinance} onCommunityToggle={setCommunityFinance} />
        <ModuleRow label="Férias" icon={<Plane className="w-5 h-5 text-cyan-400" />} enabled={moduleVacation} onToggle={(v) => { setModuleVacation(v); if (!v) setCommunityVacation(false); }} community={communityVacation} onCommunityToggle={setCommunityVacation} />
        
        {/* Entertainment */}
        <div className={`rounded-xl border transition-all ${moduleEntertainment ? 'bg-slate-800/60 border-white/10' : 'bg-slate-900/30 border-white/5 opacity-60'}`}>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><Film className="w-5 h-5 text-pink-400" /><span className="text-sm font-medium text-white">Entretenimento</span></div>
            <button onClick={() => { setModuleEntertainment(!moduleEntertainment); if (moduleEntertainment) { setEntSeries(false); setEntMovies(false); setEntAnimes(false); setEntBooks(false); setCommunitySeries(false); setCommunityMovies(false); setCommunityAnimes(false); setCommunityBooks(false); } }} className={toggleClass(moduleEntertainment)}>
              <div className={dotClass(moduleEntertainment)} />
            </button>
          </div>
          {moduleEntertainment && (
            <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
              {[
                { label: 'Séries', enabled: entSeries, setEnabled: setEntSeries, community: communitySeries, setCommunity: setCommunitySeries },
                { label: 'Filmes', enabled: entMovies, setEnabled: setEntMovies, community: communityMovies, setCommunity: setCommunityMovies },
                { label: 'Animes', enabled: entAnimes, setEnabled: setEntAnimes, community: communityAnimes, setCommunity: setCommunityAnimes },
                { label: 'Livros', enabled: entBooks, setEnabled: setEntBooks, community: communityBooks, setCommunity: setCommunityBooks },
              ].map((sub) => (
                <div key={sub.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { sub.setEnabled(!sub.enabled); if (sub.enabled) sub.setCommunity(false); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${sub.enabled ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                      {sub.enabled && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className="text-sm text-white">{sub.label}</span>
                  </div>
                  {sub.enabled && (
                    <button onClick={() => sub.setCommunity(!sub.community)} className={`p-1 rounded ${sub.community ? 'text-emerald-400' : 'text-slate-600'}`}>
                      <Globe className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <ModuleRow label="Jogos" icon={<Gamepad2 className="w-5 h-5 text-violet-400" />} enabled={moduleGames} onToggle={(v) => { setModuleGames(v); if (!v) setCommunityGames(false); }} community={communityGames} onCommunityToggle={setCommunityGames} />
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Salvar Alterações
      </button>
    </div>
  );
};
