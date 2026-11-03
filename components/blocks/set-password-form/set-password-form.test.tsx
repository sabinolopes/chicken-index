// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetPasswordForm } from "@/components/blocks/set-password-form";

// Fronteiras externas: a sessão vinda do link do e-mail, o Supabase e a navegação do Next.
const updateUser = vi.fn();
const replace = vi.fn();
vi.mock("@/components/blocks/set-password-form/session-from-link", () => ({
  sessionFromLink: vi.fn(async () => ({ kind: "ready", email: "xpto_99@exemplo.com", name: null })),
}));
vi.mock("@/lib/supabase/browser", () => ({ createBrowserSupabase: () => ({ auth: { updateUser } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

async function fill({ name, password }: { name: string; password: string }) {
  await screen.findByText("xpto_99@exemplo.com");
  if (name) await userEvent.type(screen.getByLabelText("Seu nome"), name);
  await userEvent.type(screen.getByLabelText("Nova senha"), password);
  await userEvent.type(screen.getByLabelText("Repita a senha"), password);
  await userEvent.click(screen.getByRole("button", { name: "Salvar e entrar" }));
}

describe("SetPasswordForm", () => {
  beforeEach(() => {
    updateUser.mockReset().mockResolvedValue({ error: null });
    replace.mockReset();
  });

  it("salva a senha junto com o nome (sem espaços sobrando) e entra no painel", async () => {
    render(<SetPasswordForm />);

    await fill({ name: "  Ana   Souza ", password: "senha-forte-1" });

    expect(updateUser).toHaveBeenCalledWith({ password: "senha-forte-1", data: { full_name: "Ana Souza" } });
    expect(replace).toHaveBeenCalledWith("/admin");
  });

  it("não envia nada sem nome", async () => {
    render(<SetPasswordForm />);
    const nameField = await screen.findByLabelText("Seu nome");
    // Sem o `required` do navegador, para conferir a validação do próprio formulário.
    nameField.removeAttribute("required");

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
