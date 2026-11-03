// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InviteAdminForm } from "@/components/blocks/admin-users";
import { whatsappShareUrl } from "@/components/blocks/admin-users/invite-link-box";

const inviteAdmin = vi.fn();
vi.mock("@/modules/admins/actions", () => ({ inviteAdmin: (...actionArguments: unknown[]) => inviteAdmin(...actionArguments) }));

const LINK = "https://projeto.supabase.co/auth/v1/verify?token=abc&type=invite";

async function submitWith(buttonName: string) {
  render(<InviteAdminForm />);
  await userEvent.type(screen.getByLabelText("E-mail"), "victor@exemplo.com");
  await userEvent.click(screen.getByRole("button", { name: buttonName }));
}

describe("InviteAdminForm", () => {
  beforeEach(() => inviteAdmin.mockReset());

  it("'Gerar link' pede o link (não o e-mail) e mostra o link com atalho para o WhatsApp", async () => {
    inviteAdmin.mockResolvedValue({ ok: true, message: "Link de convite criado para victor@exemplo.com.", link: LINK });

    await submitWith("Gerar link");

    const form = inviteAdmin.mock.calls[0][1] as FormData;
    expect([form.get("email"), form.get("delivery")]).toEqual(["victor@exemplo.com", "link"]);
    expect((await screen.findByLabelText("Link de convite")).getAttribute("value")).toBe(LINK);
    expect(screen.getByRole("link", { name: "Enviar pelo WhatsApp" }).getAttribute("href")).toBe(whatsappShareUrl(LINK));
  });

  it("'Enviar por e-mail' manda pelo e-mail e mostra só a confirmação", async () => {
    inviteAdmin.mockResolvedValue({ ok: true, message: "Convite enviado para victor@exemplo.com." });

    await submitWith("Enviar por e-mail");

    expect((inviteAdmin.mock.calls[0][1] as FormData).get("delivery")).toBe("email");
    expect(await screen.findByText("Convite enviado para victor@exemplo.com.")).toBeTruthy();
    expect(screen.queryByLabelText("Link de convite")).toBeNull();
  });

  it("mostra o erro quando o Supabase recusa (ex.: limite de e-mails)", async () => {
    inviteAdmin.mockResolvedValue({ ok: false, error: "Falha ao convidar: email rate limit exceeded" });

    await submitWith("Enviar por e-mail");

    expect((await screen.findByRole("alert")).textContent).toContain("email rate limit exceeded");
  });
});

describe("whatsappShareUrl", () => {
  it("monta a mensagem com o link codificado para a URL do WhatsApp", () => {
    const url = new URL(whatsappShareUrl(LINK));
    expect(url.origin).toBe("https://wa.me");
    expect(url.searchParams.get("text")).toBe(`Seu convite para o painel do Frangômetro (abra e defina sua senha): ${LINK}`);
  });
});
