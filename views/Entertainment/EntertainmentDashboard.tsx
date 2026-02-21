import React, { useState, useMemo } from 'react';
import { useEntertainment, SyncDiff } from '../../hooks/useEntertainment';
import { MediaType, MediaStatus, EntertainmentItem, UserRole } from '../../types';
import { searchTMDBMany, getTMDBDetails, TMDBResult } from '../../services/tmdbService';
import { searchOpenLibrary, searchOpenLibraryMany, searchByISBN, getBookDetails } from '../../services/openLibraryService';
import { translateToPortuguese } from '../../services/geminiService';
import { useToast } from '../../components/Toast';
import { Film, Tv, Book, Plus, Trash2, Calendar, User, List, CheckCircle, Clock, PlayCircle, Pencil, Check, Filter, Zap, PauseCircle, ChevronLeft, ChevronRight, Search, X, Loader2, Image as ImageIcon, BarChart2, Layers, RefreshCw, AlertTriangle, ArrowRight, Bookmark, Star } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const StatCard = ({ label, value, icon, colorClass }: { label: string, value: number, icon: React.ReactNode, colorClass: string }) => (
    <div className={`bg-slate-800/50 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors ${colorClass}`}>
        <div className="p-3 bg-white/5 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

interface PosterCardProps {
    item: EntertainmentItem;
    children: React.ReactNode;
    actions?: React.ReactNode;
    overlayColor?: string;
    onClick?: () => void;
}

const PosterCard: React.FC<PosterCardProps> = ({
    item,
    children,
    actions,
    overlayColor = "from-slate-900 via-slate-900/70",
    onClick
}) => {
    const isWatching = item.status === 'WATCHING';
    const borderColor = isWatching ? 'border-green-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-white/5 hover:border-white/15';

    return (
        <div
            className={`relative group overflow-hidden rounded-2xl bg-slate-800/80 border transition-all duration-300 min-h-[360px] flex flex-col ${borderColor} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
                // Don't trigger if clicking on a button/action inside the card
                if ((e.target as HTMLElement).closest('button')) return;
                onClick?.();
            }}
        >
            {item.posterUrl ? (
                <div className="absolute inset-0 z-0">
                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-30" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${overlayColor} to-transparent`} />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 z-0" />
            )}

            {/* Top Badges - Left side only */}
            <div className="relative z-10 p-4 flex items-start gap-2">
                {isWatching && (
                    <div className="px-2.5 py-1 bg-green-500/90 text-white text-[10px] font-bold rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider backdrop-blur-sm">
                        <PlayCircle className="w-3 h-3" /> {item.type === 'BOOK' ? 'Lendo' : 'Vendo'}
                    </div>
                )}
                {(item.rating ?? 0) > 0 && (
                    <div className="px-2 py-1 bg-black/50 backdrop-blur-sm text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1 border border-amber-500/20">
                        <Star className="w-3 h-3 fill-current" /> {(item.rating ?? 0).toFixed(1)}
                    </div>
                )}
            </div>

            {/* Hover Action Overlay - Top right, no overlap with badges */}
            {actions && (
                <div className="absolute top-3 right-3 z-30 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    {actions}
                </div>
            )}

            {/* Content pushed to bottom */}
            <div className="relative z-10 mt-auto p-5 pt-8 flex flex-col gap-3">
                {children}
            </div>
        </div>
    );
};

// Sync Modal Logic Component
interface SyncState {
    isOpen: boolean;
    stage: 'IDLE' | 'PROGRESS' | 'REVIEW' | 'SUMMARY';
    progress: number;
    total: number;
    currentTitle: string;
    diffs: SyncDiff[];
}

interface EntertainmentDashboardProps {
    role: UserRole;
}

export const EntertainmentDashboard: React.FC<EntertainmentDashboardProps> = ({ role }) => {
    const { items, loading, addItem, editItem, syncItem, removeItem, updateStatus, checkMetadataSync, applyBatchUpdates, incrementProgress } = useEntertainment();
    const { showToast } = useToast();
    const isAdmin = role === 'ADMIN';

    const labelClass = "block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider";
    const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-pink-500/50 outline-none transition-all placeholder:text-slate-600 disabled:opacity-50";

    const [activeTab, setActiveTab] = useState<'SERIES' | 'MOVIES' | 'BOOKS' | 'ANIME'>('SERIES');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedDetailItem, setSelectedDetailItem] = useState<EntertainmentItem | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    // Episode Prompt State
    const [showEpisodePrompt, setShowEpisodePrompt] = useState(false);
    const [promptingItem, setPromptingItem] = useState<EntertainmentItem | null>(null);
    const [newTotalEpisodes, setNewTotalEpisodes] = useState('');

    // Sync State
    const [syncState, setSyncState] = useState<SyncState>({
        isOpen: false,
        stage: 'IDLE',
        progress: 0,
        total: 0,
        currentTitle: '',
        diffs: []
    });
    const [selectedDiffs, setSelectedDiffs] = useState<Set<string>>(new Set());

    const [candidates, setCandidates] = useState<any[]>([]);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [seriesFilter, setSeriesFilter] = useState<'ALL' | 'WATCHING' | 'COMPLETED' | '1_LEFT' | '2_5_LEFT' | 'GT_5_LEFT'>('ALL');
    const [movieFilter, setMovieFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
    const [animeFilter, setAnimeFilter] = useState<'ALL' | 'WATCHING' | 'PENDING' | 'COMPLETED'>('ALL');

    // Form State
    const [title, setTitle] = useState('');
    const [posterUrl, setPosterUrl] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [rating, setRating] = useState<number>(0);
    const [totalSeasons, setTotalSeasons] = useState('');
    const [watchedSeasons, setWatchedSeasons] = useState('');
    const [currentSeason, setCurrentSeason] = useState('');
    const [currentSeasonTotalEpisodes, setCurrentSeasonTotalEpisodes] = useState('');
    const [currentSeasonWatchedEpisodes, setCurrentSeasonWatchedEpisodes] = useState('');
    const [totalEpisodes, setTotalEpisodes] = useState('');
    const [watchedEpisodes, setWatchedEpisodes] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [status, setStatus] = useState<MediaStatus>('PENDING');
    const [externalId, setExternalId] = useState(''); // Stores TMDB ID or OL Key
    const [tmdbLoading, setTmdbLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filtering Base Lists
    const series = items.filter(i => i.type === 'SERIES');
    const movies = items.filter(i => i.type === 'MOVIE');
    const animes = items.filter(i => i.type === 'ANIME');
    const books = items.filter(i => i.type === 'BOOK');

    const currentTabStats = useMemo(() => {
        let targetItems: EntertainmentItem[] = [];
        if (activeTab === 'SERIES') targetItems = series;
        else if (activeTab === 'MOVIES') targetItems = movies;
        else if (activeTab === 'ANIME') targetItems = animes;
        else if (activeTab === 'BOOKS') targetItems = books;

        return {
            total: targetItems.length,
            watching: targetItems.filter(i => i.status === 'WATCHING').length,
            pending: targetItems.filter(i => i.status === 'PENDING').length,
            completed: targetItems.filter(i => i.status === 'COMPLETED').length
        };
    }, [items, activeTab]);

    const matchesSearch = (item: EntertainmentItem) => {
        if (!searchQuery) return true;
        return item.title.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const filteredSeries = useMemo(() => {
        return series.filter(item => {
            if (!matchesSearch(item)) return false;
            const total = item.totalSeasons || 0;
            const watched = item.watchedSeasons || 0;
            const remaining = total - watched;
            switch (seriesFilter) {
                case 'WATCHING': return item.status === 'WATCHING';
                case 'COMPLETED': return remaining <= 0;
                case '1_LEFT': return remaining === 1;
                case '2_5_LEFT': return remaining >= 2 && remaining <= 5;
                case 'GT_5_LEFT': return remaining > 5;
                default: return true;
            }
        }).sort((a, b) => {
            if (a.status === 'WATCHING' && b.status !== 'WATCHING') return -1;
            if (a.status !== 'WATCHING' && b.status === 'WATCHING') return 1;
            return a.title.localeCompare(b.title);
        });
    }, [series, seriesFilter, searchQuery]);

    const filteredMovies = useMemo(() => {
        return movies.filter(item => {
            if (!matchesSearch(item)) return false;
            if (movieFilter !== 'ALL' && item.status !== movieFilter) return false;
            return true;
        }).sort((a, b) => {
            if (movieFilter === 'COMPLETED') {
                const dateA = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
                const dateB = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
                return dateB - dateA;
            } else {
                const dateA = a.releaseDate ? a.releaseDate : '9999-12-31';
                const dateB = b.releaseDate ? b.releaseDate : '9999-12-31';
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                return a.title.localeCompare(b.title);
            }
        });
    }, [movies, searchQuery, movieFilter]);

    const groupedCompletedMovies = useMemo(() => {
        if (movieFilter !== 'COMPLETED') return null;
        const groups: Record<string, EntertainmentItem[]> = {};
        filteredMovies.forEach(movie => {
            const year = movie.finishedAt ? new Date(movie.finishedAt).getFullYear().toString() : 'Desconhecido';
            if (!groups[year]) groups[year] = [];
            groups[year].push(movie);
        });
        const sortedYears = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
        return { groups, sortedYears };
    }, [filteredMovies, movieFilter]);

    const filteredBooks = useMemo(() => {
        return books.filter(matchesSearch).sort((a, b) => a.title.localeCompare(b.title));
    }, [books, searchQuery]);

    const sortedAnimes = useMemo(() => {
        return animes.filter(item => {
            if (!matchesSearch(item)) return false;
            if (animeFilter !== 'ALL' && item.status !== animeFilter) return false;
            return true;
        }).sort((a, b) => {
            const epA = a.totalEpisodes || 0;
            const epB = b.totalEpisodes || 0;
            if (epA !== epB) return epA - epB;
            return a.title.localeCompare(b.title);
        });
    }, [animes, searchQuery, animeFilter]);

    const getPaginatedData = (data: EntertainmentItem[]) => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSearchQuery('');
        setMovieFilter('ALL');
        setSeriesFilter('ALL');
        setAnimeFilter('ALL');
    };

    const handleSync = async (type: 'SERIES' | 'ANIME' | 'BOOK' | 'MOVIE') => {
        setSyncState({ isOpen: true, stage: 'PROGRESS', progress: 0, total: 0, currentTitle: 'Iniciando...', diffs: [] });
        try {
            const diffs = await checkMetadataSync(type, (curr, total, title) => {
                setSyncState(prev => ({ ...prev, progress: curr, total: total, currentTitle: title }));
            });
            if (diffs.length > 0) {
                setSyncState(prev => ({ ...prev, stage: 'REVIEW', diffs: diffs }));
                setSelectedDiffs(new Set(diffs.map(d => d.id)));
            } else {
                setSyncState(prev => ({ ...prev, stage: 'SUMMARY', diffs: [] }));
            }
        } catch (e) {
            setSyncState(prev => ({ ...prev, isOpen: false }));
            showToast('Erro ao sincronizar dados.', 'error');
        }
    };

    const handleIndividualSync = async (id: string) => {
        setSyncingId(id);
        try {
            await syncItem(id);
        } finally {
            setSyncingId(null);
        }
    };

    const toggleDiffSelection = (id: string) => {
        const newSet = new Set(selectedDiffs);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedDiffs(newSet);
    };

    const confirmSyncUpdates = async (syncItems: any) => {
        setSubmitting(true);
        const toApply = syncState.diffs.filter(d => selectedDiffs.has(d.id));
        try {
            await applyBatchUpdates(toApply);
            setSyncState(prev => ({ ...prev, stage: 'SUMMARY', diffs: toApply }));
        } finally {
            setSubmitting(false);
        }
    };

    const closeSyncModal = () => {
        setSyncState(prev => ({ ...prev, isOpen: false }));
    };

    const PaginationControls = ({ totalItems }: { totalItems: number }) => {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-white/5">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors text-slate-300">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-slate-400">Página <span className="text-white">{currentPage}</span> de <span className="text-white">{totalPages}</span></span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors text-slate-300">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    };

    const openModal = () => {
        setEditingId(null);
        setTitle('');
        setPosterUrl('');
        setSynopsis('');
        setRating(0);
        setTotalSeasons('');
        setWatchedSeasons('');
        setCurrentSeason('');
        setCurrentSeasonTotalEpisodes('');
        setCurrentSeasonWatchedEpisodes('');
        setTotalEpisodes('');
        setWatchedEpisodes('');
        setReleaseDate('');
        setAuthor('');
        setIsbn('');
        setExternalId('');
        setStatus('PENDING');
        setShowModal(true);
    };

    const startEdit = (item: EntertainmentItem) => {
        setEditingId(item.id);
        setTitle(item.title);
        setPosterUrl(item.posterUrl || '');
        setSynopsis(item.synopsis || '');
        setRating(item.rating || 0);
        setTotalSeasons(item.totalSeasons?.toString() || '');
        setWatchedSeasons(item.watchedSeasons?.toString() || '');
        setCurrentSeason(item.currentSeason?.toString() || '');
        setCurrentSeasonTotalEpisodes(item.currentSeasonTotalEpisodes?.toString() || '');
        setCurrentSeasonWatchedEpisodes(item.currentSeasonWatchedEpisodes?.toString() || '');
        setTotalEpisodes(item.totalEpisodes?.toString() || '');
        setWatchedEpisodes(item.watchedEpisodes?.toString() || '');
        setReleaseDate(item.releaseDate || '');
        setAuthor(item.author || '');
        setIsbn(item.isbn || '');
        setExternalId(item.externalId || '');
        setStatus(item.status);
        setShowModal(true);
    };

    const handleStartWatchingSeries = (item: EntertainmentItem) => {
        // Se o total de episódios da temporada atual for 0 ou indefinido, precisamos perguntar
        if (!item.currentSeasonTotalEpisodes || item.currentSeasonTotalEpisodes === 0) {
            setPromptingItem(item);
            setNewTotalEpisodes('');
            setShowEpisodePrompt(true);
        } else {
            // Se já tem episódios definidos, apenas ativa o status de WATCHING
            // mas garantindo que a temporada seja > 0
            const nextS = item.currentSeason && item.currentSeason > 0 ? item.currentSeason : (item.watchedSeasons || 0) + 1;
            editItem({
                ...item,
                currentSeason: nextS,
                status: 'WATCHING'
            });
        }
    };

    const handleSaveEpisodeCount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptingItem) return;
        setSubmitting(true);
        try {
            const totalEps = Number(newTotalEpisodes) || 0;
            const nextSeason = (promptingItem.watchedSeasons || 0) + 1;

            await editItem({
                ...promptingItem,
                status: 'WATCHING',
                currentSeason: nextSeason,
                currentSeasonTotalEpisodes: totalEps,
                currentSeasonWatchedEpisodes: 0
            });
            setShowEpisodePrompt(false);
            setPromptingItem(null);
        } finally {
            setSubmitting(false);
        }
    };

    const applyTMDBData = async (result: any) => {
        let finalTitle = result.title;
        let finalSynopsis = result.synopsis;

        if (finalSynopsis && / the | and | with | which /i.test(finalSynopsis)) {
            finalSynopsis = await translateToPortuguese(finalSynopsis);
        }

        setTitle(finalTitle);
        if (result.posterUrl) setPosterUrl(result.posterUrl);
        if (finalSynopsis) setSynopsis(finalSynopsis);
        if (result.rating) setRating(result.rating);
        if (result.releaseDate && (activeTab === 'MOVIES' || activeTab === 'BOOKS')) setReleaseDate(result.releaseDate);
        if (result.totalSeasons && activeTab === 'SERIES') setTotalSeasons(result.totalSeasons.toString());
        if (result.totalEpisodes && activeTab === 'ANIME') setTotalEpisodes(result.totalEpisodes.toString());
        if (activeTab === 'BOOKS' && result.author) setAuthor(result.author);

        // Store External ID (TMDB ID or OL Key)
        if (result.id) setExternalId(result.id.toString());
        else if (result.key) setExternalId(result.key);
    };

    const handleSearchClick = async () => {
        setTmdbLoading(true);
        try {
            if (activeTab === 'BOOKS') {
                if (!isbn.trim()) {
                    showToast('Por favor, insira o ISBN para buscar o livro.', 'info');
                    return;
                }
                const result = await searchByISBN(isbn.trim());
                if (!result) {
                    showToast('Nenhum livro encontrado por este ISBN.', 'error');
                } else {
                    await applyTMDBData(result);
                }
            } else {
                if (!title.trim()) return;
                const tmdbType = activeTab === 'MOVIES' ? 'MOVIE' : activeTab === 'ANIME' ? 'ANIME' : 'SERIES';
                const results = await searchTMDBMany(title, tmdbType);
                if (results.length === 0) {
                    const searchLabels: Record<string, string> = { MOVIES: 'filme', ANIME: 'anime', SERIES: 'série' };
                    showToast(`Nenhum(a) ${searchLabels[activeTab] || 'resultado'} encontrado(a).`, 'error');
                }
                else if (results.length === 1) {
                    const details = await getTMDBDetails(results[0].id!, tmdbType);
                    await applyTMDBData(details || results[0]);
                } else {
                    setCandidates(results);
                    setShowCandidateModal(true);
                }
            }
        } catch (err) {
            showToast('Erro ao buscar dados.', 'error');
        } finally {
            setTmdbLoading(false);
        }
    };

    const selectCandidate = async (candidate: any) => {
        setShowCandidateModal(false);
        setTmdbLoading(true);
        try {
            if (activeTab === 'BOOKS') {
                const detail = await getBookDetails(candidate.key || candidate.id);
                await applyTMDBData(detail || candidate);
            } else {
                const tmdbType = activeTab === 'MOVIES' ? 'MOVIE' : activeTab === 'ANIME' ? 'ANIME' : 'SERIES';
                const details = await getTMDBDetails(candidate.id!, tmdbType);
                await applyTMDBData(details || candidate);
            }
        } catch (e) {
            await applyTMDBData(candidate);
        } finally {
            setTmdbLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let itemData: any = { title, posterUrl: posterUrl.trim() || undefined, synopsis, rating, externalId: externalId || undefined };
            if (activeTab === 'SERIES') {
                const total = Number(totalSeasons) || 0;
                let watched = Number(watchedSeasons) || 0;
                let cSeason = Number(currentSeason) || 0;
                const cEpTotal = Number(currentSeasonTotalEpisodes) || 0;
                const cEpWatched = Number(currentSeasonWatchedEpisodes) || 0;

                if (cSeason > 0 && cEpTotal > 0 && cEpWatched >= cEpTotal && cSeason > watched) watched = cSeason;

                // Regras de Status solicitadas:
                // 1 - Temporada atual == 0 -> A Ver (PENDING)
                // 2 - Temporada atual > 0 -> Vendo (WATCHING)
                // 3 - Total == Vistas -> Visto (COMPLETED) - Precedência

                let calculatedStatus: MediaStatus = 'PENDING';
                if (total > 0 && watched >= total) {
                    calculatedStatus = 'COMPLETED';
                    cSeason = 0; // Se completou, não há temporada em progresso
                } else if (cSeason > 0) {
                    calculatedStatus = 'WATCHING';
                } else {
                    calculatedStatus = 'PENDING';
                }

                itemData = { ...itemData, type: 'SERIES', totalSeasons: total, watchedSeasons: watched, status: calculatedStatus, currentSeason: cSeason, currentSeasonTotalEpisodes: cEpTotal, currentSeasonWatchedEpisodes: cEpWatched };
            } else if (activeTab === 'ANIME') {
                const total = Number(totalEpisodes) || 0;
                const watched = Number(watchedEpisodes) || 0;
                let calculatedStatus: MediaStatus = (watched >= total && total > 0) ? 'COMPLETED' : watched > 0 ? 'WATCHING' : 'PENDING';
                itemData = { ...itemData, type: 'ANIME', totalEpisodes: total, watchedEpisodes: watched, status: calculatedStatus };
            } else if (activeTab === 'MOVIES') {
                itemData = { ...itemData, type: 'MOVIE', releaseDate, status: editingId ? status : 'PENDING' };
            } else if (activeTab === 'BOOKS') {
                itemData = { ...itemData, type: 'BOOK', author, isbn: isbn.trim() || undefined, releaseDate, status: status };
            }
            if (editingId) await editItem({ ...items.find(i => i.id === editingId)!, ...itemData });
            else await addItem(itemData);
            setShowModal(false);
            setEditingId(null);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const getStatusLabel = (s: MediaStatus) => {
        if (activeTab === 'BOOKS') {
            switch (s) {
                case 'PENDING': return 'A Ler';
                case 'WATCHING': return 'Lendo';
                case 'COMPLETED': return 'Lido';
                default: return s;
            }
        } else {
            switch (s) {
                case 'PENDING': return 'A Ver';
                case 'WATCHING': return 'Vendo';
                case 'COMPLETED': return 'Visto';
                default: return s;
            }
        }
    };

    const getTitlePlaceholder = () => {
        switch (activeTab) {
            case 'SERIES': return "Ex: Breaking Bad, Succession...";
            case 'MOVIES': return "Ex: Interestelar, O Poderoso Chefão...";
            case 'ANIME': return "Ex: Naruto, One Piece, Death Note...";
            case 'BOOKS': return "Ex: Dom Casmurro, Harry Potter, O Hobbit...";
            default: return "Digite o título...";
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 pb-24">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Film className="w-8 h-8 text-pink-400" /> Entretenimento
                        </h2>
                        <p className="text-slate-400 mt-1">Séries, filmes, animes e biblioteca de livros.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-72 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-pink-400 transition-colors z-10" />
                            <input type="text" placeholder="Buscar por título..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="relative w-full pl-10 pr-10 py-2.5 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-xl text-sm text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all placeholder:text-slate-500" />
                            {searchQuery && <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-400 transition-colors z-10"><X className="w-4 h-4" /></button>}
                        </div>
                        {isAdmin && <button onClick={openModal} className="btn btn-md btn-pink whitespace-nowrap"><Plus className="w-4 h-4" /> Adicionar</button>}
                    </div>
                </header>

                <div className="flex gap-1 mb-8 bg-slate-800/60 p-1.5 rounded-2xl border border-white/5 overflow-x-auto">
                    {([
                        { id: 'SERIES' as const, label: 'Séries', icon: <Tv className="w-4 h-4" /> },
                        { id: 'MOVIES' as const, label: 'Filmes', icon: <Film className="w-4 h-4" /> },
                        { id: 'ANIME' as const, label: 'Animes', icon: <Zap className="w-4 h-4" /> },
                        { id: 'BOOKS' as const, label: 'Livros', icon: <Book className="w-4 h-4" /> },
                    ]).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-900/30'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div></div>
                ) : (
                    <div className="grid gap-6">
                        <div className={`grid grid-cols-2 ${activeTab === 'MOVIES' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 animate-in fade-in slide-in-from-top-4 duration-500`}>
                            <StatCard label={`Total de ${activeTab === 'SERIES' ? 'Séries' : activeTab === 'MOVIES' ? 'Filmes' : activeTab === 'ANIME' ? 'Animes' : 'Livros'}`} value={currentTabStats.total} icon={<Layers className="w-6 h-6 text-indigo-400" />} colorClass="border-indigo-500/20" />
                            {activeTab !== 'MOVIES' && <StatCard label={activeTab === 'BOOKS' ? 'Lendo Agora' : 'Sendo Vistos'} value={currentTabStats.watching} icon={<PlayCircle className="w-6 h-6 text-pink-400" />} colorClass="border-pink-500/20" />}
                            <StatCard label={activeTab === 'BOOKS' ? 'A Ler' : 'A Ver'} value={currentTabStats.pending} icon={<Clock className="w-6 h-6 text-amber-400" />} colorClass="border-amber-400/20" />
                            <StatCard label={activeTab === 'BOOKS' ? 'Lidos' : 'Assistidos'} value={currentTabStats.completed} icon={<CheckCircle className="w-6 h-6 text-emerald-400" />} colorClass="border-emerald-500/20" />
                        </div>

                        {activeTab === 'SERIES' && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <div className="mr-2 text-slate-400 flex items-center gap-1 text-sm"><Filter className="w-4 h-4" /> Filtros:</div>
                                        {[{ id: 'ALL', label: 'Todas' }, { id: 'WATCHING', label: 'Assistindo' }, { id: 'COMPLETED', label: 'Finalizadas' }, { id: '1_LEFT', label: 'Falta 1 Temp.' }, { id: '2_5_LEFT', label: 'Faltam 2-5' }, { id: 'GT_5_LEFT', label: '+5 para ver' }].map((f) => (
                                            <button key={f.id} onClick={() => { setSeriesFilter(f.id as any); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${seriesFilter === f.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{f.label}</button>
                                        ))}
                                    </div>
                                    {isAdmin && series.length > 0 && <button onClick={() => handleSync('SERIES')} disabled={syncState.isOpen} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600 hover:to-purple-600 text-pink-400 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 border border-pink-500/30 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-900/30"><RefreshCw className="w-3.5 h-3.5" /> Sincronizar Tudo</button>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {getPaginatedData(filteredSeries).map(item => {
                                        const remaining = (item.totalSeasons || 0) - (item.watchedSeasons || 0);
                                        const percent = item.totalSeasons ? (item.watchedSeasons || 0) / item.totalSeasons * 100 : 0;
                                        const isSyncing = syncingId === item.id;
                                        const hasStartedCurrentSeason = (item.currentSeasonWatchedEpisodes || 0) > 0;

                                        return (
                                            <PosterCard key={item.id} item={item} onClick={() => setSelectedDetailItem(item)}
                                                actions={isAdmin ? <>
                                                    <button onClick={() => handleIndividualSync(item.id)} disabled={isSyncing} className={`btn-icon btn-icon-sync ${isSyncing ? 'animate-pulse' : ''}`} data-tooltip="Sincronizar"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /></button>
                                                    <button onClick={() => startEdit(item)} className="btn-icon btn-icon-edit" data-tooltip="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => removeItem(item.id)} className="btn-icon btn-icon-delete" data-tooltip="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </> : undefined}
                                            >
                                                <h3 className="text-lg font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
                                                
                                                {item.status === 'WATCHING' && (
                                                    <p className="text-[11px] text-pink-300 font-semibold tracking-wide">
                                                        T{item.currentSeason || 1} • E{item.currentSeasonWatchedEpisodes || 0}{item.currentSeasonTotalEpisodes ? ` / ${item.currentSeasonTotalEpisodes}` : ''}
                                                    </p>
                                                )}

                                                <div>
                                                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                                        <span>{item.watchedSeasons || 0} / {item.totalSeasons || 0} temporadas</span>
                                                        {remaining > 0 ? <span className="text-pink-400">{remaining} restante{remaining > 1 ? 's' : ''}</span> : <span className="text-emerald-400">Completa</span>}
                                                    </div>
                                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden"><div className={`h-1.5 rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-emerald-500' : 'bg-pink-500'}`} style={{ width: `${Math.max(percent, 2)}%` }} /></div>
                                                </div>

                                                {isAdmin && (
                                                    <div className="flex gap-2 mt-1">
                                                        {item.status === 'WATCHING' && (
                                                            <>
                                                                <button onClick={() => incrementProgress(item)} className="flex-1 py-1.5 bg-pink-600/20 hover:bg-pink-600 text-pink-400 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-pink-500/20 flex items-center justify-center gap-1"><PlayCircle className="w-3 h-3" /> +1 Ep</button>
                                                                <button onClick={() => updateStatus(item.id, 'PENDING')} className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-white/5"><PauseCircle className="w-3 h-3" /></button>
                                                            </>
                                                        )}
                                                        {item.status !== 'WATCHING' && (item.watchedSeasons || 0) < (item.totalSeasons || 0) && (
                                                            <button onClick={() => handleStartWatchingSeries(item)} className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-500/20 flex items-center justify-center gap-1">
                                                                <PlayCircle className="w-3 h-3" /> {hasStartedCurrentSeason ? 'Retomar' : 'Começar a Ver'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </PosterCard>
                                        );
                                    })}
                                </div>
                                <PaginationControls totalItems={filteredSeries.length} />
                            </>
                        )}

                        {activeTab === 'MOVIES' && (
                            <>
                                <div className="flex flex-wrap gap-4 mb-2 items-center justify-between">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <div className="mr-2 text-slate-400 flex items-center gap-1 text-sm"><Filter className="w-4 h-4" /> Filtros:</div>
                                        {[{ id: 'ALL', label: 'Todos' }, { id: 'PENDING', label: 'A Ver' }, { id: 'COMPLETED', label: 'Vistos' }].map((f) => (
                                            <button key={f.id} onClick={() => { setMovieFilter(f.id as any); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${movieFilter === f.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{f.label}</button>
                                        ))}
                                    </div>
                                    {isAdmin && movies.length > 0 && <button onClick={() => handleSync('MOVIE')} disabled={syncState.isOpen} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600 hover:to-purple-600 text-pink-400 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 border border-pink-500/30 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-900/30"><RefreshCw className="w-3.5 h-3.5" /> Sincronizar Tudo</button>}
                                </div>
                                {movieFilter === 'COMPLETED' && groupedCompletedMovies ? (
                                    <div className="space-y-8">
                                        {groupedCompletedMovies.sortedYears.map(year => (
                                            <div key={year}>
                                                <div className="flex items-center gap-4 mb-4"><h3 className="text-xl font-bold text-white">{year}</h3><div className="h-px bg-white/10 flex-1"></div><span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{groupedCompletedMovies.groups[year].length} filmes</span></div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {groupedCompletedMovies.groups[year].map(item => {
                                                        const isSyncing = syncingId === item.id;
                                                        return (
                                                            <PosterCard key={item.id} item={item} onClick={() => setSelectedDetailItem(item)}
                                                                actions={isAdmin ? <>
                                                                    <button onClick={() => handleIndividualSync(item.id)} disabled={isSyncing} className={`btn-icon btn-icon-sync ${isSyncing ? 'animate-pulse' : ''}`} data-tooltip="Sincronizar"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /></button>
                                                                    <button onClick={() => startEdit(item)} className="btn-icon btn-icon-edit" data-tooltip="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                                                                    <button onClick={() => removeItem(item.id)} className="btn-icon btn-icon-delete" data-tooltip="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                </> : undefined}
                                                            >
                                                                <h3 className="text-lg font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs text-slate-400 flex items-center gap-1.5"><Calendar className="w-3 h-3" />{formatDate(item.releaseDate)}</span>
                                                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Visto</span>
                                                                </div>
                                                            </PosterCard>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {getPaginatedData(filteredMovies).map(item => {
                                                const isSyncing = syncingId === item.id;
                                                return (
                                                    <PosterCard key={item.id} item={item} onClick={() => setSelectedDetailItem(item)}
                                                        actions={isAdmin ? <>
                                                            <button onClick={() => handleIndividualSync(item.id)} disabled={isSyncing} className={`btn-icon btn-icon-sync ${isSyncing ? 'animate-pulse' : ''}`} data-tooltip="Sincronizar"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /></button>
                                                            <button onClick={() => startEdit(item)} className="btn-icon btn-icon-edit" data-tooltip="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => removeItem(item.id)} className="btn-icon btn-icon-delete" data-tooltip="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </> : undefined}
                                                    >
                                                        <h3 className="text-lg font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-400 flex items-center gap-1.5"><Calendar className="w-3 h-3" />{formatDate(item.releaseDate)}</span>
                                                            <div className="flex items-center gap-2">
                                                                {item.status === 'PENDING' && isAdmin && <button onClick={() => updateStatus(item.id, 'COMPLETED')} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-400 font-bold transition-colors"><Check className="w-3 h-3" /> Visto</button>}
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-white/5 border-white/10'}`}>{getStatusLabel(item.status)}</span>
                                                            </div>
                                                        </div>
                                                    </PosterCard>
                                                );
                                            })}
                                        </div>
                                        <PaginationControls totalItems={filteredMovies.length} />
                                    </>
                                )}
                            </>
                        )}

                        {activeTab === 'ANIME' && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <div className="mr-2 text-slate-400 flex items-center gap-1 text-sm"><Filter className="w-4 h-4" /> Filtros:</div>
                                        {[{ id: 'ALL', label: 'Todos' }, { id: 'WATCHING', label: 'Assistindo' }, { id: 'PENDING', label: 'A Ver' }, { id: 'COMPLETED', label: 'Finalizados' }].map((f) => (
                                            <button key={f.id} onClick={() => { setAnimeFilter(f.id as any); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${animeFilter === f.id ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{f.label}</button>
                                        ))}
                                    </div>
                                    {isAdmin && animes.length > 0 && <button onClick={() => handleSync('ANIME')} disabled={syncState.isOpen} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 hover:from-yellow-600 hover:to-amber-600 text-yellow-400 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 border border-yellow-500/30 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-900/30"><RefreshCw className="w-3.5 h-3.5" /> Sincronizar Tudo</button>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {getPaginatedData(sortedAnimes).map(item => {
                                        const total = item.totalEpisodes || 0;
                                        const watched = item.watchedEpisodes || 0;
                                        const percent = total ? (watched / total) * 100 : 0;
                                        const isSyncing = syncingId === item.id;
                                        return (
                                            <PosterCard key={item.id} item={item} overlayColor="from-slate-900 via-yellow-900/10" onClick={() => setSelectedDetailItem(item)}
                                                actions={isAdmin ? <>
                                                    <button onClick={() => handleIndividualSync(item.id)} disabled={isSyncing} className={`btn-icon btn-icon-sync ${isSyncing ? 'animate-pulse' : ''}`} data-tooltip="Sincronizar"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /></button>
                                                    <button onClick={() => startEdit(item)} className="btn-icon btn-icon-edit" data-tooltip="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => removeItem(item.id)} className="btn-icon btn-icon-delete" data-tooltip="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </> : undefined}
                                            >
                                                <h3 className="text-lg font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
                                                <div>
                                                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                                        <span>{watched} / {total} episódios</span>
                                                        <span className={percent >= 100 ? 'text-emerald-400' : 'text-yellow-400'}>{Math.round(percent)}%</span>
                                                    </div>
                                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden"><div className={`h-1.5 rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${Math.max(percent, 2)}%` }} /></div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : item.status === 'WATCHING' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-slate-400 bg-white/5 border-white/10'}`}>{getStatusLabel(item.status)}</span>
                                                    {isAdmin && item.status === 'WATCHING' && <button onClick={() => incrementProgress(item)} className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold hover:text-white px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20 transition-colors"><PlayCircle className="w-3 h-3" />+1 Ep</button>}
                                                </div>
                                                {isAdmin && item.status === 'PENDING' && (
                                                    <button onClick={() => updateStatus(item.id, 'WATCHING')} className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white transition-all border border-yellow-500/20 flex items-center justify-center gap-1.5">
                                                        <PlayCircle className="w-3.5 h-3.5" /> Começar a Ver
                                                    </button>
                                                )}
                                            </PosterCard>
                                        );
                                    })}
                                </div>
                                <PaginationControls totalItems={sortedAnimes.length} />
                            </>
                        )}

                        {activeTab === 'BOOKS' && (
                            <>
                                <div className="flex justify-end mb-2">{isAdmin && books.length > 0 && <button onClick={() => handleSync('BOOK')} disabled={syncState.isOpen} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600 hover:to-purple-600 text-pink-400 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 border border-pink-500/30 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-900/30"><RefreshCw className="w-3.5 h-3.5" /> Sincronizar Tudo</button>}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {getPaginatedData(filteredBooks).map(item => {
                                        const isSyncing = syncingId === item.id;
                                        return (
                                            <PosterCard key={item.id} item={item} onClick={() => setSelectedDetailItem(item)}
                                                actions={isAdmin ? <>
                                                    <button onClick={() => handleIndividualSync(item.id)} disabled={isSyncing} className={`btn-icon btn-icon-sync ${isSyncing ? 'animate-pulse' : ''}`} data-tooltip="Sincronizar"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /></button>
                                                    <button onClick={() => startEdit(item)} className="btn-icon btn-icon-edit" data-tooltip="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => removeItem(item.id)} className="btn-icon btn-icon-delete" data-tooltip="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </> : undefined}
                                            >
                                                <h3 className="text-lg font-bold text-white line-clamp-2 leading-snug">{item.title}</h3>
                                                <span className="text-xs text-slate-300/80 font-medium flex items-center gap-1"><User className="w-3 h-3" /> {item.author || 'Autor Desconhecido'}</span>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.releaseDate)}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : item.status === 'WATCHING' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-slate-400 bg-white/5 border-white/10'}`}>{getStatusLabel(item.status)}</span>
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex gap-2 mt-1">
                                                        {item.status === 'PENDING' && (
                                                            <button onClick={() => updateStatus(item.id, 'WATCHING')} className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20 flex items-center justify-center gap-1.5">
                                                                <Bookmark className="w-3.5 h-3.5" /> Começar a Ler
                                                            </button>
                                                        )}
                                                        {item.status === 'WATCHING' && (
                                                            <button onClick={() => updateStatus(item.id, 'COMPLETED')} className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-500/20 flex items-center justify-center gap-1.5">
                                                                <CheckCircle className="w-3.5 h-3.5" /> Marcar como Lido
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </PosterCard>
                                        );
                                    })}
                                </div>
                                <PaginationControls totalItems={filteredBooks.length} />
                            </>
                        )}

                    </div>
                )}

                {/* EPISODE PROMPT MODAL */}
                {showEpisodePrompt && promptingItem && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-sm shadow-2xl relative">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Tv className="w-5 h-5 text-emerald-400" /> Iniciar Temporada</h3>
                            <p className="text-slate-400 text-sm mb-6">Quantos episódios tem a <b>Temporada {(promptingItem.watchedSeasons || 0) + 1}</b> de "{promptingItem.title}"?</p>

                            <form onSubmit={handleSaveEpisodeCount} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Total de Episódios</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        required
                                        disabled={submitting}
                                        className={inputClass}
                                        value={newTotalEpisodes}
                                        onChange={e => setNewTotalEpisodes(e.target.value)}
                                        placeholder="Ex: 10"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => { setShowEpisodePrompt(false); setPromptingItem(null); }} className="btn btn-lg btn-ghost flex-1">Cancelar</button>
                                    <button type="submit" disabled={submitting || !newTotalEpisodes} className="btn btn-lg btn-success flex-1">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Começar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DETAILS MODAL */}
                {selectedDetailItem && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
                        <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]">
                            <button onClick={() => setSelectedDetailItem(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-pink-600 text-white rounded-full transition-all border border-white/10"><X className="w-6 h-6" /></button>

                            <div className="w-full md:w-1/3 bg-slate-800 relative min-h-[300px]">
                                {selectedDetailItem.posterUrl ? (
                                    <img src={selectedDetailItem.posterUrl} alt={selectedDetailItem.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon className="w-16 h-16" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r" />
                            </div>

                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-pink-600/20 text-pink-400 border border-pink-500/30 rounded-full text-xs font-bold uppercase tracking-widest">{selectedDetailItem.type}</span>
                                        {(selectedDetailItem.rating ?? 0) > 0 && (
                                            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-sm">
                                                <Star className="w-3.5 h-3.5 fill-current" /> {(selectedDetailItem.rating ?? 0).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mt-4 mb-2">{selectedDetailItem.title}</h2>
                                    {selectedDetailItem.author && <p className="text-xl text-slate-300 font-medium italic">por {selectedDetailItem.author}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-8 border-y border-white/5 py-6">
                                    {selectedDetailItem.type === 'SERIES' && (
                                        <>
                                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Temporadas</p><p className="text-white text-lg font-medium">{selectedDetailItem.totalSeasons || 0} Temporadas</p></div>
                                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p><p className="text-white text-lg font-medium">{getStatusLabel(selectedDetailItem.status)}</p></div>
                                            {isAdmin && <div className="col-span-2 mt-4 pt-4 border-t border-white/5"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Seu Progresso</p><p className="text-white text-lg font-medium">{selectedDetailItem.watchedSeasons || 0} Temporadas assistidas</p></div>}
                                        </>
                                    )}
                                    {selectedDetailItem.type === 'ANIME' && (
                                        <>
                                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Episódios</p><p className="text-white text-lg font-medium">{selectedDetailItem.totalEpisodes || 0} Episódios</p></div>
                                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p><p className="text-white text-lg font-medium">{getStatusLabel(selectedDetailItem.status)}</p></div>
                                        </>
                                    )}
                                    {selectedDetailItem.type === 'MOVIE' && (
                                        <>
                                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Lançamento</p><p className="text-white text-lg font-medium">{formatDate(selectedDetailItem.releaseDate)}</p></div>
                                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p><p className="text-white text-lg font-medium">{getStatusLabel(selectedDetailItem.status)}</p></div>
                                        </>
                                    )}
                                    {selectedDetailItem.type === 'BOOK' && (
                                        <>
                                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Publicação</p><p className="text-white text-lg font-medium">{formatDate(selectedDetailItem.releaseDate)}</p></div>
                                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Leitura</p><p className="text-white text-lg font-medium">{getStatusLabel(selectedDetailItem.status)}</p></div>
                                        </>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-3">Sinopse / Descrição</h4>
                                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                                        {selectedDetailItem.synopsis || "Nenhuma descrição disponível para este item no momento."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SYNC MODAL */}
                {syncState.isOpen && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in zoom-in duration-200">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-8 shadow-2xl overflow-hidden relative">
                            {syncState.stage === 'PROGRESS' && (
                                <div className="text-center py-12">
                                    <RefreshCw className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-6" />
                                    <h3 className="text-2xl font-bold text-white mb-2">Sincronizando Tudo...</h3>
                                    <p className="text-slate-400 mb-8">Consultando APIs ({syncState.progress}/{syncState.total})</p>
                                    <div className="w-full bg-slate-800 rounded-full h-2 mb-4"><div className="bg-pink-500 h-2 rounded-full transition-all" style={{ width: `${(syncState.progress / syncState.total) * 100}%` }}></div></div>
                                    <p className="text-xs text-pink-400 font-mono italic">Atual: {syncState.currentTitle}</p>
                                </div>
                            )}
                            {syncState.stage === 'REVIEW' && (
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Atualizações encontradas!</h3>
                                    <p className="text-slate-400 text-sm mb-4">Os itens abaixo possuem novos metadados ou temporadas disponíveis.</p>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-3 mb-6 pr-2">
                                        {syncState.diffs.map(d => (
                                            <div key={d.id} className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${selectedDiffs.has(d.id) ? 'bg-pink-500/10 border-pink-500/50' : 'bg-slate-800 border-white/5'}`} onClick={() => toggleDiffSelection(d.id)}>
                                                <div><p className="text-white font-bold text-sm">{d.title}</p><p className="text-xs text-slate-400">Clique para selecionar e atualizar todos os dados.</p></div>
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedDiffs.has(d.id) ? 'bg-pink-600 border-pink-600' : 'border-slate-600'}`}>{selectedDiffs.has(d.id) && <Check className="w-3 h-3 text-white" />}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-4"><button onClick={confirmSyncUpdates} disabled={submitting || selectedDiffs.size === 0} className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">{submitting && <Loader2 className="w-4 h-4 animate-spin" />} Atualizar Selecionados ({selectedDiffs.size})</button><button onClick={closeSyncModal} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">Cancelar</button></div>
                                </div>
                            )}
                            {syncState.stage === 'SUMMARY' && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-8 h-8" /></div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Sincronização Concluída!</h3>
                                    <p className="text-slate-400 mb-8">{syncState.diffs.length > 0 ? `${syncState.diffs.length} itens atualizados com sucesso.` : "Tudo atualizado! Nenhuma mudança necessária."}</p>
                                    <button onClick={closeSyncModal} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Fechar</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* INDIVIDUAL SYNC PROGRESS MODAL */}
                {syncingId && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-pulse" />
                            <RefreshCw className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">Sincronizando</h3>
                            <p className="text-slate-400 text-sm mb-1 italic">"{items.find(i => i.id === syncingId)?.title}"</p>
                            <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-semibold">Atualizando metadados...</p>
                        </div>
                    </div>
                )}

                {/* ADD/EDIT MODAL */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">{editingId ? <Pencil className="w-6 h-6 text-cyan-500" /> : <Plus className="w-6 h-6 text-pink-500" />}{editingId ? 'Editar Item' : `Novo(a) ${activeTab === 'SERIES' ? 'Série' : activeTab === 'MOVIES' ? 'Filme' : activeTab === 'ANIME' ? 'Anime' : 'Livro'}`}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">

                                {activeTab === 'BOOKS' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>ISBN (Busca)</label>
                                            <div className="flex gap-2">
                                                <input disabled={submitting} className={inputClass} placeholder="Ex: 97801..." value={isbn} onChange={e => setIsbn(e.target.value)} />
                                                <button type="button" onClick={handleSearchClick} disabled={tmdbLoading || !isbn} className="px-3 bg-pink-600 hover:bg-pink-700 rounded-xl transition-colors text-white disabled:opacity-50">
                                                    {tmdbLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div><label className={labelClass}>Autor</label><input disabled={submitting} className={inputClass} value={author} onChange={e => setAuthor(e.target.value)} /></div>
                                    </div>
                                )}

                                <div>
                                    <label className={labelClass}>Título</label>
                                    <div className="flex gap-2">
                                        <input required disabled={submitting} className={inputClass} placeholder={getTitlePlaceholder()} value={title} onChange={e => setTitle(e.target.value)} />
                                        {activeTab !== 'BOOKS' && (
                                            <button type="button" onClick={handleSearchClick} disabled={tmdbLoading || !title} className="px-3 bg-pink-600 hover:bg-pink-700 rounded-xl transition-colors text-white disabled:opacity-50">
                                                {tmdbLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div><label className={labelClass}>Capa (URL)</label><input disabled={submitting} className={inputClass} placeholder="https://..." value={posterUrl} onChange={e => setPosterUrl(e.target.value)} /></div>
                                <div><label className={labelClass}>Sinopse</label><textarea disabled={submitting} rows={4} className={`${inputClass} resize-none`} placeholder="Uma breve descrição..." value={synopsis} onChange={e => setSynopsis(e.target.value)} /></div>

                                {activeTab === 'SERIES' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className={labelClass}>Total Temporadas</label><input type="number" disabled={submitting} className={inputClass} value={totalSeasons} onChange={e => setTotalSeasons(e.target.value)} /></div>
                                            <div><label className={labelClass}>Temporadas Vistas</label><input type="number" disabled={submitting} className={inputClass} value={watchedSeasons} onChange={e => setWatchedSeasons(e.target.value)} /></div>
                                        </div>
                                        {Number(watchedSeasons) < Number(totalSeasons) && (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                                                <p className="text-xs font-bold text-pink-400 uppercase tracking-widest">Progresso Atual</p>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div><label className={labelClass}>Temp. Atual</label><input type="number" disabled={submitting} className={inputClass} value={currentSeason} onChange={e => setCurrentSeason(e.target.value)} placeholder="0" /></div>
                                                    <div><label className={labelClass}>Total Eps Temp.</label><input type="number" disabled={submitting} className={inputClass} value={currentSeasonTotalEpisodes} onChange={e => setCurrentSeasonTotalEpisodes(e.target.value)} placeholder="0" /></div>
                                                    <div><label className={labelClass}>Eps Vistos</label><input type="number" disabled={submitting} className={inputClass} value={currentSeasonWatchedEpisodes} onChange={e => setCurrentSeasonWatchedEpisodes(e.target.value)} placeholder="0" /></div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {activeTab === 'ANIME' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>Total Episódios</label><input type="number" disabled={submitting} className={inputClass} value={totalEpisodes} onChange={e => setTotalEpisodes(e.target.value)} /></div>
                                        <div><label className={labelClass}>Vistos</label><input type="number" disabled={submitting} className={inputClass} value={watchedEpisodes} onChange={e => setWatchedEpisodes(e.target.value)} /></div>
                                    </div>
                                )}
                                {(activeTab === 'MOVIES' || activeTab === 'BOOKS') && (
                                    <div><label className={labelClass}>Data Lançamento</label><input type="date" disabled={submitting} className={inputClass} value={releaseDate} onChange={e => setReleaseDate(e.target.value)} /></div>
                                )}

                                <div className="flex gap-4 mt-6"><button type="button" disabled={submitting} onClick={() => setShowModal(false)} className="btn btn-lg btn-ghost flex-1">Cancelar</button><button type="submit" disabled={submitting} className="btn btn-lg btn-pink flex-1">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {/* CANDIDATE MODAL */}
                {showCandidateModal && candidates.length > 0 && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[90] animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[85vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4 shrink-0"><div><h3 className="text-xl font-bold text-white">Selecione uma opção</h3><p className="text-sm text-slate-400">Resultados para sua busca</p></div><button onClick={() => setShowCandidateModal(false)} className="text-slate-400 hover:text-white p-2"><X className="w-6 h-6" /></button></div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar p-2">
                                {candidates.map((c, idx) => (
                                    <button key={idx} onClick={() => selectCandidate(c)} className="flex flex-col bg-slate-800 rounded-xl overflow-hidden border border-white/5 hover:border-pink-500 hover:scale-[1.02] transition-all text-left group h-full">
                                        <div className="h-40 w-full bg-slate-700 relative overflow-hidden">{c.posterUrl ? <img src={c.posterUrl} alt={c.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-500"><ImageIcon className="w-8 h-8" /></div>}<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" /></div>
                                        <div className="p-3 flex flex-col flex-1">
                                            <h4 className="font-bold text-white text-sm line-clamp-2 mb-1">{c.title}</h4>
                                            {c.author && <p className="text-xs text-slate-300 italic line-clamp-1 mb-1">{c.author}</p>}
                                            <p className="text-xs text-slate-400 mb-2">{c.releaseDate ? c.releaseDate.split('-')[0] : 'Ano desconhecido'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <style>{`
        /* Ocultar spin buttons de inputs numéricos para uma UI mais limpa */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
      `}</style>
        </div>
    );
};