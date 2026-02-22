import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export interface CommunityUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  community_finance: boolean;
  community_vacation: boolean;
  community_games: boolean;
  community_series: boolean;
  community_movies: boolean;
  community_animes: boolean;
  community_books: boolean;
}

export interface CommunityMediaItem {
  id: string;
  title: string;
  status: string;
  rating: number | null;
  poster_url: string | null;
  genres: string[] | null;
  platform?: string | null;
  author?: string | null;
}

export interface CommunityTripItem {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  year: number;
  cover_url: string | null;
}

export const useCommunity = () => {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommunityUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, date_of_birth, community_finance, community_vacation, community_games, community_series, community_movies, community_animes, community_books')
        .or('community_finance.eq.true,community_vacation.eq.true,community_games.eq.true,community_series.eq.true,community_movies.eq.true,community_animes.eq.true,community_books.eq.true');
      
      if (error) throw error;
      // Exclude current user
      setUsers((data || []).filter((u: CommunityUser) => u.user_id !== user?.id));
    } catch (e) {
      console.error('Error fetching community users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCommunityUsers(); }, [fetchCommunityUsers]);

  const fetchUserMedia = async (userId: string, table: string): Promise<CommunityMediaItem[]> => {
    const { data, error } = await supabase
      .from(table)
      .select('id, title, status, rating, poster_url, genres, platform, author')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error(`Error fetching ${table}:`, error); return []; }
    return data || [];
  };

  const fetchUserTrips = async (userId: string): Promise<CommunityTripItem[]> => {
    const { data, error } = await supabase
      .from('vacation_trips')
      .select('id, destination, start_date, end_date, year, cover_url')
      .eq('user_id', userId)
      .order('year', { ascending: false });
    if (error) { console.error('Error fetching trips:', error); return []; }
    return data || [];
  };

  return { users, loading, fetchUserMedia, fetchUserTrips };
};
