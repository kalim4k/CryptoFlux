
import { createClient } from '@supabase/supabase-js';

// Fonction sécurisée pour récupérer les variables d'environnement sans crash
const getEnv = (name: string): string | undefined => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[name] : undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL') || 'https://dtlgcbqufokwfwdphlig.supabase.co';
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bGdjYnF1Zm9rd2Z3ZHBobGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjM4MjEsImV4cCI6MjA2NDAzOTgyMX0.M3uXT7U6GsxdaPNyVyST8dSlIR5Nmxcg9-i0rs2E068';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
