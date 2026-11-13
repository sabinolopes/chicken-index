/** Quantos cadastros a lista mostra de início e quantos cada "Mostrar mais" acrescenta. */
export const PAGE_SIZE = 10;
/** Teto da lista no painel: acima disso, os registros antigos ficam só no site público. */
export const MAX_SHOWN = 200;

/**
 * Quantidade pedida em `?mostrar=` (vem da URL, então qualquer coisa pode chegar): sempre
 * um múltiplo de PAGE_SIZE entre PAGE_SIZE e MAX_SHOWN; inválido vira o padrão.
 */
export function shownCount(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value < PAGE_SIZE) return PAGE_SIZE;
  return Math.min(Math.ceil(value / PAGE_SIZE) * PAGE_SIZE, MAX_SHOWN);
}

/** Próxima quantidade para o "Mostrar mais"; null quando já está tudo na tela ou no teto. */
export function nextShownCount(shown: number, total: number): number | null {
  if (shown >= total || shown >= MAX_SHOWN) return null;
  return Math.min(shown + PAGE_SIZE, MAX_SHOWN);
}
