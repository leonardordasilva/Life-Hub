import { useState, useEffect, useCallback } from 'react';
import { EntertainmentItem, MediaStatus, MediaType } from '../types';
import { supabase } from '../services/supabaseClient';
import { searchGame } from '../services/rawgService';
import { translateToPortuguese } from '../services/geminiService';
import { useToast } from '../components/Toast';

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

  return { games, loading, addGame, editGame, syncGame, removeGame, updateGameStatus };
};