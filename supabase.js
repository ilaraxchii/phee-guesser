// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://isbhcdfxfutaeclcamgi.supabase.co'; // found in your Supabase dashboard
const supabaseAnonKey = process.env.SUPABASE_KEY; // also in your Supabase dashboard

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
