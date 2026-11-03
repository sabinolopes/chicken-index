import { describe, expect, it } from "vitest";
import { emptyMessage } from "@/components/pages/dashboard/empty-message";

describe("emptyMessage", () => {
  it("explica cada motivo de não haver indicadores", () => {
    expect(emptyMessage(0, 0)).toMatch(/^Ainda não há preços cadastrados/);
    expect(emptyMessage(10, 2)).toMatch(/só há preços promocionais/);
    expect(emptyMessage(10, 0)).toBe("Nenhum registro encontrado para os filtros selecionados.");
  });
});
