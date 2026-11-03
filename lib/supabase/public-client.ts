import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

/**
 * Cliente anônimo, sem cookies — seguro para usar dentro de funções `'use cache'`
 * (leituras públicas cobertas pela política RLS de SELECT).
 */
export function createPublicClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
