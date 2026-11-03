import { describe, expect, it } from "vitest";
import { linkErrorMessage, readLink } from "@/components/blocks/set-password-form/session-from-link";

describe("readLink", () => {
  it("link do painel: guarda o código do convite para usar só ao salvar", () => {
    const link = readLink({ hash: "", search: "?token_hash=abc123&type=invite" });
    expect(link.claim).toEqual({ tokenHash: "abc123", type: "invite" });
    expect(link.error).toBeNull();
  });

  it("aceita também link de nova senha e ignora tipo desconhecido", () => {
    expect(readLink({ hash: "", search: "?token_hash=abc&type=recovery" }).claim).toEqual({ tokenHash: "abc", type: "recovery" });
    expect(readLink({ hash: "", search: "?token_hash=abc&type=signup_qualquer" }).claim).toBeNull();
    expect(readLink({ hash: "", search: "?token_hash=abc" }).claim).toBeNull();
  });

  it("link antigo do e-mail: a sessão já vem pronta no fragmento", () => {
    const link = readLink({ hash: "#access_token=aaa&refresh_token=bbb&type=invite", search: "" });
    expect(link.claim).toBeNull();
    expect(link.session).toEqual({ accessToken: "aaa", refreshToken: "bbb", code: null });
  });

  it("erro do Supabase no link vira mensagem em português", () => {
    const link = readLink({ hash: "#error=access_denied&error_description=Email+link+is+invalid+or+has+expired", search: "" });
    expect(link.error).toBe("Este link expirou ou já foi usado.");
  });
});

describe("linkErrorMessage", () => {
  it("traduz o link vencido do Supabase e repassa os outros erros", () => {
    expect(linkErrorMessage("Email link is invalid or has expired")).toBe("Este link expirou ou já foi usado.");
    expect(linkErrorMessage("Signups not allowed")).toBe("Signups not allowed");
  });
});
