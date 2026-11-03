import { describe, expect, it } from "vitest";
import { invitationUrl } from "@/modules/admins/invite-url";

describe("invitationUrl", () => {
  it("leva para a nossa página com o código do convite, não para o Supabase", () => {
    const url = new URL(invitationUrl({ setPasswordUrl: "https://frangometro.vercel.app/auth/definir-senha", tokenHash: "abc123", type: "invite" }));

    expect(url.origin).toBe("https://frangometro.vercel.app");
    expect(url.pathname).toBe("/auth/definir-senha");
    expect(Object.fromEntries(url.searchParams)).toEqual({ token_hash: "abc123", type: "invite" });
  });

  it("codifica o código e serve também para link de nova senha", () => {
    const url = invitationUrl({ setPasswordUrl: "http://localhost:3000/auth/definir-senha", tokenHash: "a+b/c=", type: "recovery" });
    expect(url).toBe("http://localhost:3000/auth/definir-senha?token_hash=a%2Bb%2Fc%3D&type=recovery");
  });
});
