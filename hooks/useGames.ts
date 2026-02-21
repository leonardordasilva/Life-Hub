import { useState, useEffect, useCallback } from 'react';
import { EntertainmentItem, MediaStatus, MediaType } from '../types';
import { supabase } from '../services/supabaseClient';
import { searchGame } from '../services/rawgService';
import { translateToPortuguese } from '../services/geminiService';
import { useToast } from '../components/Toast';

export interface GameSyncDiff {
  id: string;
  title: string;
  fullData?: any;
}

const formatRating = (rating?: number): number => {
  if (rating === undefined || rating === null) return 0;
  return Math.round(rating * 10) / 10;
};

export const useGames = () => {
  const [games, setGames] = useState<EntertainmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ent_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map((i: any) => ({
          id: i.id,
          title: i.title,
          type: 'GAME' as MediaType,
          platform: i.platform,
          status: i.status,
          rating: i.rating,
          posterUrl: i.poster_url,
          synopsis: i.synopsis,
          genres: i.genres,
          externalId: i.external_id,
          finishedAt: i.finished_at
        }));
        setGames(mapped);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const addGame = async (gameData: Partial<EntertainmentItem>) => {
    // Check for duplicates
    const isDuplicate = games.some(game => {
      if (gameData.externalId && game.externalId === gameData.externalId) return true;
      return false;
    });

    if (isDuplicate) {
      showToast('Este jogo já está cadastrado!', 'error');
      return;
    }

    const finishedAt = gameData.status === 'COMPLETED' ? new Date().toISOString() : undefined;
    const { error } = await supabase
      .from('ent_games')
      .insert({
        title: gameData.title,
        platform: gameData.platform,
        status: gameData.status,
        rating: gameData.rating || 0,
        poster_url: gameData.posterUrl,
        synopsis: gameData.synopsis,
        genres: gameData.genres,
        external_id: gameData.externalId,
        finished_at: finishedAt
      });

    if (error) console.error('Error adding game:', error);
    else fetchGames();
  };

  const editGame = async (game: EntertainmentItem) => {
    let finishedAt = game.finishedAt;
    if (game.status === 'COMPLETED' && !finishedAt) {
      finishedAt = new Date().toISOString();
    } else if (game.status !== 'COMPLETED') {
      finishedAt = undefined;
    }

    const { error } = await supabase
      .from('ent_games')
      .update({
        title: game.title,
        platform: game.platform,
        status: game.status,
        rating: game.rating,
        poster_url: game.posterUrl,
        synopsis: game.synopsis,
        genres: game.genres,
        external_id: game.externalId,
        finished_at: finishedAt
      })
      .eq('id', game.id);

    if (error) console.error('Error editing game:', error);
    else fetchGames();
  };

  const syncGame = async (id: string) => {
    const game = games.find(g => g.id === id);
    if (!game) return;

    try {
      const result = await searchGame(game.title);
      if (result) {
        // Traduzir a sinopse/descrição retornada pelo RAWG (geralmente em inglês)
        const translatedSynopsis = result.synopsis
          ? await translateToPortuguese(result.synopsis)
          : game.synopsis;

        await editGame({
          ...game,
          title: result.title || game.title,
          posterUrl: result.posterUrl || game.posterUrl,
          synopsis: translatedSynopsis || result.synopsis || game.synopsis,
          genres: result.genres || game.genres,
          rating: result.rating !== undefined ? result.rating : game.rating,
          platform: (result.platforms && result.platforms.length > 0) ? result.platforms[0] : game.platform
        });
      }
    } catch (e) {
      console.error("Sync Game Error:", e);
    }
  };

  const checkMetadataSync = async (
    onProgress: (current: number, total: number, title: string) => void
  ): Promise<GameSyncDiff[]> => {
    const diffs: GameSyncDiff[] = [];
    const total = games.length;

    for (let i = 0; i < total; i++) {
      const game = games[i];
      onProgress(i + 1, total, game.title);
      try {
        const result = await searchGame(game.title);
        if (result) {
          let hasChanges = false;

          if (result.synopsis && result.synopsis !== game.synopsis) hasChanges = true;
          if (result.posterUrl && result.posterUrl !== game.posterUrl) hasChanges = true;
          if (result.genres && JSON.stringify(result.genres) !== JSON.stringify(game.genres)) hasChanges = true;

          const currentRating = formatRating(game.rating);
          const newRating = formatRating(result.rating);
          if (newRating !== currentRating) hasChanges = true;

          if (result.platforms && result.platforms.length > 0 && result.platforms[0] !== game.platform) hasChanges = true;
          if (!game.externalId && result.id) hasChanges = true;

          if (hasChanges) {
            diffs.push({
              id: game.id,
              title: game.title,
              fullData: result
            });
          }
        }
      } catch (e) {
        console.error(`Sync check error for ${game.title}:`, e);
      }
    }
    return diffs;
  };

  const applyBatchUpdates = async (diffsToApply: GameSyncDiff[]) => {
    for (const diff of diffsToApply) {
      if (diff.fullData) {
        const game = games.find(g => g.id === diff.id);
        if (game) {
          const translatedSynopsis = diff.fullData.synopsis
            ? await translateToPortuguese(diff.fullData.synopsis)
            : game.synopsis;

          await editGame({
            ...game,
            title: diff.fullData.title || game.title,
            posterUrl: diff.fullData.posterUrl || game.posterUrl,
            synopsis: translatedSynopsis || diff.fullData.synopsis || game.synopsis,
            genres: diff.fullData.genres || game.genres,
            rating: diff.fullData.rating !== undefined ? formatRating(diff.fullData.rating) : game.rating,
            platform: (diff.fullData.platforms && diff.fullData.platforms.length > 0) ? diff.fullData.platforms[0] : game.platform,
            externalId: diff.fullData.id?.toString() || game.externalId
          });
        }
      }
    }
    await fetchGames();
  };

  const removeGame = async (id: string) => {
    const { error } = await supabase
      .from('ent_games')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting game:', error);
    else fetchGames();
  };

  const updateGameStatus = async (id: string, status: MediaStatus) => {
    const gameToUpdate = games.find(g => g.id === id);
    if (gameToUpdate) {
      await editGame({ ...gameToUpdate, status });
    }
  };

  return { games, loading, addGame, editGame, syncGame, checkMetadataSync, applyBatchUpdates, removeGame, updateGameStatus };
};