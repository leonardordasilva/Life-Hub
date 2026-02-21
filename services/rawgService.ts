import { supabase } from './supabaseClient';

export interface RawgResult {
  id?: number;
  title: string;
  posterUrl: string | null;
  releaseDate?: string;
  rating?: number;
  platforms?: string[];
  synopsis?: string;
  genres?: string[];
}

export const searchGame = async (query: string): Promise<RawgResult | null> => {
  if (!query) return null;

  try {
    const { data: edgeData, error } = await supabase.functions.invoke('rawg-proxy', {
      body: { action: 'rawg_search', query, page_size: 1 }
    });
    if (error) throw error;
    const data = edgeData;

    if (data.results && data.results.length > 0) {
      const bestMatch = data.results[0];
      return await getGameDetails(bestMatch.id);
    }

    return null;
  } catch (error) {
    console.warn("RAWG API Connection Error:", error);
    return null;
  }
};

export const searchGamesMany = async (query: string): Promise<RawgResult[]> => {
  if (!query) return [];

  try {
    const { data: edgeData, error } = await supabase.functions.invoke('rawg-proxy', {
      body: { action: 'rawg_search', query, page_size: 10 }
    });
    if (error) throw error;
    const data = edgeData;

    if (data.results && data.results.length > 0) {
      return data.results.map((item: any) => ({
        id: item.id,
        title: item.name,
        posterUrl: item.background_image || null,
        releaseDate: item.released,
        rating: item.rating,
        platforms: item.platforms?.map((p: any) => p.platform.name),
        genres: item.genres?.map((g: any) => g.name)
      }));
    }

    return [];
  } catch (error) {
    console.warn("RAWG API Connection Error:", error);
    return [];
  }
};

export const getGameDetails = async (id: number): Promise<RawgResult | null> => {
  try {
    const { data: edgeData, error } = await supabase.functions.invoke('rawg-proxy', {
      body: { action: 'rawg_details', id }
    });
    if (error) throw error;
    const data = edgeData;

    return {
      id: data.id,
      title: data.name,
      posterUrl: data.background_image || null,
      releaseDate: data.released,
      rating: data.rating,
      platforms: data.platforms?.map((p: any) => p.platform.name),
      synopsis: data.description_raw || data.description,
      genres: data.genres?.map((g: any) => g.name)
    };
  } catch (e) {
    console.error("RAWG Detail Error:", e);
    return null;
  }
};
