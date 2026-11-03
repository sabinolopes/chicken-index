import { createServerSupabase } from "./supabase/server";
import { DEFAULT_SETTINGS, type ChickenPrice, type EconomicSettings } from "./types";

export interface MarketSuggestion {
  market_name: string;
  city: string;
  state: string;
}

/** Leituras do painel admin: sempre frescas (sem cache), com a sessão do admin. */
export async function getAdminData(limit = 50): Promise<{
  prices: ChickenPrice[];
  total: number;
  settings: EconomicSettings;
  suggestions: MarketSuggestion[];
}> {
  const supabase = await createServerSupabase();
  const [recent, places, settings] = await Promise.all([
    supabase
      .from("chicken_prices")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("chicken_prices").select("market_name, city, state").order("created_at", { ascending: false }).limit(1000),
    supabase.from("economic_settings").select("min_wage, avg_wage, updated_at").eq("id", 1).maybeSingle(),
  ]);

  if (recent.error) throw new Error(recent.error.message);

  return {
    prices: (recent.data ?? []).map((row) => ({ ...row, price_per_kg: Number(row.price_per_kg) })) as ChickenPrice[],
    total: recent.count ?? 0,
    settings: settings.data
      ? { min_wage: Number(settings.data.min_wage), avg_wage: Number(settings.data.avg_wage), updated_at: settings.data.updated_at }
      : DEFAULT_SETTINGS,
    suggestions: uniquePlaces(places.data ?? []),
  };
}

function uniquePlaces(rows: MarketSuggestion[]) {
  const seen = new Map<string, MarketSuggestion>();
  for (const row of rows) {
    if (!seen.has(row.market_name)) seen.set(row.market_name, { market_name: row.market_name, city: row.city, state: row.state });
  }
  return [...seen.values()].sort((first, second) => first.market_name.localeCompare(second.market_name, "pt-BR"));
}
