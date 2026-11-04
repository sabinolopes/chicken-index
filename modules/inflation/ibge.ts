import type { IpcaMonth, IpcaValues, OfficialInflation } from "./types";

// SIDRA/IBGE, tabela 7060 (IPCA desde 2020): variação mensal (63) e acumulada em 12 meses (2265)
// do índice geral (7169), de Alimentação e bebidas (7170) e do subitem Frango em pedaços (107618).
const VARIABLE = { monthly: "63", twelveMonths: "2265" } as const;
const SERIES: Record<string, keyof IpcaValues> = { "7169": "general", "7170": "food", "107618": "chicken" };
export const IPCA_URL = `https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/${VARIABLE.monthly},${VARIABLE.twelveMonths}/p/last%2024/c315/${Object.keys(SERIES).join(",")}`;

/** Linha da resposta do SIDRA (só os campos usados). A primeira linha é o cabeçalho. */
export interface SidraRow {
  V: string;
  D2C: string; // variável
  D3C: string; // mês, AAAAMM
  D4C: string; // série
}

type MonthTable = Map<string, Partial<IpcaValues>>;

function addRow(table: MonthTable, row: SidraRow) {
  const series = SERIES[row.D4C];
  const value = Number(row.V);
  // "..." ou "-" no SIDRA = ainda sem dado: o mês fica incompleto e é descartado.
  if (!series || !Number.isFinite(value) || !/^\d{6}$/.test(row.D3C)) return;
  const month = `${row.D3C.slice(0, 4)}-${row.D3C.slice(4)}`;
  table.set(month, { ...table.get(month), [series]: value });
}

const isComplete = (values: Partial<IpcaValues>): values is IpcaValues =>
  values.general !== undefined && values.food !== undefined && values.chicken !== undefined;

function completeMonths(table: MonthTable): IpcaMonth[] {
  return [...table]
    .filter((entry): entry is [string, IpcaValues] => isComplete(entry[1]))
    .map(([month, values]) => ({ month, ...values }))
    .sort((first, second) => first.month.localeCompare(second.month));
}

/** Organiza a resposta do SIDRA; lança erro se não vier nenhum mês completo (nunca inventa número). */
export function parseIpca(rows: SidraRow[]): OfficialInflation {
  const monthly: MonthTable = new Map();
  const twelveMonths: MonthTable = new Map();
  for (const row of rows.slice(1)) {
    if (row.D2C === VARIABLE.monthly) addRow(monthly, row);
    if (row.D2C === VARIABLE.twelveMonths) addRow(twelveMonths, row);
  }
  const months = completeMonths(monthly);
  const latestTwelve = completeMonths(twelveMonths).at(-1);
  if (months.length === 0 || !latestTwelve) throw new Error("Resposta do IBGE sem meses completos do IPCA.");
  return { months, twelveMonths: latestTwelve };
}

/** Busca o IPCA no IBGE. Lança erro se a API falhar ou demorar. */
export async function fetchIpca(): Promise<OfficialInflation> {
  const response = await fetch(IPCA_URL, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`IBGE respondeu ${response.status}`);
  return parseIpca((await response.json()) as SidraRow[]);
}
