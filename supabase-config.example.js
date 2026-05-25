// Copie este arquivo para supabase-config.js e preencha com suas credenciais
// Obtenha em: https://supabase.com/dashboard → Settings → API
const SUPABASE_URL      = 'COLE_SUA_URL_AQUI';
const SUPABASE_ANON_KEY = 'COLE_SUA_CHAVE_ANON_AQUI';

const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
