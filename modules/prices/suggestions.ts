export interface MarketSuggestion {
  market_name: string;
  city: string;
  state: string;
}

/**
 * Um local por mercado, em ordem alfabética. Recebe os cadastros do mais novo para
 * o mais antigo, então vale a cidade/UF do cadastro mais recente de cada mercado.
 */
export function uniqueMarkets(rows: MarketSuggestion[]): MarketSuggestion[] {
  const byMarket = new Map<string, MarketSuggestion>();
  for (const row of rows) {
    if (byMarket.has(row.market_name)) continue;
    byMarket.set(row.market_name, { market_name: row.market_name, city: row.city, state: row.state });
  }
  return [...byMarket.values()].sort((first, second) => first.market_name.localeCompare(second.market_name, "pt-BR"));
}
