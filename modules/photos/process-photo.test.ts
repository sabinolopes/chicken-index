import { describe, expect, it } from "vitest";
import { formatDevice, localIsoDate, sha256Hex } from "@/modules/photos/process-photo";

describe("sha256Hex", () => {
  it("gera o mesmo hash que o sha256sum (quem tiver a foto original consegue conferir)", async () => {
    const bytes = new TextEncoder().encode("abc");
    expect(await sha256Hex(bytes.buffer)).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("muda por completo quando um único byte muda", async () => {
    const original = await sha256Hex(new Uint8Array([1, 2, 3]).buffer);
    const edited = await sha256Hex(new Uint8Array([1, 2, 4]).buffer);
    expect(original).toMatch(/^[0-9a-f]{64}$/);
    expect(edited).not.toBe(original);
  });
});

describe("formatDevice", () => {
  it("junta fabricante e modelo do EXIF num nome legível", () => {
    expect(formatDevice("Apple", "iPhone 13")).toBe("Apple iPhone 13");
    expect(formatDevice("samsung", "SM-A546E")).toBe("Samsung SM-A546E");
  });

  it("não repete o fabricante quando o modelo já começa com ele", () => {
    expect(formatDevice("Xiaomi", "Xiaomi 13T")).toBe("Xiaomi 13T");
  });

  it("aceita só um dos campos e ignora valores que não são texto", () => {
    expect(formatDevice(undefined, "Pixel 8")).toBe("Pixel 8");
    expect(formatDevice("Motorola", 42)).toBe("Motorola");
    expect(formatDevice("  ", undefined)).toBeNull();
  });
});

describe("localIsoDate", () => {
  it("usa a data local da foto, sem converter para UTC", () => {
    expect(localIsoDate(new Date(2026, 10, 2, 23, 30))).toBe("2026-11-02");
    expect(localIsoDate(new Date(2026, 0, 5, 0, 1))).toBe("2026-01-05");
  });
});
