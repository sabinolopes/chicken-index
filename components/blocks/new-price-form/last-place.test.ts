import { describe, expect, it } from "vitest";
import { readLastPlace, rememberLastPlace } from "@/components/blocks/new-price-form/last-place";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    items,
  };
}

const UNIDOS = { market_name: "Unidos", city: "Itaperuna", state: "RJ" };

describe("último mercado usado", () => {
  it("lembra o mercado do último cadastro para o próximo", () => {
    const storage = memoryStorage();
    rememberLastPlace(UNIDOS, storage);
    expect(readLastPlace(storage)).toEqual(UNIDOS);
  });

  it("sem nada salvo, não sugere nada", () => {
    expect(readLastPlace(memoryStorage())).toBeNull();
    expect(readLastPlace(null)).toBeNull();
  });

  it("ignora dado corrompido ou incompleto em vez de quebrar o formulário", () => {
    const storage = memoryStorage();
    storage.items.set("admin:last-place", "{não é json");
    expect(readLastPlace(storage)).toBeNull();
    storage.items.set("admin:last-place", JSON.stringify({ market_name: "Unidos" }));
    expect(readLastPlace(storage)).toBeNull();
  });

  it("aba anônima (storage que recusa gravar) não derruba o cadastro", () => {
    const refusing = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => rememberLastPlace(UNIDOS, refusing)).not.toThrow();
  });
});
