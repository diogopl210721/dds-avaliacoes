import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Falha alto e claro em dev se o .env não estiver configurado —
  // melhor do que um erro confuso de "fetch failed" mais tarde.
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. Configure o .env (veja .env.example)."
  );
}

export const supabase = createClient(url, anonKey);

// Helper para chamar Edge Functions com o mesmo padrão em todo o app.
export async function callFunction<T>(
  name: string,
  body?: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data as T;
}
