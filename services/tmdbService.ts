import { supabase } from '../src/integrations/supabase/client';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface TMDBResult {
  id?: number; // Added ID for detailed fetch
  title: string;
  posterUrl: string | null;
  releaseDate?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
  synopsis?: string;
  rating?: number;
  genres?: string[];
}

// Existing function (kept for backward compatibility with Hooks)
export const searchTMDB = async (query: string, type: 'MOVIE' | 'SERIES' | 'ANIME' | 'BOOK'): Promise<TMDBResult | null> => {
  if (!query) return null;
  if (type === 'BOOK') return null;

  try {
    const { data: edgeData, error } = await supabase.functions.invoke('tmdb-proxy', {
      body: { action: 'tmdb_search', type, query }
    });
    if (error) throw error;
    const data = edgeData;

    if (data.results && data.results.length > 0) {
      const bestMatch = data.results[0];
      return await getTMDBDetails(bestMatch.id, type);
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar no TMDB:", error);
    return null;
  }
};

// Search and return multiple candidates
export const searchTMDBMany = async (query: string, type: 'MOVIE' | 'SERIES' | 'ANIME'): Promise<TMDBResult[]> => {
  if (!query) return [];

  try {
    const { data: edgeData, error } = await supabase.functions.invoke('tmdb-proxy', {
      body: { action: 'tmdb_search', type, query }
    });
    if (error) throw error;
    const data = edgeData;

    if (data.results && data.results.length > 0) {
      return data.results.slice(0, 10).map((item: any) => ({
        id: item.id,
        title: item.name || item.title,
        posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
        releaseDate: item.release_date || item.first_air_date,
        synopsis: item.overview,
        rating: item.vote_average
      }));
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar múltiplos no TMDB:", error);
    return [];
  }
};

// Get details for a specific ID
export const getTMDBDetails = async (id: number, type: 'MOVIE' | 'SERIES' | 'ANIME'): Promise<TMDBResult | null> => {
  try {
    const { data: edgeData, error } = await supabase.functions.invoke('tmdb-proxy', {
      body: { action: 'tmdb_details', type, id }
    });
    if (error) throw error;
    const data = edgeData;

    if (!data) return null;

    const result: TMDBResult = {
      id: data.id,
      title: data.name || data.title,
      posterUrl: data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : null,
      releaseDate: data.release_date || data.first_air_date,
      synopsis: data.overview,
      rating: data.vote_average,
      genres: data.genres?.map((g: any) => g.name) || []
    };

    if (type !== 'MOVIE') {
      result.totalSeasons = data.number_of_seasons;
      result.totalEpisodes = data.number_of_episodes;
    }

    return result;
  } catch (error) {
    console.error("Erro ao buscar detalhes no TMDB:", error);
    return null;
  }
};
