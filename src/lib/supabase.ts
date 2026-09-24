import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkociohrocgtybuvirnw.supabase.co';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_r1RByasetYegXy6YzCshUg_2oP8nDPN';

export const supabase = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());