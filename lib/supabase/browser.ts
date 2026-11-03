import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/**
 * Cliente do navegador (grava a sessão nos mesmos cookies lidos pelo servidor).
 * `detectSessionInUrl: false`: quem trata os tokens do link é a própria página.
 */
export function createBrowserSupabase() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey, { auth: { detectSessionInUrl: false } });
}
