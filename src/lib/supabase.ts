import { createClient } from '@supabase/supabase-js';

// Clean & Direct Configurations
const supabaseUrl = 'https://dkociohrocgtybuvirnw.supabase.co';
const supabaseAnonKey = 'sb_publishable_r1RByasetYegXy6YzCshUg_2oP8nDPN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);