const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const oneDecimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatBRL = (value: number) => brl.format(value);

export const formatKg = (value: number) => `${oneDecimal.format(value)} kg`;

export function formatPct(value: number, withSign = true) {
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${oneDecimal.format(value)}%`;
}

/** "2026-10-31" → "31/10/2026" (sem conversão de fuso). */
export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

/** "2026-10-26" → "26/out" */
export function formatShortDate(isoDate: string) {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${months[Number(month) - 1]}`;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

const cents = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Máscara de centavos: só dígitos, preenchidos da direita para a esquerda.
 * "2" → "0,02", "2000" → "20,00", "151800" → "1.518,00". Vazio continua vazio.
 */
export function maskCents(raw: string, maxDigits = 5) {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, maxDigits);
  if (!digits) return "";
  return cents.format(Number(digits) / 100);
}

/** 1518 → "1.518,00" (valor inicial de um campo com máscara de centavos). */
export const centsFromNumber = (value: number) => cents.format(value);
