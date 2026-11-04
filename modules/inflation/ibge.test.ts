import { describe, expect, it } from "vitest";
import { parseIpca, type SidraRow } from "@/modules/inflation/ibge";

const HEADER: SidraRow = { V: "Valor", D2C: "Variável (Código)", D3C: "Mês (Código)", D4C: "Série (Código)" };
const row = ([variable, month, series, value]: [string, string, string, string]): SidraRow => ({ V: value, D2C: variable, D3C: month, D4C: series });

/** Um mês completo: índice geral, alimentação e frango em pedaços. */
const monthRows = (variable: string, month: string, [general, food, chicken]: string[]) => [
  row([variable, month, "7169", general]),
  row([variable, month, "7170", food]),
  row([variable, month, "107618", chicken]),
];

describe("parseIpca", () => {
  it("organiza as variações mensais em ordem e pega o acumulado em 12 meses do último mês", () => {
    const rows = [
      HEADER,
      ...monthRows("63", "202609", ["0.82", "0.83", "-1.41"]),
      ...monthRows("63", "202608", ["-0.32", "-0.34", "-0.80"]),
      ...monthRows("2265", "202608", ["4.1", "5.0", "3.2"]),
      ...monthRows("2265", "202609", ["4.3", "5.2", "2.9"]),
    ];

    expect(parseIpca(rows)).toEqual({
      months: [
        { month: "2026-08", general: -0.32, food: -0.34, chicken: -0.8 },
        { month: "2026-09", general: 0.82, food: 0.83, chicken: -1.41 },
      ],
      twelveMonths: { month: "2026-09", general: 4.3, food: 5.2, chicken: 2.9 },
    });
  });

  it("descarta mês incompleto ou sem valor ('...' no SIDRA) em vez de tratar como 0%", () => {
    const rows = [
      HEADER,
      ...monthRows("63", "202609", ["0.82", "0.83", "-1.41"]),
      ...monthRows("63", "202610", ["0.40", "...", "0.10"]),
      row(["63", "202611", "7169", "0.30"]),
      ...monthRows("2265", "202609", ["4.3", "5.2", "2.9"]),
    ];

    expect(parseIpca(rows).months.map((month) => month.month)).toEqual(["2026-09"]);
  });

  it("sem nenhum mês completo, falha em vez de mostrar número inventado", () => {
    expect(() => parseIpca([HEADER])).toThrow("sem meses completos");
  });
});
