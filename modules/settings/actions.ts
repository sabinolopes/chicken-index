"use server";

import type { ActionResult } from "@/lib/action-result";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/auth/session";
import { refreshDashboard } from "@/modules/dashboard/cache";
import { createSettingsRepository } from "./repository";
import { changeWages } from "./service";

export async function updateSettings(_previousState: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();

  const settings = createSettingsRepository(await createServerSupabase());
  const result = await changeWages({
    minWage: String(form.get("min_wage") ?? ""),
    avgWage: String(form.get("avg_wage") ?? ""),
    settings,
  });
  if (result.ok) refreshDashboard();
  return result;
}
