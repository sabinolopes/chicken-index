import { describe, expect, it } from "vitest";
import { isAdminUser } from "@/lib/admin-role";

describe("isAdminUser", () => {
  it("só libera quem tem role admin no app_metadata (definido pelo servidor, não pelo usuário)", () => {
    expect(isAdminUser({ app_metadata: { role: "admin" } })).toBe(true);
  });

  it("nega qualquer outro caso: sem sessão, sem role ou role diferente", () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
    expect(isAdminUser({ app_metadata: {} })).toBe(false);
    expect(isAdminUser({ app_metadata: { role: "editor" } })).toBe(false);
    expect(isAdminUser({ app_metadata: { role: "Admin" } })).toBe(false);
  });
});
