import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { UserRole } from '../types';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fetch role - defer to avoid deadlock
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const roles = data?.map((r: any) => r.role) ?? [];
      if (roles.includes('admin')) {
        setUserRole('ADMIN');
      } else {
        setUserRole('VISITOR');
      }
    } catch (e) {
      console.error('Error fetching role:', e);
      setUserRole('VISITOR');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return { user, session, userRole, loading, signIn, signUp, signOut };
}
