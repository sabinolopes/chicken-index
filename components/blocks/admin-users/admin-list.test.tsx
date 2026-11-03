// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminList } from "@/components/blocks/admin-users/admin-list";
import type { AdminListItem } from "@/modules/admins/service";

// A lista só chama a action ao remover; aqui o teste é sobre o que aparece na tela.
vi.mock("@/modules/admins/actions", () => ({ removeAdmin: vi.fn() }));

const admin = (overrides: Partial<AdminListItem>): AdminListItem => ({
  id: "id",
  email: "pessoa@exemplo.com",
  name: null,
  pending: false,
  invitedAt: null,
  lastSignInAt: "2026-11-02T13:30:00Z",
  ...overrides,
});

describe("AdminList", () => {
  it("mostra o nome em destaque e o e-mail embaixo, e marca você", () => {
    render(<AdminList admins={[admin({ id: "eu", name: "Ana Souza", email: "xpto_99@exemplo.com" })]} currentUserId="eu" />);

    const row = screen.getByRole("listitem");
    expect(within(row).getByText(/Ana Souza/)).toBeTruthy();
    expect(within(row).getByText("xpto_99@exemplo.com")).toBeTruthy();
    expect(within(row).getByText("(você)")).toBeTruthy();
    // Ninguém remove a si mesmo: sem botão na própria linha.
    expect(within(row).queryByRole("button")).toBeNull();
  });

  it("sem nome (convite pendente), identifica pelo e-mail sem repeti-lo", () => {
    render(<AdminList admins={[admin({ id: "novo", email: "novo@exemplo.com", pending: true, lastSignInAt: null })]} currentUserId="eu" />);

    expect(screen.getAllByText(/novo@exemplo\.com/)).toHaveLength(1);
    expect(screen.getByText(/Convite pendente/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar convite de novo@exemplo.com" })).toBeTruthy();
  });

  it("o botão de remover diz o nome da pessoa", () => {
    render(<AdminList admins={[admin({ id: "outra", name: "Bia Lima" })]} currentUserId="eu" />);
    expect(screen.getByRole("button", { name: "Remover Bia Lima" })).toBeTruthy();
  });
});
