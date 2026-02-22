import React from 'react';
import { User, Wallet, Plane, Film, Gamepad2, Tv, Clapperboard, BookOpen, Loader2, Users } from 'lucide-react';
import { CommunityUser } from '../../hooks/useCommunity';

interface CommunityPageProps {
  users: CommunityUser[];
  loading: boolean;
  onSelectUser: (user: CommunityUser) => void;
}

const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const getModuleBadges = (user: CommunityUser) => {
  const badges: { label: string; icon: React.ReactNode; color: string }[] = [];
  if (user.community_finance) badges.push({ label: 'Financeiro', icon: <Wallet className="w-3 h-3" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' });
  if (user.community_vacation) badges.push({ label: 'Férias', icon: <Plane className="w-3 h-3" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' });
  if (user.community_series) badges.push({ label: 'Séries', icon: <Tv className="w-3 h-3" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' });
  if (user.community_movies) badges.push({ label: 'Filmes', icon: <Clapperboard className="w-3 h-3" />, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' });
  if (user.community_animes) badges.push({ label: 'Animes', icon: <Film className="w-3 h-3" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' });
  if (user.community_books) badges.push({ label: 'Livros', icon: <BookOpen className="w-3 h-3" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' });
  if (user.community_games) badges.push({ label: 'Jogos', icon: <Gamepad2 className="w-3 h-3" />, color: 'bg-red-500/20 text-red-400 border-red-500/30' });
  return badges;
};

export const CommunityPage: React.FC<CommunityPageProps> = ({ users, loading, onSelectUser }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
          <Users className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Comunidade</h1>
          <p className="text-sm text-slate-400">Explore o que outros membros estão acompanhando</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum membro na comunidade ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const age = calculateAge(user.date_of_birth);
            const badges = getModuleBadges(user);
            return (
              <button
                key={user.user_id}
                onClick={() => onSelectUser(user)}
                className="text-left bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-white/10 flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate group-hover:text-indigo-300 transition-colors">{user.display_name || 'Usuário'}</p>
                    {age !== null && <p className="text-xs text-slate-500">{age} anos</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <span key={b.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${b.color}`}>
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
