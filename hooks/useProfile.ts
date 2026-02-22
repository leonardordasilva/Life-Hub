import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  module_finance: boolean;
  module_vacation: boolean;
  module_entertainment: boolean;
  module_games: boolean;
  ent_series: boolean;
  ent_movies: boolean;
  ent_animes: boolean;
  ent_books: boolean;
  community_finance: boolean;
  community_vacation: boolean;
  community_games: boolean;
  community_series: boolean;
  community_movies: boolean;
  community_animes: boolean;
  community_books: boolean;
}

export const useProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (e) {
      console.error('Error fetching profile:', e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) { console.error('Error updating profile:', error); throw error; }
    await fetchProfile();
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  return { profile, loading, updateProfile, uploadAvatar, refetch: fetchProfile };
};
