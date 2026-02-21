import { useState, useEffect, useCallback } from 'react';
import { EntertainmentItem, MediaType, MediaStatus } from '../types';
import { supabase } from '../services/supabaseClient';
import { searchTMDB, getTMDBDetails } from '../services/tmdbService';
import { searchOpenLibrary, getBookDetails } from '../services/openLibraryService';
import { translateToPortuguese } from '../services/geminiService';
import { useToast } from '../components/Toast';

export interface SyncDiff {
    id: string;
    title: string;
    field: 'total_seasons' | 'total_episodes' | 'all';
    currentValue: any;
    newValue: any;
    fullData?: any;
}

// Helper para formatar nota com 1 casa decimal
const formatRating = (rating?: number): number => {
    if (rating === undefined || rating === null) return 0;
    return Math.round(rating * 10) / 10;
};

export const useEntertainment = () => {
    const [items, setItems] = useState<EntertainmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Helper para mapear tipo para tabela
    const getTable = (type: MediaType) => {
        switch (type) {
            case 'SERIES': return 'ent_series';
            case 'MOVIE': return 'ent_movies';
            case 'ANIME': return 'ent_animes';
            case 'BOOK': return 'ent_books';
            default: return 'ent_movies'; // fallback
        }
    };

    const fetchItems = async () => {
        try {
            setLoading(true);

            const [seriesRes, moviesRes, animesRes, booksRes] = await Promise.all([
                supabase.from('ent_series').select('*').order('created_at', { ascending: false }),
                supabase.from('ent_movies').select('*').order('created_at', { ascending: false }),
                supabase.from('ent_animes').select('*').order('created_at', { ascending: false }),
                supabase.from('ent_books').select('*').order('created_at', { ascending: false })
            ]);

            const allItems: EntertainmentItem[] = [];

            if (seriesRes.data) {
                allItems.push(...seriesRes.data.map((i: any) => ({
                    id: i.id,
                    title: i.title,
                    type: 'SERIES' as MediaType,
                    status: i.status,
                    rating: i.rating,
                    posterUrl: i.poster_url,
                    synopsis: i.synopsis,
                    genres: i.genres,
                    externalId: i.external_id,
                    finishedAt: i.finished_at,
                    // Specific
                    totalSeasons: i.total_seasons,
                    watchedSeasons: i.watched_seasons,
                    currentSeason: i.current_season,
                    currentSeasonTotalEpisodes: i.current_season_episodes,
                    currentSeasonWatchedEpisodes: i.current_season_watched,
                    platform: i.platform
                })));
            }

            if (moviesRes.data) {
                allItems.push(...moviesRes.data.map((i: any) => ({
                    id: i.id,
                    title: i.title,
                    type: 'MOVIE' as MediaType,
                    status: i.status,
                    rating: i.rating,
                    posterUrl: i.poster_url,
                    synopsis: i.synopsis,
                    genres: i.genres,
                    externalId: i.external_id,
                    finishedAt: i.finished_at,
                    // Specific
                    releaseDate: i.release_date
                })));
            }

            if (animesRes.data) {
                allItems.push(...animesRes.data.map((i: any) => ({
                    id: i.id,
                    title: i.title,
                    type: 'ANIME' as MediaType,
                    status: i.status,
                    rating: i.rating,
                    posterUrl: i.poster_url,
                    synopsis: i.synopsis,
                    genres: i.genres,
                    externalId: i.external_id,
                    finishedAt: i.finished_at,
                    // Specific
                    totalEpisodes: i.total_episodes,
                    watchedEpisodes: i.watched_episodes
                })));
            }

            if (booksRes.data) {
                allItems.push(...booksRes.data.map((i: any) => ({
                    id: i.id,
                    title: i.title,
                    type: 'BOOK' as MediaType,
                    status: i.status,
                    rating: i.rating,
                    posterUrl: i.poster_url,
                    synopsis: i.synopsis,
                    genres: i.genres,
                    externalId: i.external_id,
                    finishedAt: i.finished_at,
                    // Specific
                    author: i.author,
                    isbn: i.isbn,
                    releaseDate: i.release_date
                })));
            }

            setItems(allItems);

        } catch (error) {
            console.error('Error fetching entertainment items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const addItem = async (itemData: Partial<EntertainmentItem>) => {
        if (!itemData.type) return;

        // Check for duplicates
        const isDuplicate = items.some(item => {
            if (item.type !== itemData.type) return false;

            // Check externalId
            if (itemData.externalId && item.externalId === itemData.externalId) return true;

            // Check ISBN for books
            if (itemData.type === 'BOOK' && itemData.isbn && item.isbn === itemData.isbn) return true;

            return false;
        });

        if (isDuplicate) {
            const typeLabels: Record<string, string> = { SERIES: 'Esta série', MOVIE: 'Este filme', ANIME: 'Este anime', BOOK: 'Este livro' };
            showToast(`${typeLabels[itemData.type!] || 'Este item'} já está cadastrado(a)!`, 'error');
            return;
        }

        const table = getTable(itemData.type);

        const baseData = {
            title: itemData.title,
            status: itemData.status || 'PENDING',
            rating: formatRating(itemData.rating),
            poster_url: itemData.posterUrl,
            synopsis: itemData.synopsis,
            genres: itemData.genres,
            external_id: itemData.externalId || null,
            finished_at: itemData.status === 'COMPLETED' ? new Date().toISOString() : null
        };

        let specificData = {};

        if (itemData.type === 'SERIES') {
            specificData = {
                total_seasons: itemData.totalSeasons || 0,
                watched_seasons: itemData.watchedSeasons || 0,
                current_season: itemData.currentSeason || 0,
                current_season_episodes: itemData.currentSeasonTotalEpisodes || 0,
                current_season_watched: itemData.currentSeasonWatchedEpisodes || 0,
                platform: itemData.platform
            };
        } else if (itemData.type === 'MOVIE') {
            specificData = {
                release_date: itemData.releaseDate || null
            };
        } else if (itemData.type === 'ANIME') {
            specificData = {
                total_episodes: itemData.totalEpisodes || 0,
                watched_episodes: itemData.watchedEpisodes || 0
            };
        } else if (itemData.type === 'BOOK') {
            specificData = {
                author: itemData.author,
                isbn: itemData.isbn,
                release_date: itemData.releaseDate || null
            };
        }

        const { data, error } = await supabase
            .from(table)
            .insert({ ...baseData, ...specificData })
            .select()
            .single();

        if (error) {
            console.error('Error adding item:', error);
        } else if (data) {
            fetchItems();
        }
    };

    const editItem = async (item: EntertainmentItem) => {
        const table = getTable(item.type);

        const baseData = {
            title: item.title,
            status: item.status,
            rating: formatRating(item.rating),
            poster_url: item.posterUrl,
            synopsis: item.synopsis,
            genres: item.genres,
            external_id: item.externalId,
            finished_at: item.finishedAt
        };

        let specificData = {};

        if (item.type === 'SERIES') {
            specificData = {
                total_seasons: item.totalSeasons,
                watched_seasons: item.watchedSeasons,
                current_season: item.currentSeason,
                current_season_episodes: item.currentSeasonTotalEpisodes,
                current_season_watched: item.currentSeasonWatchedEpisodes,
                platform: item.platform
            };
        } else if (item.type === 'MOVIE') {
            specificData = {
                release_date: item.releaseDate
            };
        } else if (item.type === 'ANIME') {
            specificData = {
                total_episodes: item.totalEpisodes,
                watched_episodes: item.watchedEpisodes
            };
        } else if (item.type === 'BOOK') {
            specificData = {
                author: item.author,
                isbn: item.isbn,
                release_date: item.releaseDate
            };
        }

        const { error } = await supabase
            .from(table)
            .update({ ...baseData, ...specificData })
            .eq('id', item.id);

        if (error) {
            console.error('Error editing item:', error);
        } else {
            fetchItems();
        }
    };

    const syncItem = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        try {
            let result: any = null;
            let newExternalId = item.externalId;

            if (item.type === 'BOOK') {
                if (item.externalId) {
                    result = await getBookDetails(item.externalId);
                } else {
                    result = await searchOpenLibrary(item.title, item.isbn);
                    if (result && result.key) newExternalId = result.key;
                }
            } else {
                const tmdbType = item.type === 'SERIES' ? 'SERIES' : item.type === 'ANIME' ? 'ANIME' : 'MOVIE';
                if (item.externalId && !isNaN(Number(item.externalId))) {
                    result = await getTMDBDetails(Number(item.externalId), tmdbType);
                } else {
                    result = await searchTMDB(item.title, tmdbType);
                    if (result && result.id) newExternalId = result.id.toString();
                }
            }

            if (result) {
                let translatedSynopsis = result.synopsis || item.synopsis;
                if (item.type === 'BOOK' && result.synopsis) {
                    translatedSynopsis = await translateToPortuguese(result.synopsis);
                }

                await editItem({
                    ...item,
                    title: result.title || item.title,
                    posterUrl: result.posterUrl || item.posterUrl,
                    synopsis: translatedSynopsis,
                    genres: result.genres || item.genres,
                    rating: result.rating !== undefined ? formatRating(result.rating) : item.rating,
                    totalSeasons: result.totalSeasons !== undefined ? result.totalSeasons : item.totalSeasons,
                    totalEpisodes: result.totalEpisodes !== undefined ? result.totalEpisodes : item.totalEpisodes,
                    releaseDate: result.releaseDate || item.releaseDate,
                    author: result.author || item.author,
                    externalId: newExternalId
                });
            }
        } catch (e) {
            console.error("Sync Individual Error:", e);
        }
    };

    const updateStatus = async (id: string, status: MediaStatus) => {
        let finishedAt: string | null = null;
        const currentItem = items.find(i => i.id === id);
        if (!currentItem) return;

        const changes: any = { status };

        if (status === 'COMPLETED') {
            finishedAt = currentItem?.finishedAt || new Date().toISOString();
            changes.finished_at = finishedAt;
        } else {
            changes.finished_at = null;
            if (status === 'PENDING' && currentItem?.type === 'SERIES') {
                changes.current_season = 0;
            }
        }

        const { error } = await supabase
            .from(getTable(currentItem.type))
            .update(changes)
            .eq('id', id);

        if (error) console.error('Error updating status:', error);
        else fetchItems();
    };

    const incrementProgress = async (item: EntertainmentItem) => {
        const changes: any = {};
        let newStatus = item.status;
        let newFinishedAt = item.finishedAt;

        if (item.type === 'SERIES') {
            const currentEp = (item.currentSeasonWatchedEpisodes || 0) + 1;
            const totalEpInSeason = item.currentSeasonTotalEpisodes || 0;

            if (totalEpInSeason > 0 && currentEp >= totalEpInSeason) {
                const totalSeasons = item.totalSeasons || 0;
                const newWatchedSeasons = (item.watchedSeasons || 0) + 1;

                if (totalSeasons > 0 && newWatchedSeasons >= totalSeasons) {
                    newStatus = 'COMPLETED';
                    newFinishedAt = new Date().toISOString();
                    changes.current_season_watched = totalEpInSeason;
                    changes.watched_seasons = totalSeasons;
                    changes.current_season = 0;
                } else {
                    changes.current_season = 0;
                    changes.current_season_watched = 0;
                    changes.watched_seasons = newWatchedSeasons;
                    changes.current_season_episodes = 0;
                    newStatus = 'PENDING';
                }
            } else {
                changes.current_season_watched = currentEp;
                newStatus = 'WATCHING';
            }
        } else if (item.type === 'ANIME') {
            const nextEp = (item.watchedEpisodes || 0) + 1;
            changes.watched_episodes = nextEp;
            if (item.totalEpisodes && nextEp >= item.totalEpisodes) {
                newStatus = 'COMPLETED';
                newFinishedAt = new Date().toISOString();
            }
        }

        const { error } = await supabase
            .from(getTable(item.type))
            .update({
                ...changes,
                status: newStatus,
                finished_at: newFinishedAt
            })
            .eq('id', item.id);

        if (error) console.error('Error incrementing progress:', error);
        else fetchItems();
    };

    const removeItem = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const { error } = await supabase
            .from(getTable(item.type))
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting item:', error);
        else fetchItems();
    };

    const checkMetadataSync = async (
        type: 'SERIES' | 'ANIME' | 'BOOK' | 'MOVIE',
        onProgress: (current: number, total: number, title: string) => void
    ): Promise<SyncDiff[]> => {
        const targets = items.filter(i => i.type === type);
        const diffs: SyncDiff[] = [];
        const total = targets.length;

        for (let i = 0; i < total; i++) {
            const item = targets[i];
            onProgress(i + 1, total, item.title);
            try {
                let result: any = null;
                if (type === 'BOOK') {
                    if (item.externalId) {
                        result = await getBookDetails(item.externalId);
                    } else {
                        result = await searchOpenLibrary(item.title, item.isbn);
                    }
                } else {
                    const tmdbType = type === 'SERIES' ? 'SERIES' : type === 'ANIME' ? 'ANIME' : 'MOVIE';
                    if (item.externalId && !isNaN(Number(item.externalId))) {
                        result = await getTMDBDetails(Number(item.externalId), tmdbType);
                    } else {
                        result = await searchTMDB(item.title, tmdbType);
                    }
                }

                if (result) {
                    let hasChanges = false;
                    if (type === 'SERIES' && result.totalSeasons && result.totalSeasons !== (item.totalSeasons || 0)) hasChanges = true;
                    if (type === 'ANIME' && result.totalEpisodes && result.totalEpisodes !== (item.totalEpisodes || 0)) hasChanges = true;

                    // Check all metadata fields for divergence (not just missing)
                    if (result.synopsis && result.synopsis !== item.synopsis) hasChanges = true;
                    if (result.posterUrl && result.posterUrl !== item.posterUrl) hasChanges = true;
                    if (result.genres && JSON.stringify(result.genres) !== JSON.stringify(item.genres)) hasChanges = true;

                    const currentRating = formatRating(item.rating);
                    const newRating = formatRating(result.rating);
                    if (newRating !== currentRating) hasChanges = true;

                    if (type === 'BOOK' && result.author && result.author !== item.author) hasChanges = true;
                    if ((type === 'BOOK' || type === 'MOVIE') && result.releaseDate && result.releaseDate !== item.releaseDate) hasChanges = true;
                    if (!item.externalId && (result.id || result.key)) hasChanges = true;

                    if (hasChanges) {
                        const newValue = (type === 'BOOK' || type === 'MOVIE') ? 'Metadados' : (result.totalSeasons || result.totalEpisodes || 0);
                        const idFromApi = result.id ? result.id.toString() : result.key;

                        diffs.push({
                            id: item.id,
                            title: item.title,
                            field: 'all',
                            currentValue: item.totalSeasons || item.totalEpisodes || 0,
                            newValue: newValue,
                            fullData: { ...result, id: idFromApi }
                        });
                    }
                }
            } catch (err) { }
        }
        return diffs;
    };

    const applyBatchUpdates = async (diffsToApply: SyncDiff[]) => {
        for (const diff of diffsToApply) {
            if (diff.fullData) {
                const item = items.find(i => i.id === diff.id);
                if (item) {
                    await editItem({
                        ...item,
                        posterUrl: diff.fullData.posterUrl || item.posterUrl,
                        synopsis: diff.fullData.synopsis || item.synopsis,
                        genres: diff.fullData.genres || item.genres,
                        rating: diff.fullData.rating !== undefined ? formatRating(diff.fullData.rating) : item.rating,
                        totalSeasons: diff.fullData.totalSeasons !== undefined ? diff.fullData.totalSeasons : item.totalSeasons,
                        totalEpisodes: diff.fullData.totalEpisodes !== undefined ? diff.fullData.totalEpisodes : item.totalEpisodes,
                        releaseDate: diff.fullData.releaseDate || item.releaseDate,
                        author: diff.fullData.author || item.author,
                        externalId: diff.fullData.id || item.externalId
                    });
                }
            }
        }
        fetchItems();
    };

    return { items, loading, addItem, editItem, syncItem, updateStatus, incrementProgress, removeItem, checkMetadataSync, applyBatchUpdates };
};