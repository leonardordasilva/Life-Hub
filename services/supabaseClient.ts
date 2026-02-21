// Re-export the auto-generated client with a less strict type for compatibility
// until the types file is regenerated with the actual table definitions.
import { supabase as typedSupabase } from '../src/integrations/supabase/client';

export const supabase = typedSupabase as any;
