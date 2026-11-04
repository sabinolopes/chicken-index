import { describe, expect, it } from "vitest";
import { weeklyNote } from "@/components/blocks/kpi-cards/kpi-text";

describe("weeklyNote", () => {
  it("diz quantos produtos repetidos sustentam a variação da semana", () => {
    expect(weeklyNote({ weeks: 3, comparedProducts: 1 })).toBe("1 produto comparado");
    expect(weeklyNote({ weeks: 3, comparedProducts: 7 })).toBe("7 produtos comparados");
  });

  it("explica por que não há variação, em vez de mostrar 0%", () => {
    expect(weeklyNote({ weeks: 1, comparedProducts: 0 })).toBe("Apenas uma semana de dados");
    expect(weeklyNote({ weeks: 2, comparedProducts: 0 })).toBe("Nenhum produto repetido da semana anterior");
  });
});
