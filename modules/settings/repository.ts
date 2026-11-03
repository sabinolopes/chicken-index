import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS, type EconomicSettings } from "./types";

/** Salários de referência (linha única id = 1). Sem a linha, usa os valores iniciais. */
export async function readSettings(supabase: SupabaseClient): Promise<EconomicSettings> {
  const { data, error } = await supabase.from("economic_settings").select("min_wage, avg_wage, updated_at").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Falha ao carregar configurações: ${error.message}`);
  if (!data) return DEFAULT_SETTINGS;
  return { min_wage: Number(data.min_wage), avg_wage: Number(data.avg_wage), updated_at: data.updated_at };
}

export interface SettingsRepository {
  /** Atualiza os salários e devolve quantas linhas mudaram (0 = linha id = 1 não existe). */
  updateWages(wages: { minWage: number; avgWage: number }): Promise<number>;
}

export function createSettingsRepository(supabase: SupabaseClient): SettingsRepository {
  return {
    async updateWages({ minWage, avgWage }) {
      const { data, error } = await supabase
        .from("economic_settings")
        .update({ min_wage: minWage, avg_wage: avgWage })
        .eq("id", 1)
        .select("id");
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    },
  };
}
