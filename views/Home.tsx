import React, { useMemo, useState, useEffect } from 'react';
import { AppSection, UserRole } from '../types';
import { useFinanceData } from '../hooks/useFinanceData';
import { useVacation } from '../hooks/useVacation';
import { useEntertainment } from '../hooks/useEntertainment';
import { useGames } from '../hooks/useGames';
import { fetchDestinationImage } from '../services/destinationImageService';
import {
    TrendingUp, TrendingDown, Film, Gamepad2, Plane, Wallet, Calendar,
    PlayCircle, ArrowUpCircle, ArrowDownCircle,
    Timer, ChevronLeft, ChevronRight, Book, Zap,
    Trophy, Sun, Moon, Sunrise, PiggyBank, Activity, AlertTriangle,
    ArrowRight, Check
} from 'lucide-react';

interface HomeProps {
    onNavigate: (section: AppSection) => void;
    role: UserRole;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, role }) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const isAdmin = role === 'ADMIN';

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [currentGameIndex, setCurrentGameIndex] = useState(0);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Bom dia');
        else if (hour < 18) setGreeting('Boa tarde');
        else setGreeting('Boa noite');
    }, []);

    const getGreetingIcon = () => {
        const hour = new Date().getHours();
        if (hour < 12) return <Sunrise className="w-6 h-6 text-amber-400" />;
        if (hour < 18) return <Sun className="w-6 h-6 text-orange-400" />;
        return <Moon className="w-6 h-6 text-indigo-400" />;
    };

    const { transactions, categories, getReserveForYear, loading: financeLoading } = useFinanceData(role);
    const { trips, flights, hotels, tours, loading: vacationLoading } = useVacation(role);
    const { items, loading: entertainmentLoading, updateStatus, incrementProgress } = useEntertainment();
    const { games, loading: gamesLoading, updateGameStatus } = useGames();

    const [destinationImage, setDestinationImage] = useState<string | null>(null);

    const financeSummary = useMemo(() => {
        if (!isAdmin || financeLoading) return null;
        const initialReserve = getReserveForYear(currentYear);
        const incomeCats = categories.filter(c => c.type === 'INCOME');
        const expenseCats = categories.filter(c => c.type === 'EXPENSE');
        let yearlyContribution = 0;
        for (let m = 0; m < 12; m++) {
            const mIncome = transactions.filter(t => t.month === m && t.year === currentYear && incomeCats.some(c => c.id === t.categoryId)).reduce((sum, t) => sum + t.amount, 0);
            const mExpense = transactions.filter(t => t.month === m && t.year === currentYear && expenseCats.some(c => c.id === t.categoryId)).reduce((sum, t) => sum + t.amount, 0);
            const mBalance = mIncome - mExpense;
            yearlyContribution += (mBalance > 0 ? mBalance / 2 : mBalance);
        }
        const projectedBalance = initialReserve + yearlyContribution;
        const currentIncome = transactions.filter(t => t.month === currentMonth && t.year === currentYear && incomeCats.some(c => c.id === t.categoryId)).reduce((sum, t) => sum + t.amount, 0);
        const currentExpense = transactions.filter(t => t.month === currentMonth && t.year === currentYear && expenseCats.some(c => c.id === t.categoryId)).reduce((sum, t) => sum + t.amount, 0);
        const currentBalance = currentIncome - currentExpense;
        const maxVal = Math.max(currentIncome, currentExpense, 1);
        const incomePct = (currentIncome / maxVal) * 100;
        const expensePct = (currentExpense / maxVal) * 100;
        const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpense) / currentIncome) * 100 : 0;
        return { initialReserve, projectedBalance, currentIncome, currentExpense, currentBalance, incomePct, expensePct, savingsRate };
    }, [transactions, categories, currentYear, currentMonth, getReserveForYear, financeLoading, isAdmin]);

    const vacationSummary = useMemo(() => {
        if (!isAdmin || vacationLoading) return null;
        const trip = trips.find(t => t.year === currentYear);
        if (!trip) return null;
        let days = 0;
        let daysUntil = 0;
        let dateRange = '';
        if (trip.startDate && trip.endDate) {
            const parseDate = (str: string) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };
            const start = parseDate(trip.startDate);
            const end = parseDate(trip.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDuration = end.getTime() - start.getTime();
            days = Math.ceil(diffDuration / (1000 * 60 * 60 * 24));
            const diffUntil = start.getTime() - today.getTime();
            daysUntil = Math.ceil(diffUntil / (1000 * 60 * 60 * 24));
            const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            dateRange = `${fmt(start)} - ${fmt(end)}`;
        }
        const flightCost = flights.filter(f => f.tripId === trip.id).reduce((sum, f) => sum + f.price, 0);
        const hotelCost = hotels.filter(h => h.tripId === trip.id).reduce((sum, h) => sum + h.price, 0);
        const tourCost = tours.filter(t => t.tripId === trip.id).reduce((sum, t) => sum + (t.price || 0), 0);
        const totalCost = flightCost + hotelCost + tourCost;
        return { trip, days, daysUntil, dateRange, totalCost };
    }, [trips, flights, hotels, tours, currentYear, vacationLoading, isAdmin]);

    useEffect(() => {
        if (isAdmin && vacationSummary?.trip?.destination && !vacationSummary.trip.coverUrl) {
            fetchDestinationImage(vacationSummary.trip.destination).then(url => { if (url) setDestinationImage(url); });
        }
    }, [vacationSummary?.trip?.destination, vacationSummary?.trip?.coverUrl, isAdmin]);

    const { activeMediaList, activeGamesList } = useMemo(() => {
        if (entertainmentLoading || gamesLoading) return { activeMediaList: [], activeGamesList: [] };

        // Organização por tipo conforme solicitado: Séries, Filmes, Animes, Livros
        const watchingSeries = items.filter(i => i.type === 'SERIES' && i.status === 'WATCHING');

        const nextMovies = items.filter(i => i.type === 'MOVIE' && i.status === 'PENDING')
            .sort((a, b) => (a.releaseDate || '9999').localeCompare(b.releaseDate || '9999'));
        const nextMovie = nextMovies.length > 0 ? [nextMovies[0]] : [];

        const watchingAnimes = items.filter(i => i.type === 'ANIME' && i.status === 'WATCHING');

        const readingBooks = items.filter(i => i.type === 'BOOK' && i.status === 'WATCHING');

        const activeGames = games.filter(i => i.status === 'WATCHING');

        return {
            activeMediaList: [...watchingSeries, ...nextMovie, ...watchingAnimes, ...readingBooks],
            activeGamesList: activeGames
        };
    }, [items, games, entertainmentLoading, gamesLoading]);

    const currentMedia = activeMediaList.length > 0 ? activeMediaList[currentMediaIndex % activeMediaList.length] : null;
    const currentGame = activeGamesList.length > 0 ? activeGamesList[currentGameIndex % activeGamesList.length] : null;

    const getEntMeta = (item: any) => {
        if (!item) return { color: 'text-slate-400', bg: 'bg-slate-500/20', icon: <Film />, label: 'Entretenimento' };
        switch (item.type) {
            case 'SERIES': return { color: 'text-pink-400', bg: 'bg-pink-500/20', icon: <Film />, label: 'Série' };
            case 'ANIME': return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: <Zap />, label: 'Anime' };
            case 'BOOK': return { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: <Book />, label: 'Livro' };
            case 'MOVIE': return { color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: <PlayCircle />, label: 'Filme' };
            default: return { color: 'text-slate-400', bg: 'bg-slate-500/20', icon: <Film />, label: 'Item' };
        }
    };

    const entMeta = getEntMeta(currentMedia);
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDateFull = (date: Date) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);

    return (
        <div className="w-full min-h-full flex flex-col p-6 md:p-8 relative overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-900/10 rounded-full blur-[128px]" />
            </div>

            <header className={`${isAdmin ? 'mb-8' : 'mb-12'} flex flex-col md:flex-row justify-between md:items-end gap-4 animate-in fade-in slide-in-from-top-4 duration-700`}>
                <div>
                    <div className="flex items-center gap-3 text-slate-400 mb-4">
                        {getGreetingIcon()}
                        <span className="text-sm font-medium uppercase tracking-wider">{greeting}</span>
                    </div>
                    <h1 className={`font-bold text-white tracking-tight ${isAdmin ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>
                        {isAdmin ? 'Dashboard Administrativo' : 'Catálogo de Filmes, Séries, Animes, Livros e Games'}
                    </h1>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-slate-400 text-sm font-medium">{formatDateFull(currentDate)}</p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">Visão Geral {currentYear}</p>
                </div>
            </header>

            <div className={`${!isAdmin ? 'flex-1 flex items-center justify-center w-full' : ''}`}>
                <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-4 max-w-[1600px]' : 'lg:grid-cols-2 max-w-[1400px]'} gap-6 w-full mx-auto`}>

                    {isAdmin && (
                        <>
                            <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-all duration-300">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet className="w-32 h-32 text-emerald-500" /></div>
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400"><TrendingUp className="w-6 h-6" /></div>
                                    <div><h3 className="font-bold text-white text-lg">Fluxo de Caixa</h3><p className="text-xs text-slate-400 uppercase tracking-wide">Mês Atual</p></div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 relative z-10 mb-6">
                                    <div>
                                        <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><ArrowUpCircle className="w-3 h-3 text-emerald-400" /> Receitas</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">{financeSummary ? formatCurrency(financeSummary.currentIncome) : '...'}</p>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden"><div style={{ width: `${financeSummary?.incomePct}%` }} className="h-full bg-emerald-500 rounded-full" /></div>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><ArrowDownCircle className="w-3 h-3 text-rose-400" /> Despesas</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">{financeSummary ? formatCurrency(financeSummary.currentExpense) : '...'}</p>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden"><div style={{ width: `${financeSummary?.expensePct}%` }} className="h-full bg-rose-500 rounded-full" /></div>
                                    </div>
                                </div>
                                <div className="relative z-10 pt-4 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex flex-col"><span className="text-xs text-slate-500">Saldo Líquido</span><span className={`text-lg font-bold ${financeSummary && financeSummary.currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{financeSummary ? formatCurrency(financeSummary.currentBalance) : '...'}</span></div>
                                    {financeSummary && (financeSummary.currentBalance >= 0 ? (financeSummary.savingsRate > 0 && (<div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-1"><Activity className="w-3 h-3" />{financeSummary.savingsRate.toFixed(0)}% Economizado</div>)) : (<div className="px-3 py-1 bg-rose-500/10 border border-red-500/20 rounded-full text-xs font-bold text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{Math.abs(financeSummary.savingsRate).toFixed(0)}% Prejuízo</div>))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col hover:border-indigo-500/30 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4 text-indigo-400"><PiggyBank className="w-6 h-6" /><h3 className="font-bold text-sm uppercase tracking-wider">Reserva {currentYear}</h3></div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <p className="text-xs text-slate-400 mb-1">Saldo Projetado</p>
                                    <div className="flex items-center gap-2 mb-2"><p className={`text-2xl font-bold tracking-tight ${financeSummary?.projectedBalance && financeSummary.projectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{financeSummary ? formatCurrency(financeSummary.projectedBalance) : '...'}</p>{financeSummary && (financeSummary.projectedBalance >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />)}</div>
                                    <div className="h-px bg-white/10 w-full my-2"></div>
                                    <div className="flex justify-between items-center text-xs"><span className="text-slate-400">Saldo Inicial:</span><span className="text-white font-medium">{financeSummary ? formatCurrency(financeSummary.initialReserve) : '...'}</span></div>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-0 backdrop-blur-md relative overflow-hidden group flex flex-col hover:border-cyan-500/30 transition-all duration-300">
                                {vacationSummary ? (
                                    <>
                                        <div className="absolute inset-0 z-0 bg-slate-800"><img src={vacationSummary.trip.coverUrl || destinationImage || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop`} alt="vacation" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop'; }} /><div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" /></div>
                                        <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                                            <div className="flex items-center gap-2 text-cyan-300 bg-black/30 w-fit px-2 py-1 rounded-lg backdrop-blur-sm"><Plane className="w-4 h-4" /><span className="text-xs font-bold uppercase">Próxima Viagem</span></div>
                                            <div>
                                                <h4 className="text-2xl font-bold text-white leading-none mb-2 drop-shadow-lg">{vacationSummary.trip.destination}</h4>
                                                <div className="flex flex-col gap-2 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-cyan-100 font-medium drop-shadow-md"><Timer className="w-4 h-4" />{vacationSummary.daysUntil > 0 ? <span>Faltam <span className="font-bold text-white text-lg">{vacationSummary.daysUntil}</span> dias</span> : <span>Boa Viagem!</span>}</div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-black/40 px-2 py-1 rounded w-fit backdrop-blur-sm"><Calendar className="w-3 h-3" /><span>{vacationSummary.dateRange} ({vacationSummary.days} dias)</span></div>
                                                </div>
                                                <div className="pt-3 border-t border-white/20 flex justify-between items-center"><span className="text-xs text-cyan-100/80">Custo Total</span><span className="text-sm font-bold text-white bg-black/40 px-2 py-1 rounded">{formatCurrency(vacationSummary.totalCost)}</span></div>
                                            </div>
                                        </div>
                                    </>
                                ) : (<div className="absolute inset-0 bg-cyan-900/20 z-0 flex flex-col items-center justify-center flex-1 text-slate-400 p-6 text-center"><Plane className="w-12 h-12 mb-4 text-slate-600" /><p className="text-sm">Nenhuma viagem definida para {currentYear}</p></div>)}
                            </div>
                        </>
                    )}

                    <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} bg-slate-900/40 border border-white/10 rounded-3xl p-0 backdrop-blur-md relative overflow-hidden group ${isAdmin ? 'min-h-[220px]' : 'min-h-[450px]'} hover:border-pink-500/30 transition-all duration-300`}>
                        {currentMedia?.posterUrl ? (
                            <div className="absolute inset-0 z-0">
                                <img src={currentMedia.posterUrl} alt="media" className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-50" />
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                                {!isAdmin && <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />}
                            </div>
                        ) : (<div className="absolute inset-0 bg-slate-800 z-0" />)}

                        {activeMediaList.length > 1 && (
                            <div className="absolute right-6 top-6 z-20 flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(p => p - 1 + activeMediaList.length) }} className="p-2.5 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors border border-white/5"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(p => p + 1) }} className="p-2.5 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors border border-white/5"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        )}

                        <div className={`relative z-10 p-8 md:p-12 h-full flex flex-col ${isAdmin ? 'justify-center' : 'justify-end'} max-w-2xl`}>
                            {currentMedia ? (
                                <>
                                    <div className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-lg mb-4 backdrop-blur-sm ${entMeta.bg} ${entMeta.color} border border-white/5`}>
                                        {React.cloneElement(entMeta.icon as React.ReactElement<any>, { className: "w-4 h-4" })}
                                        <span className="text-xs font-bold uppercase tracking-widest">{entMeta.label}</span>
                                    </div>
                                    <h3 className={`${isAdmin ? 'text-3xl' : 'text-5xl'} font-bold text-white mb-3 leading-tight drop-shadow-2xl line-clamp-2`}>{currentMedia.title}</h3>
                                    <div className="flex flex-wrap gap-3 text-sm text-slate-300 font-medium mb-8">
                                        {(currentMedia.type === 'SERIES' || currentMedia.type === 'ANIME') && (<span className="bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">{currentMedia.type === 'SERIES' ? `Temporada ${currentMedia.currentSeason || 1} • Ep ${(currentMedia.currentSeasonWatchedEpisodes || 0) + 1}` : `Episódio ${(currentMedia.watchedEpisodes || 0) + 1}`}</span>)}
                                        {(currentMedia.type === 'MOVIE' || currentMedia.type === 'BOOK') && (<span className="bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">{currentMedia.status === 'WATCHING' ? 'Em andamento' : 'Na Fila de Espera'}</span>)}
                                    </div>
                                    {isAdmin ? (
                                        <div className="flex gap-3">
                                            {(currentMedia.type === 'SERIES' || currentMedia.type === 'ANIME') ? (
                                                <button onClick={(e) => { e.stopPropagation(); incrementProgress(currentMedia); }} className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-pink-900/40 flex items-center gap-2 active:scale-95">
                                                    <PlayCircle className="w-4 h-4" /> Visto
                                                </button>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); updateStatus(currentMedia.id, 'COMPLETED'); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-white/20 active:scale-95">
                                                    <Check className="w-4 h-4" /> {currentMedia.type === 'BOOK' ? 'Lido' : 'Visto'}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button onClick={() => onNavigate(AppSection.ENTERTAINMENT)} className="group/btn flex items-center gap-3 text-white bg-pink-600/80 hover:bg-pink-600 px-6 py-3 rounded-xl font-bold text-sm transition-all w-fit shadow-lg shadow-pink-900/20">
                                            Explorar Biblioteca <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </>
                            ) : (<div className="text-slate-500 italic text-lg">Nada na lista de ativos no momento.</div>)}
                        </div>
                    </div>

                    <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} bg-slate-900/40 border border-white/10 rounded-3xl p-0 backdrop-blur-md relative overflow-hidden group ${isAdmin ? 'min-h-[220px]' : 'min-h-[450px]'} hover:border-violet-500/30 transition-all duration-300`}>
                        {currentGame?.posterUrl ? (
                            <div className="absolute inset-0 z-0">
                                <img src={currentGame.posterUrl} alt="game" className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-50" />
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                                {!isAdmin && <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />}
                            </div>
                        ) : (<div className="absolute inset-0 bg-slate-800 z-0" />)}

                        {activeGamesList.length > 1 && (
                            <div className="absolute right-6 top-6 z-20 flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setCurrentGameIndex(p => p - 1 + activeGamesList.length) }} className="p-2.5 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors border border-white/5"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setCurrentGameIndex(p => p + 1) }} className="p-2.5 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors border border-white/5"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        )}

                        <div className={`relative z-10 p-8 md:p-12 h-full flex flex-col ${isAdmin ? 'justify-center' : 'justify-end'} max-w-2xl`}>
                            {currentGame ? (
                                <>
                                    <div className="flex items-center gap-2 bg-violet-500/20 text-violet-300 w-fit px-3 py-1.5 rounded-lg mb-4 backdrop-blur-sm border border-violet-500/20">
                                        <Gamepad2 className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Jogando Agora</span>
                                    </div>
                                    <h3 className={`${isAdmin ? 'text-3xl' : 'text-5xl'} font-bold text-white mb-3 leading-tight drop-shadow-2xl line-clamp-2`}>{currentGame.title}</h3>
                                    <div className="flex flex-wrap gap-3 text-sm text-slate-300 font-medium mb-8"><span className="bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">{currentGame.platform || 'PC / Consoles'}</span></div>
                                    {isAdmin ? (
                                        <div className="flex gap-3"><button onClick={(e) => { e.stopPropagation(); updateGameStatus(currentGame.id, 'COMPLETED'); }} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-900/40 flex items-center gap-2 active:scale-95"><Trophy className="w-4 h-4" /> Finalizar Jogo</button></div>
                                    ) : (
                                        <button onClick={() => onNavigate(AppSection.GAMES)} className="group/btn flex items-center gap-3 text-white bg-violet-600/80 hover:bg-violet-600 px-6 py-3 rounded-xl font-bold text-sm transition-all w-fit shadow-lg shadow-pink-900/20">
                                            Ver Coleção de Jogos <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </>
                            ) : (<div className="text-slate-500 italic text-lg">Nenhum jogo ativo no momento.</div>)}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};