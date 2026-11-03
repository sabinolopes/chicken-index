import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public-client";
import { PRICE_COLUMNS, toChickenPrice } from "@/modules/prices/repository";
import { readSettings } from "@/modules/settings/repository";
import { DASHBOARD_CACHE_TAG } from "./cache";
import type { DashboardData } from "./types";

/**
 * Dados do dashboard público. Cacheado por 1 hora (`'use cache'` + `cacheLife`, já que
 * `export const revalidate` não existe com `cacheComponents`) e invalidado na hora por
 * `refreshDashboard()` quando o admin cadastra, exclui ou altera salários.
 */
export async function getDashboardData(): Promise<DashboardData> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag(DASHBOARD_CACHE_TAG);

  const generatedAt = new Date().toISOString();
  const supabase = createPublicClient();
  const [pricesResponse, settings] = await Promise.all([
    supabase
      .from("chicken_prices")
      .select(PRICE_COLUMNS)
      .order("recorded_at", { ascending: false })
      .order("created_at", { ascending: false }),
    readSettings(supabase),
  ]);
  if (pricesResponse.error) throw new Error(`Falha ao carregar preços: ${pricesResponse.error.message}`);

  return { prices: (pricesResponse.data ?? []).map(toChickenPrice), settings, generatedAt };
}
