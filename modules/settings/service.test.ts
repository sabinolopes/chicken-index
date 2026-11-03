import { describe, expect, it } from "vitest";
import type { SettingsRepository } from "@/modules/settings/repository";
import { changeWages } from "@/modules/settings/service";

/** Linha de configurações em memória; `exists: false` simula banco sem a linha id = 1. */
function memorySettings(options: { exists?: boolean; fail?: boolean } = {}) {
  const state = { minWage: 1518, avgWage: 3225 };
  const repository: SettingsRepository = {
    async updateWages(wages) {
      if (options.fail) throw new Error("permission denied for table economic_settings");
      if (options.exists === false) return 0;
      Object.assign(state, wages);
      return 1;
    },
  };
  return { repository, state };
}

describe("changeWages", () => {
  it("grava os salários digitados com a máscara (milhar e centavos)", async () => {
    const settings = memorySettings();

    const result = await changeWages({ minWage: "1.621,00", avgWage: "3.402,57", settings: settings.repository });

    expect(result).toEqual({ ok: true, message: "Salários atualizados." });
    expect(settings.state).toEqual({ minWage: 1621, avgWage: 3402.57 });
  });

  it("recusa valor vazio ou zero sem tocar no banco", async () => {
    const settings = memorySettings();

    expect(await changeWages({ minWage: "", avgWage: "3.225,00", settings: settings.repository })).toEqual({
      ok: false,
      error: "Informe salários válidos.",
    });
    expect(await changeWages({ minWage: "1.621,00", avgWage: "0,00", settings: settings.repository })).toMatchObject({ ok: false });
    expect(settings.state).toEqual({ minWage: 1518, avgWage: 3225 });
  });

  it("avisa quando a linha de configurações não existe no banco", async () => {
    const result = await changeWages({ minWage: "1.621,00", avgWage: "3.225,00", settings: memorySettings({ exists: false }).repository });
    expect(result).toEqual({ ok: false, error: "Linha de configurações não encontrada — rode o supabase/schema.sql." });
  });

  it("repassa a recusa do banco (ex.: RLS sem permissão)", async () => {
    const result = await changeWages({ minWage: "1.621,00", avgWage: "3.225,00", settings: memorySettings({ fail: true }).repository });
    expect(result).toEqual({ ok: false, error: "Falha ao salvar: permission denied for table economic_settings" });
  });
});
