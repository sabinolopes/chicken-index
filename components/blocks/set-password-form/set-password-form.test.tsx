// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetPasswordForm } from "@/components/blocks/set-password-form";

// Fronteiras externas: o link (sessão/convite), o Supabase e a navegação do Next.
const sessionFromLink = vi.fn();
const claimInvite = vi.fn();
const updateUser = vi.fn();
const replace = vi.fn();
const calls: string[] = [];
vi.mock("@/components/blocks/set-password-form/session-from-link", () => ({
  sessionFromLink: () => sessionFromLink(),
  claimInvite: (link: unknown) => claimInvite(link),
}));
vi.mock("@/lib/supabase/browser", () => ({ createBrowserSupabase: () => ({ auth: { updateUser } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const READY = { kind: "ready", email: "xpto_99@exemplo.com", name: null };
const CLAIMABLE = { kind: "claimable", tokenHash: "abc123", type: "invite" };

async function fill({ name, password }: { name: string; password: string }) {
  const nameField = await screen.findByLabelText("Seu nome");
  if (name) await userEvent.type(nameField, name);
  await userEvent.type(screen.getByLabelText("Nova senha"), password);
  await userEvent.type(screen.getByLabelText("Repita a senha"), password);
  await userEvent.click(screen.getByRole("button", { name: "Salvar e entrar" }));
}

describe("SetPasswordForm", () => {
  beforeEach(() => {
    calls.length = 0;
    sessionFromLink.mockReset().mockResolvedValue(READY);
    claimInvite.mockReset().mockImplementation(async () => {
      calls.push("claimInvite");
      return READY;
    });
    updateUser.mockReset().mockImplementation(async () => {
      calls.push("updateUser");
      return { error: null };
    });
    replace.mockReset();
  });

  it("salva a senha junto com o nome (sem espaços sobrando) e entra no painel", async () => {
    render(<SetPasswordForm />);

    await fill({ name: "  Ana   Souza ", password: "senha-forte-1" });

    expect(updateUser).toHaveBeenCalledWith({ password: "senha-forte-1", data: { full_name: "Ana Souza" } });
    expect(replace).toHaveBeenCalledWith("/admin");
  });

  it("convite do painel: abrir o link não gasta o convite; só ao salvar, antes de gravar a senha", async () => {
    sessionFromLink.mockResolvedValue(CLAIMABLE);
    render(<SetPasswordForm />);

    expect(await screen.findByText(/O link só é usado quando você salvar/)).toBeTruthy();
    expect(claimInvite).not.toHaveBeenCalled();

    await fill({ name: "Victor Félix", password: "senha-forte-1" });

    expect(claimInvite).toHaveBeenCalledWith(CLAIMABLE);
    expect(calls).toEqual(["claimInvite", "updateUser"]);
    expect(replace).toHaveBeenCalledWith("/admin");
  });

  it("erro de digitação não gasta o convite", async () => {
    sessionFromLink.mockResolvedValue(CLAIMABLE);
    render(<SetPasswordForm />);
    (await screen.findByLabelText("Nova senha")).removeAttribute("minLength");

    await fill({ name: "Victor", password: "curta" });

    expect(await screen.findByText("A senha precisa ter pelo menos 8 caracteres.")).toBeTruthy();
    expect(claimInvite).not.toHaveBeenCalled();
  });

  it("convite vencido: avisa e não tenta gravar a senha", async () => {
    sessionFromLink.mockResolvedValue(CLAIMABLE);
    claimInvite.mockResolvedValue({ kind: "invalid", message: "Este link expirou ou já foi usado." });
    render(<SetPasswordForm />);

    await fill({ name: "Victor", password: "senha-forte-1" });

    expect(await screen.findByText("Este link expirou ou já foi usado.")).toBeTruthy();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("não envia nada sem nome", async () => {
    render(<SetPasswordForm />);
    (await screen.findByLabelText("Seu nome")).removeAttribute("required");

    await fill({ name: "", password: "senha-forte-1" });

    expect(await screen.findByText("Informe seu nome (pelo menos 2 letras).")).toBeTruthy();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("mostra o erro do Supabase em português e continua na tela", async () => {
    updateUser.mockResolvedValue({ error: { message: "New password should be different from the old password." } });
    render(<SetPasswordForm />);

    await fill({ name: "Ana", password: "senha-forte-1" });

    expect(await screen.findByText("Use uma senha diferente da anterior.")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
