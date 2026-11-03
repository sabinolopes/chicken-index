import { createServerSupabase } from "@/lib/supabase/server";
import { PRICE_COLUMNS, toChickenPrice } from "./repository";
import { otherBrands, uniqueMarkets, type MarketSuggestion } from "./suggestions";
import type { ChickenPrice } from "./types";

// Leituras do painel admin: sempre frescas (sem cache) e com a sessão do admin.

export async function listRecentPrices(limit: number): Promise<{ prices: ChickenPrice[]; total: number }> {
  const supabase = await createServerSupabase();
  const { data, count, error } = await supabase
    .from("chicken_prices")
    .select(PRICE_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao carregar preços: ${error.message}`);
  return { prices: (data ?? []).map(toChickenPrice), total: count ?? 0 };
}

export interface FormSuggestions {
  markets: MarketSuggestion[];
  /** Marcas digitadas em "Outra" em cadastros anteriores. */
  brands: string[];
}

/** Mercados e marcas já cadastrados, para o autocompletar do formulário. */
export async function listFormSuggestions(): Promise<FormSuggestions> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("chicken_prices")
    .select("market_name, city, state, brand")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(`Falha ao carregar sugestões: ${error.message}`);
  const rows = data ?? [];
  return { markets: uniqueMarkets(rows), brands: otherBrands(rows.map((row) => row.brand)) };
}
