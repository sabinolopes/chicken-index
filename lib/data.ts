import { cacheLife, cacheTag } from "next/cache";
import { MOCK_PRICES, MOCK_SETTINGS } from "./mock-data";
import { isSupabaseConfigured } from "./supabase/config";
import { createPublicClient } from "./supabase/public-client";
import type { ChickenPrice, DashboardData, EconomicSettings } from "./types";

export const PRICES_CACHE_TAG = "chicken-prices";

const PRICE_COLUMNS =
  "id, brand, state_type, price_per_kg, market_name, city, state, recorded_at, photo_url, original_sha256, exif_device, exif_datetime, has_valid_exif, created_at";

/**
 * Dados do dashboard público. Cacheado por 1 hora (equivalente ao antigo
 * `export const revalidate = 3600`, que não existe com `cacheComponents`).
 * Quando o admin cadastra um preço, a Server Action chama `revalidatePath('/')`
 * e `revalidateTag(PRICES_CACHE_TAG)` para invalidar na hora.
 */
export async function getDashboardData(): Promise<DashboardData> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag(PRICES_CACHE_TAG);

  const generatedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { mode: "demo", prices: MOCK_PRICES, settings: MOCK_SETTINGS, generatedAt };
  }

  const supabase = createPublicClient();
  const [pricesRes, settingsRes] = await Promise.all([
    supabase
      .from("chicken_prices")
      .select(PRICE_COLUMNS)
      .order("recorded_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("economic_settings").select("min_wage, avg_wage, updated_at").eq("id", 1).maybeSingle(),
  ]);

  if (pricesRes.error) throw new Error(`Falha ao carregar preços: ${pricesRes.error.message}`);
  if (settingsRes.error) throw new Error(`Falha ao carregar configurações: ${settingsRes.error.message}`);

  const prices: ChickenPrice[] = (pricesRes.data ?? []).map((row) => ({
    ...row,
    price_per_kg: Number(row.price_per_kg),
  })) as ChickenPrice[];

  const settings: EconomicSettings = settingsRes.data
    ? {
        min_wage: Number(settingsRes.data.min_wage),
        avg_wage: Number(settingsRes.data.avg_wage),
        updated_at: settingsRes.data.updated_at,
      }
    : MOCK_SETTINGS;

  return { mode: "live", prices, settings, generatedAt };
}
