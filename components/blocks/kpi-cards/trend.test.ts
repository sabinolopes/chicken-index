import { describe, expect, it } from "vitest";
import { trendOf } from "@/components/blocks/kpi-cards/trend";
import { STABLE_PCT } from "@/modules/dashboard/stats";

describe("trendOf", () => {
  it("alta de preço é ruim (vermelho), queda é boa (verde)", () => {
    expect(trendOf(4.2)).toMatchObject({ label: "alta", tone: expect.stringContaining("red") });
    expect(trendOf(-3)).toMatchObject({ label: "queda", tone: expect.stringContaining("emerald") });
  });

  it("variações minúsculas contam como estável", () => {
    expect(trendOf(0).label).toBe("estável");
    expect(trendOf(STABLE_PCT).label).toBe("estável");
    expect(trendOf(-STABLE_PCT).label).toBe("estável");
    expect(trendOf(STABLE_PCT + 0.01).label).toBe("alta");
  });
});
