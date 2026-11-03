import { describe, expect, it } from "vitest";
import { linkErrorMessage } from "@/components/blocks/set-password-form/session-from-link";

describe("linkErrorMessage", () => {
  it("traduz o link vencido do Supabase e repassa os outros erros", () => {
    expect(linkErrorMessage("Email link is invalid or has expired")).toBe("Este link expirou ou já foi usado.");
    expect(linkErrorMessage("Signups not allowed")).toBe("Signups not allowed");
  });
});
