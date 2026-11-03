"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/modules/auth/session";
import { createAdminDirectory } from "./directory";
import { inviteAdmin as inviteAdminAccount, removeAdmin as removeAdminAccount } from "./service";

/** Endereço do site que recebeu a requisição: o link do e-mail volta para o mesmo domínio. */
async function requestOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;
  return `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;
}

export async function inviteAdmin(_previousState: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();

  const result = await inviteAdminAccount({
    email: String(form.get("email") ?? ""),
    redirectTo: `${await requestOrigin()}/auth/definir-senha`,
    directory: createAdminDirectory(),
  });
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}

export async function removeAdmin(userId: string): Promise<ActionResult> {
  const currentAdmin = await requireAdmin();

  const result = await removeAdminAccount({ currentUserId: currentAdmin.id, targetUserId: userId, directory: createAdminDirectory() });
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}
