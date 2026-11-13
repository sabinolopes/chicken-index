// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsForm } from "@/components/blocks/settings-form";

vi.mock("@/modules/settings/actions", () => ({ updateSettings: vi.fn() }));

const settings = { min_wage: 1621, avg_wage: 3932, updated_at: "2026-11-05T16:41:00Z" };

describe("SettingsForm", () => {
  it("fechado, mostra os salários atuais numa linha, sem os campos", () => {
    render(<SettingsForm settings={settings} />);

    expect(screen.getByText(/1\.621,00/)).toBeTruthy();
    expect(screen.getByText(/3\.932,00/)).toBeTruthy();
    expect(screen.queryByLabelText("Salário mínimo (R$)")).toBeNull();
  });

  it("'Editar' abre os campos já preenchidos, e 'Fechar' recolhe de novo", async () => {
    render(<SettingsForm settings={settings} />);

    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    const minWage = screen.getByLabelText("Salário mínimo (R$)") as HTMLInputElement;
    expect(minWage.value).toBe("1.621,00");
    expect(minWage).toBe(document.activeElement);

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByLabelText("Salário mínimo (R$)")).toBeNull();
  });
});
