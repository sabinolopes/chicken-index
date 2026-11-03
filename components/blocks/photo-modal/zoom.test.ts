import { describe, expect, it } from "vitest";
import { MAX_ZOOM, MIN_ZOOM, pointerOrigin, stepZoom } from "@/components/blocks/photo-modal/zoom";

describe("stepZoom", () => {
  it("aumenta e diminui de meio em meio, sem passar dos limites", () => {
    expect(stepZoom(1, 1)).toBe(1.5);
    expect(stepZoom(2.5, -1)).toBe(2);
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
  });
});

describe("pointerOrigin", () => {
  const frame = { left: 100, top: 50, width: 400, height: 300 };

  it("converte o clique em % da moldura, para a lupa ampliar exatamente ali", () => {
    expect(pointerOrigin({ clientX: 300, clientY: 200 }, frame)).toEqual({ x: 50, y: 50 });
    expect(pointerOrigin({ clientX: 100, clientY: 350 }, frame)).toEqual({ x: 0, y: 100 });
  });

  it("cursor fora da moldura fica preso à borda", () => {
    expect(pointerOrigin({ clientX: 0, clientY: 1000 }, frame)).toEqual({ x: 0, y: 100 });
  });
});
