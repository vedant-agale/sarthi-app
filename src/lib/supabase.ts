import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Auto-cleaner: Agar galti se variable name ya quotes bhi aa gaye ho toh khud theek kar lega
const defaultUrl = 'https://dkociohrocgtybuvirnw.supabase.co';
const defaultKey = 'sb_publishable_r1RByasetYegXy6YzCshUg_2oP8nDPN';

let cleanUrl = rawUrl.trim();
if (cleanUrl.includes('http')) {
  cleanUrl = cleanUrl.substring(cleanUrl.indexOf('http')).replace(/['"]/g, '').trim();
} else {
  cleanUrl = defaultUrl;
}

let cleanKey = rawKey.trim();
if (cleanKey.includes('sb_')) {
  cleanKey = cleanKey.substring(cleanKey.indexOf('sb_')).replace(/['"]/g, '').trim();
} else {
  cleanKey = defaultKey;
}

export const supabase = createClient(cleanUrl, cleanKey);