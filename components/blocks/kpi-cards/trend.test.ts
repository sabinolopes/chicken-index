import { describe, expect, it } from "vitest";
import { STABLE_THRESHOLD, trendOf } from "@/components/blocks/kpi-cards/trend";

describe("trendOf", () => {
  it("alta de preço é ruim (vermelho), queda é boa (verde)", () => {
    expect(trendOf(4.2)).toMatchObject({ label: "alta", tone: expect.stringContaining("red") });
    expect(trendOf(-3)).toMatchObject({ label: "queda", tone: expect.stringContaining("emerald") });
  });

  it("variações minúsculas contam como estável", () => {
    expect(trendOf(0).label).toBe("estável");
    expect(trendOf(STABLE_THRESHOLD).label).toBe("estável");
    expect(trendOf(-STABLE_THRESHOLD).label).toBe("estável");
    expect(trendOf(STABLE_THRESHOLD + 0.01).label).toBe("alta");
  });
});
