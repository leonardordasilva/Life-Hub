import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase URL or Anon Key not configured. Check environment variables.");
}

// Fallback to prevent crash if env vars are missing, but requests will fail
const validUrl = SUPABASE_URL && SUPABASE_URL.startsWith('http') ? SUPABASE_URL : 'https://placeholder.supabase.co';
const validKey = SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(validUrl, validKey);