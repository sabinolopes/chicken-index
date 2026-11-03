import { createServerSupabase } from "@/lib/supabase/server";
import { readSettings } from "./repository";
import type { EconomicSettings } from "./types";

/** Salários para o painel admin (sem cache, com a sessão do admin). */
export async function getSettings(): Promise<EconomicSettings> {
  return readSettings(await createServerSupabase());
}
