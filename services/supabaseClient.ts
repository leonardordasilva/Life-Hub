// Safe re-export of the Supabase client with fallback for missing env vars
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase environment variables not configured. Backend features will not work.');
}

const validUrl = SUPABASE_URL && SUPABASE_URL.startsWith('http') ? SUPABASE_URL : 'https://placeholder.supabase.co';
const validKey = SUPABASE_KEY || 'placeholder-key';

export const supabase: any = createClient(validUrl, validKey, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
