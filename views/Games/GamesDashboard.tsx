import React, { useState, useMemo } from 'react';
import { useGames } from '../../hooks/useGames';
import { MediaStatus, EntertainmentItem, UserRole } from '../../types';
import { searchGame, searchGamesMany, getGameDetails, RawgResult } from '../../services/rawgService';
import { translateToPortuguese } from '../../services/geminiService';
import { useToast } from '../../components/Toast';
import { Gamepad2, Plus, Trash2, Search, X, Pencil, PlayCircle, CheckCircle, Clock, Loader2, Trophy, Coffee, Image as ImageIcon, Check, Info, Calendar, Layers, RefreshCw, Star } from 'lucide-react';

interface PosterCardProps {
    item: EntertainmentItem;
    children: React.ReactNode;
}

const PosterCard: React.FC<PosterCardProps> = ({ item, children }) => {
    const isPlaying = item.status === 'WATCHING';
    const borderColor = isPlaying ? 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-white/10 hover:border-violet-500/30';

    return (
        <div className={`relative group overflow-hidden rounded-xl bg-slate-800 border transition-all min-h-[220px] flex flex-col ${borderColor}`}>
            {item.posterUrl ? (
                <div className="absolute inset-0 z-0">
                    <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-slate-900 z-0" />
            )}

            <div className="relative z-10 p-5 flex flex-col h-full">
                <div className="flex justify-between w-full mb-2">
                    {isPlaying ? (
                        <div className="px-2 py-1 bg-violet-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-in fade-in zoom-in">
                            <Gamepad2 className="w-3 h-3 fill-current" />
                            Jogando
                        </div>
                    ) : (<span></span>)}
                    {(item.rating ?? 0) > 0 ? (
                        <div className="px-2 py-1 bg-amber-500/90 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> {(item.rating ?? 0).toFixed(1)}
                        </div>
                    ) : null}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    {children}
                </div>
            </div>
        </div>
    );
};

interface GamesDashboardProps {
    role: UserRole;
}

export const GamesDashboard: React.FC<GamesDashboardProps> = ({ role }) => {
    const { games, loading, addGame, editGame, syncGame, removeGame, updateGameStatus } = useGames();
    const { showToast } = useToast();
    const isAdmin = role === 'ADMIN';

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'PLAYING' | 'COMPLETED' | 'BACKLOG' | 'CASUAL'>('ALL');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState<EntertainmentItem | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    // Multi-select State
    const [candidates, setCandidates] = useState<RawgResult[]>([]);
    const [showCandidateModal, setShowCandidateModal] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState('');
    const [status, setStatus] = useState<MediaStatus>('PENDING');
    const [rating, setRating] = useState<number>(0);
    const [posterUrl, setPosterUrl] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [genres, setGenres] = useState<string[]>([]);
    const [rawgLoading, setRawgLoading] = useState(false);

    // Stats
    const stats = useMemo(() => ({
        total: games.length,
        playing: games.filter(g => g.status === 'WATCHING').length,
        completed: games.filter(g => g.status === 'COMPLETED').length,
        backlog: games.filter(g => g.status === 'PENDING').length
    }), [games]);

    // Filter Logic
    const filteredGames = useMemo(() => {
        return games.filter(g => {
            if (searchQuery && !g.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filter === 'PLAYING') return g.status === 'WATCHING';
            if (filter === 'COMPLETED') return g.status === 'COMPLETED';
            if (filter === 'BACKLOG') return g.status === 'PENDING';
            if (filter === 'CASUAL') return g.status === 'CASUAL';
            return true;
        }).sort((a, b) => {
            if (a.status === 'WATCHING' && b.status !== 'WATCHING') return -1;
            if (a.status !== 'WATCHING' && b.status === 'WATCHING') return 1;
            return a.title.localeCompare(b.title);
        });
    }, [games, searchQuery, filter]);

    // Actions
    const openModal = () => {
        setEditingId(null);
        setTitle('');
        setPlatform('');
        setStatus('PENDING');
        setRating(0);
        setPosterUrl('');
        setSynopsis('');
        setGenres([]);
        setShowModal(true);
    };

    const startEdit = (game: EntertainmentItem) => {
        setEditingId(game.id);
        setTitle(game.title);
        setPlatform(game.platform || '');
        setStatus(game.status);
        setRating(game.rating || 0);
        setPosterUrl(game.posterUrl || '');
        setSynopsis(game.synopsis || '');
        setGenres(game.genres || []);
        setShowModal(true);
    };

    const handleIndividualSync = async (id: string) => {
        setSyncingId(id);
        try {
            await syncGame(id);
        } finally {
            setSyncingId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { title, platform, status, rating, posterUrl: posterUrl || undefined, synopsis, genres };
            if (editingId) {
                const original = games.find(g => g.id === editingId);
                if (original) await editGame({ ...original, ...payload });
            } else {
                await addGame(payload);
            }
            setShowModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    const applyRawgData = async (result: RawgResult) => {
        setTitle(result.title);
        if (result.posterUrl) setPosterUrl(result.posterUrl);
        if (result.rating) setRating(result.rating);

        if (result.synopsis) {
            try {
                const translated = await translateToPortuguese(result.synopsis);
                setSynopsis(translated);
            } catch (e) {
                console.error("Erro na tradução:", e);
                setSynopsis(result.synopsis);
            }
        } else {
            setSynopsis('');
        }

        if (result.genres) setGenres(result.genres);
        if (result.platforms && result.platforms.length > 0 && !platform) setPlatform(result.platforms[0]);
    };

    const handleSearchRawg = async () => {
        if (!title) return;
        setRawgLoading(true);
        try {
            const results = await searchGamesMany(title);
            if (results.length === 0) showToast('Nenhum jogo encontrado.', 'error');
            else if (results.length === 1) {
                const details = await getGameDetails(results[0].id!);
                await applyRawgData(details || results[0]);
            } else {
                setCandidates(results);
                setShowCandidateModal(true);
            }
        } catch (error) {
            showToast('Erro ao buscar jogo.', 'error');
        } finally {
            setRawgLoading(false);
        }
    };

    const selectCandidate = async (candidate: RawgResult) => {
        setShowCandidateModal(false);
        setRawgLoading(true);
        try {
            const detail = await getGameDetails(candidate.id!);
            await applyRawgData(detail || candidate);
        } catch (e) { }
        finally { setRawgLoading(false); }
    };

    const getStatusLabel = (s: MediaStatus) => {
        switch (s) {
            case 'WATCHING': return 'Jogando';
            case 'COMPLETED': return 'Zerado';
            case 'PENDING': return 'Backlog';
            case 'CASUAL': return 'Casual';
            default: return s;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 pb-24">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div><h2 className="text-3xl font-bold text-white flex items-center gap-3"><Gamepad2 className="w-8 h-8 text-violet-500" /> Biblioteca de Jogos</h2><p className="text-slate-400 mt-1">Backlog e jogos sendo jogados e finalizados.</p></div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Buscar jogo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition-all" />
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>}
                        </div>
                        {isAdmin && <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-violet-900/20 whitespace-nowrap"><Plus className="w-4 h-4" /> Adicionar</button>}
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex items-center gap-3"><div className="p-2 bg-violet-500/20 rounded-lg text-violet-400"><Gamepad2 className="w-5 h-5" /></div><div><p className="text-xs text-slate-400 uppercase">Total</p><p className="text-xl font-bold">{stats.total}</p></div></div>
                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex items-center gap-3"><div className="p-2 bg-violet-500/20 rounded-lg text-violet-400"><Clock className="w-5 h-5" /></div><div><p className="text-xs text-slate-400 uppercase">Backlog</p><p className="text-xl font-bold">{stats.backlog}</p></div></div>
                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex items-center gap-3"><div className="p-2 bg-violet-500/20 rounded-lg text-violet-400"><PlayCircle className="w-5 h-5" /></div><div><p className="text-xs text-slate-400 uppercase">Jogando</p><p className="text-xl font-bold">{stats.playing}</p></div></div>
                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex items-center gap-3"><div className="p-2 bg-violet-500/20 rounded-lg text-violet-400"><Trophy className="w-5 h-5" /></div><div><p className="text-xs text-slate-400 uppercase">Zerados</p><p className="text-xl font-bold">{stats.completed}</p></div></div>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[{ id: 'ALL', label: 'Todos' }, { id: 'BACKLOG', label: 'Backlog' }, { id: 'PLAYING', label: 'Jogando' }, { id: 'COMPLETED', label: 'Zerados' }, { id: 'CASUAL', label: 'Casual' }].map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id as any)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === f.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>{f.label}</button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredGames.map(game => {
                            const isSyncing = syncingId === game.id;
                            return (
                                <PosterCard key={game.id} item={game}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col"><h3 className="text-lg font-bold text-white line-clamp-1">{game.title}</h3><span className="text-xs text-slate-300 font-medium bg-black/40 px-2 py-0.5 rounded w-fit mt-1 backdrop-blur-sm">{game.platform || 'Multi'}</span></div>
                                        <div className="flex gap-1 shrink-0 bg-black/40 backdrop-blur-sm rounded-lg p-1">
                                            <button onClick={() => setSelectedDetailItem(game)} className="p-1.5 text-slate-300 hover:text-violet-400 transition-colors"><Info className="w-3.5 h-3.5" /></button>
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => handleIndividualSync(game.id)} disabled={isSyncing} className={`p-1.5 text-slate-300 hover:text-emerald-400 transition-colors ${isSyncing ? 'animate-pulse' : ''}`} title="Sincronizar Dados"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /></button>
                                                    <button onClick={() => startEdit(game)} className="p-1.5 text-slate-300 hover:text-cyan-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => removeGame(game.id)} className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold border ${game.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : game.status === 'WATCHING' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>{getStatusLabel(game.status)}</div>
                                            {isAdmin && game.status === 'WATCHING' && <button onClick={() => updateGameStatus(game.id, 'COMPLETED')} className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Zerar</button>}
                                        </div>
                                        {game.status === 'PENDING' && isAdmin && <button onClick={() => updateGameStatus(game.id, 'WATCHING')} className="w-full py-1.5 rounded text-[10px] font-bold bg-violet-600/80 text-white hover:bg-violet-600 transition-all flex items-center justify-center gap-1"><PlayCircle className="w-3 h-3" /> JOGAR</button>}
                                    </div>
                                </PosterCard>
                            );
                        })}
                    </div>
                )}

                {/* DETAILS MODAL */}
                {selectedDetailItem && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300">
                        <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]">
                            <button onClick={() => setSelectedDetailItem(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-violet-600 text-white rounded-full transition-all border border-white/10"><X className="w-6 h-6" /></button>
                            <div className="w-full md:w-1/3 bg-slate-800 relative min-h-[300px]">
                                {selectedDetailItem.posterUrl ? <img src={selectedDetailItem.posterUrl} alt={selectedDetailItem.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon className="w-16 h-16" /></div>}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent md:bg-gradient-to-r" />
                            </div>
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-full text-xs font-bold uppercase tracking-widest">GAMES</span>
                                        {(selectedDetailItem.rating ?? 0) > 0 && (
                                            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-sm">
                                                <Star className="w-3.5 h-3.5 fill-current" /> {(selectedDetailItem.rating ?? 0).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mt-4 mb-2">{selectedDetailItem.title}</h2>
                                    <p className="text-slate-400 font-medium">{selectedDetailItem.platform || 'Multiplataforma'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6 mb-8 border-y border-white/5 py-6">
                                    <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p><p className="text-white text-lg font-medium">{getStatusLabel(selectedDetailItem.status)}</p></div>
                                    <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Categoria</p><div className="flex flex-wrap gap-1 mt-1">{selectedDetailItem.genres?.slice(0, 3).map((g, i) => <span key={i} className="text-xs text-white bg-white/10 px-2 py-0.5 rounded">{g}</span>) || 'Ação'}</div></div>
                                </div>
                                <div><h4 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-3">Sobre o Jogo</h4><p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">{selectedDetailItem.synopsis || "Informações detalhadas não disponíveis."}</p></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CANDIDATE MODAL */}
                {showCandidateModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[90] animate-in fade-in"><div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0"><div><h3 className="text-xl font-bold text-white">Selecione uma opção</h3><p className="text-sm text-slate-400">Resultados para "{title}"</p></div><button onClick={() => setShowCandidateModal(false)} className="text-slate-400 hover:text-white p-2"><X className="w-6 h-6" /></button></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto p-2">
                            {candidates.map((c, idx) => (
                                <button key={idx} onClick={() => selectCandidate(c)} className="flex flex-col bg-slate-800 rounded-xl overflow-hidden border border-white/5 hover:border-violet-500 transition-all text-left h-full">
                                    <div className="h-40 w-full bg-slate-700 relative overflow-hidden">{c.posterUrl ? <img src={c.posterUrl} alt={c.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-500"><ImageIcon className="w-8 h-8" /></div>}</div>
                                    <div className="p-3 flex flex-col flex-1"><h4 className="font-bold text-white text-sm line-clamp-2">{c.title}</h4></div>
                                </button>
                            ))}
                        </div>
                    </div></div>
                )}

                {/* INDIVIDUAL SYNC PROGRESS MODAL */}
                {syncingId && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 animate-pulse" />
                            <RefreshCw className="w-16 h-16 text-violet-500 animate-spin mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">Sincronizando Jogo</h3>
                            <p className="text-slate-400 text-sm mb-1 italic">"{games.find(g => g.id === syncingId)?.title}"</p>
                            <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-semibold">Buscando e traduzindo detalhes...</p>
                        </div>
                    </div>
                )}

                {/* ADD/EDIT MODAL */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative max-h-[95vh] overflow-y-auto">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">{editingId ? <Pencil className="w-5 h-5 text-cyan-400" /> : <Plus className="w-5 h-5 text-violet-400" />}{editingId ? 'Editar Jogo' : 'Novo Jogo'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div><label className="label-std">Nome do Jogo</label><div className="flex gap-2"><input required className="input-std" value={title} disabled={submitting} onChange={e => setTitle(e.target.value)} /><button type="button" onClick={handleSearchRawg} disabled={!title || rawgLoading} className="px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg">{rawgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</button></div></div>
                                <div><label className="label-std">Capa (URL)</label><input className="input-std" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} /></div>
                                <div><label className="label-std">Sinopse</label><textarea rows={3} className="input-std resize-none" value={synopsis} onChange={e => setSynopsis(e.target.value)} /></div>

                                {/* RATING INPUT */}
                                <div>
                                    <label className="label-std">Nota (0-10)</label>
                                    <input type="number" step="0.1" min="0" max="10" className="input-std" value={rating} onChange={e => setRating(Number(e.target.value))} placeholder="Ex: 9.0" />
                                </div>

                                <div><label className="label-std">Plataforma</label><input className="input-std" value={platform} onChange={e => setPlatform(e.target.value)} /></div>
                                <div><label className="label-std">Status</label><select className="input-std" value={status} onChange={e => setStatus(e.target.value as MediaStatus)}><option value="PENDING">Backlog</option><option value="WATCHING">Jogando</option><option value="COMPLETED">Zerado</option><option value="CASUAL">Casual</option></select></div>
                                <div className="flex gap-3 mt-6"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-800 rounded-lg text-white">Cancelar</button><button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-bold flex items-center justify-center gap-2">{submitting && <Loader2 className="w-4 h-4 animate-spin" />} Salvar</button></div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <style>{`.input-std{width:100%;background:#1e293b;border:1px solid #334155;border-radius:0.5rem;padding:0.5rem 0.75rem;color:white;outline:none;font-size:0.875rem}.input-std:focus{border-color:#8b5cf6;ring:1px solid #8b5cf6}.label-std{display:block;font-size:0.75rem;color:#94a3b8;margin-bottom:0.25rem;font-weight:500}`}</style>
        </div>
    );
};