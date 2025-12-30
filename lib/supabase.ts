
import { createClient } from '@supabase/supabase-js';

// Ensure the URL and Key are never empty to avoid initialization errors.
// These values were provided by the user in the latest environment configuration.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dtlgcbqufokwfwdphlig.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bGdjYnF1Zm9rd2Z3ZHBobGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjM4MjEsImV4cCI6MjA2NDAzOTgyMX0.M3uXT7U6GsxdaPNyVyST8dSlIR5Nmxcg9-i0rs2E068';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
