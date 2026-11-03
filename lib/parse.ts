/** "21,99" | "21.99" | "R$ 1.621,00" → número (ou NaN quando não há número). */
export function parsePrice(raw: string) {
  const cleaned = raw.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return cleaned ? Math.round(Number(cleaned) * 100) / 100 : NaN;
}

/** Data de hoje (YYYY-MM-DD) no fuso de Brasília. */
export function todayInBrazil(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}
