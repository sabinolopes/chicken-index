const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatBRL = (value: number) => brl.format(value);

export const formatKg = (value: number) => `${num1.format(value)} kg`;

export function formatPct(value: number, withSign = true) {
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${num1.format(value)}%`;
}

/** "2026-10-31" → "31/10/2026" (sem conversão de fuso). */
export function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** "2026-10-26" → "26/out" */
export function formatShortDate(isoDate: string) {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${months[Number(m) - 1]}`;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}
