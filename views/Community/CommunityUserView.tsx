import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Plane, Tv, Clapperboard, Film, BookOpen, Gamepad2, User, Star, Loader2 } from 'lucide-react';
import { CommunityUser, CommunityMediaItem, CommunityTripItem } from '../../hooks/useCommunity';
import { supabase } from '../../services/supabaseClient';

interface Props {
  user: CommunityUser;
  onBack: () => void;
  fetchUserMedia: (userId: string, table: string) => Promise<CommunityMediaItem[]>;
  fetchUserTrips: (userId: string) => Promise<CommunityTripItem[]>;
}

type Tab = 'series' | 'movies' | 'animes' | 'books' | 'games' | 'finance' | 'vacation';

const tabConfig: { id: Tab; label: string; icon: React.ReactNode; communityKey: keyof CommunityUser; table?: string }[] = [
  { id: 'series', label: 'Séries', icon: <Tv className="w-4 h-4" />, communityKey: 'community_series', table: 'ent_series' },
  { id: 'movies', label: 'Filmes', icon: <Clapperboard className="w-4 h-4" />, communityKey: 'community_movies', table: 'ent_movies' },
  { id: 'animes', label: 'Animes', icon: <Film className="w-4 h-4" />, communityKey: 'community_animes', table: 'ent_animes' },
  { id: 'books', label: 'Livros', icon: <BookOpen className="w-4 h-4" />, communityKey: 'community_books', table: 'ent_books' },
  { id: 'games', label: 'Jogos', icon: <Gamepad2 className="w-4 h-4" />, communityKey: 'community_games', table: 'ent_games' },
  { id: 'finance', label: 'Financeiro', icon: <Wallet className="w-4 h-4" />, communityKey: 'community_finance' },
  { id: 'vacation', label: 'Férias', icon: <Plane className="w-4 h-4" />, communityKey: 'community_vacation' },
];

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  WATCHING: 'Assistindo',
  COMPLETED: 'Concluído',
  CASUAL: 'Casual',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  WATCHING: 'bg-blue-500/20 text-blue-400',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400',
  CASUAL: 'bg-purple-500/20 text-purple-400',
};

export const CommunityUserView: React.FC<Props> = ({ user, onBack, fetchUserMedia, fetchUserTrips }) => {
  const availableTabs = tabConfig.filter(t => user[t.communityKey] === true);
  const [activeTab, setActiveTab] = useState<Tab>(availableTabs[0]?.id || 'series');
  const [mediaItems, setMediaItems] = useState<CommunityMediaItem[]>([]);
  const [trips, setTrips] = useState<CommunityTripItem[]>([]);
  const [financeData, setFinanceData] = useState<{ categories: any[]; transactions: any[] }>({ categories: [], transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const tab = tabConfig.find(t => t.id === activeTab);
      if (!tab) return;

      if (tab.table) {
        const items = await fetchUserMedia(user.user_id, tab.table);
        setMediaItems(items);
      } else if (activeTab === 'vacation') {
        const t = await fetchUserTrips(user.user_id);
        setTrips(t);
      } else if (activeTab === 'finance') {
        const [catRes, txRes] = await Promise.all([
          supabase.from('finance_categories').select('*').eq('user_id', user.user_id),
          supabase.from('finance_transactions').select('*').eq('user_id', user.user_id),
        ]);
        setFinanceData({ categories: catRes.data || [], transactions: txRes.data || [] });
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab, user.user_id]);

  const calculateAge = (dob: string | null): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = calculateAge(user.date_of_birth);

  const renderMedia = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {mediaItems.map(item => (
        <div key={item.id} className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
          {item.poster_url ? (
            <img src={item.poster_url} alt={item.title} className="w-full aspect-[2/3] object-cover" />
          ) : (
            <div className="w-full aspect-[2/3] bg-slate-800 flex items-center justify-center">
              <Film className="w-8 h-8 text-slate-600" />
            </div>
          )}
          <div className="p-2.5">
            <p className="text-xs font-medium text-white truncate">{item.title}</p>
            {item.author && <p className="text-[10px] text-slate-500 truncate">{item.author}</p>}
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[item.status] || 'bg-slate-700 text-slate-400'}`}>
                {statusLabels[item.status] || item.status}
              </span>
              {item.rating ? (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                  <Star className="w-2.5 h-2.5 fill-current" /> {item.rating}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
      {mediaItems.length === 0 && !loading && (
        <p className="col-span-full text-center text-slate-500 py-10">Nenhum item encontrado.</p>
      )}
    </div>
  );

  const renderVacation = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {trips.map(trip => (
        <div key={trip.id} className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
          {trip.cover_url ? (
            <img src={trip.cover_url} alt={trip.destination} className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-36 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 flex items-center justify-center">
              <Plane className="w-10 h-10 text-blue-400/50" />
            </div>
          )}
          <div className="p-3">
            <p className="text-sm font-semibold text-white">{trip.destination}</p>
            <p className="text-xs text-slate-400 mt-1">
              {trip.start_date && trip.end_date ? `${new Date(trip.start_date).toLocaleDateString('pt-BR')} - ${new Date(trip.end_date).toLocaleDateString('pt-BR')}` : `Ano: ${trip.year}`}
            </p>
          </div>
        </div>
      ))}
      {trips.length === 0 && !loading && (
        <p className="col-span-full text-center text-slate-500 py-10">Nenhuma viagem encontrada.</p>
      )}
    </div>
  );

  const renderFinance = () => {
    const { categories, transactions } = financeData;
    const incomeCategories = categories.filter(c => c.type === 'INCOME');
    const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

    const getCategoryTotal = (catId: string) =>
      transactions.filter(t => t.category_id === catId).reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncome = incomeCategories.reduce((sum, c) => sum + getCategoryTotal(c.id), 0);
    const totalExpense = expenseCategories.reduce((sum, c) => sum + getCategoryTotal(c.id), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-emerald-400 mb-1">Receitas</p>
            <p className="text-lg font-bold text-emerald-400">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-red-400 mb-1">Despesas</p>
            <p className="text-lg font-bold text-red-400">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-indigo-400 mb-1">Saldo</p>
            <p className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {(totalIncome - totalExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{ title: 'Receitas', cats: incomeCategories, color: 'emerald' }, { title: 'Despesas', cats: expenseCategories, color: 'red' }].map(section => (
            <div key={section.title} className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.cats.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center">
                    <span className="text-xs text-slate-300">{cat.name}</span>
                    <span className={`text-xs font-medium text-${section.color}-400`}>
                      R$ {getCategoryTotal(cat.id).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                {section.cats.length === 0 && <p className="text-xs text-slate-500">Nenhuma categoria.</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar à Comunidade
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-white/10">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-slate-500" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{user.display_name || 'Usuário'}</h1>
          {age !== null && <p className="text-sm text-slate-400">{age} anos</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <>
          {['series', 'movies', 'animes', 'books', 'games'].includes(activeTab) && renderMedia()}
          {activeTab === 'vacation' && renderVacation()}
          {activeTab === 'finance' && renderFinance()}
        </>
      )}
    </div>
  );
};
