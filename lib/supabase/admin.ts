import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./config";

/**
 * Cliente com a service role: ignora RLS e acessa a API de admin do Auth (convites,
 * app_metadata). SÓ no servidor, e só depois de `requireAdmin()`. A chave nunca
 * pode ter prefixo NEXT_PUBLIC_.
 */
export function createAdminSupabase() {
  const { url } = getSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error("Defina SUPABASE_SERVICE_ROLE_KEY (.env.local ou variáveis da Vercel) para gerenciar admins.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
