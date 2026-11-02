export const PHOTO_BUCKET = "price-photos";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  return { url, anonKey };
}

/** Sem URL/chave do Supabase no `.env.local`, o sistema roda em Modo Demo (dados mock). */
export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseEnv();
  return url.startsWith("http") && anonKey.length > 0;
}
