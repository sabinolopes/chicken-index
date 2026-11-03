import { errorMessage, failure, success, type ActionResult } from "@/lib/action-result";
import { parsePrice } from "@/lib/parse";
import type { SettingsRepository } from "./repository";

interface ChangeWagesOptions {
  /** Valores como digitados no campo com máscara (ex.: "1.621,00"). */
  minWage: string;
  avgWage: string;
  settings: SettingsRepository;
}

export async function changeWages({ minWage: typedMinWage, avgWage: typedAvgWage, settings }: ChangeWagesOptions): Promise<ActionResult> {
  const minWage = parsePrice(typedMinWage);
  const avgWage = parsePrice(typedAvgWage);
  if (!(minWage > 0) || !(avgWage > 0)) return failure("Informe salários válidos.");

  let updatedRows: number;
  try {
    updatedRows = await settings.updateWages({ minWage, avgWage });
  } catch (error) {
    return failure(`Falha ao salvar: ${errorMessage(error)}`);
  }
  if (updatedRows === 0) return failure("Linha de configurações não encontrada — rode o supabase/schema.sql.");
  return success("Salários atualizados.");
}
