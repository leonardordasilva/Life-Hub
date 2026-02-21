// Safe Supabase client with direct publishable credentials
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://miwmgwcddhsxayglguuc.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pd21nd2NkZGhzeGF5Z2xndXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzkyMzEsImV4cCI6MjA4NzI1NTIzMX0.n7rEqWE50Ga9EklT7wrVAQ4FwXSFvEWNOqc2E0SJgIY';

export const supabase: any = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
