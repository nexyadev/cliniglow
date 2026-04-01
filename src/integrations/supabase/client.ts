import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🔒 validação forte (pra não ficar erro silencioso)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
throw new Error("❌ Variáveis do Supabase não carregaram. Verifique o .env");
}

// 🚀 CLIENTE SUPABASE
export const supabase = createClient<Database>(
SUPABASE_URL,
SUPABASE_ANON_KEY,
{
auth: {
persistSession: true,
autoRefreshToken: true,
detectSessionInUrl: true,
storage: localStorage,
},
}
);


