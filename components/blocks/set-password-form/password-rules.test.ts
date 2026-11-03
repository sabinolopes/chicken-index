import { describe, expect, it } from "vitest";
import { linkErrorMessage } from "@/components/blocks/set-password-form/session-from-link";
import { passwordError } from "@/components/blocks/set-password-form/set-password-form";

describe("passwordError", () => {
  it("exige ao menos 8 caracteres e as duas senhas iguais", () => {
    expect(passwordError("curta", "curta")).toBe("A senha precisa ter pelo menos 8 caracteres.");
    expect(passwordError("senha-forte-1", "senha-forte-2")).toBe("As senhas não conferem.");
    expect(passwordError("senha-forte-1", "senha-forte-1")).toBeNull();
  });
});

describe("linkErrorMessage", () => {
  it("traduz o link vencido do Supabase e repassa os outros erros", () => {
    expect(linkErrorMessage("Email link is invalid or has expired")).toBe("Este link expirou ou já foi usado.");
    expect(linkErrorMessage("Signups not allowed")).toBe("Signups not allowed");
  });
});
