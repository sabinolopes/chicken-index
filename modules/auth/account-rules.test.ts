import { describe, expect, it } from "vitest";
import { displayNameError, displayNameFromMetadata, normalizeDisplayName, passwordError } from "@/modules/auth/account-rules";

describe("nome de exibição", () => {
  it("guarda o nome sem espaços sobrando e com até 60 caracteres", () => {
    expect(normalizeDisplayName("  Maria   da  Silva ")).toBe("Maria da Silva");
    expect(normalizeDisplayName("A".repeat(80))).toHaveLength(60);
  });

  it("lê o nome da conta e ignora o que não é texto", () => {
    expect(displayNameFromMetadata({ full_name: " Maria " })).toBe("Maria");
    expect(displayNameFromMetadata({ full_name: "   " })).toBeNull();
    expect(displayNameFromMetadata({ full_name: 42 })).toBeNull();
    expect(displayNameFromMetadata({})).toBeNull();
    expect(displayNameFromMetadata(null)).toBeNull();
  });

  it("exige pelo menos 2 letras", () => {
    expect(displayNameError("")).toBe("Informe seu nome (pelo menos 2 letras).");
    expect(displayNameError("  J  ")).toBe("Informe seu nome (pelo menos 2 letras).");
    expect(displayNameError("Jo")).toBeNull();
  });
});

describe("passwordError", () => {
  it("exige ao menos 8 caracteres e as duas senhas iguais", () => {
    expect(passwordError("curta", "curta")).toBe("A senha precisa ter pelo menos 8 caracteres.");
    expect(passwordError("senha-forte-1", "senha-forte-2")).toBe("As senhas não conferem.");
    expect(passwordError("senha-forte-1", "senha-forte-1")).toBeNull();
  });
});
