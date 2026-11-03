"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/modules/auth/session";
import { createAdminDirectory } from "./directory";
import {
  createInviteLink,
  inviteAdmin as inviteAdminAccount,
  removeAdmin as removeAdminAccount,
  type InviteLinkResult,
} from "./service";

/** Endereço do site que recebeu a requisição: o link do convite volta para o mesmo domínio. */
async function setPasswordUrl() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}`;
  return `${origin}/auth/definir-senha`;
}

/** Convite pelo formulário: o botão clicado diz se vai por e-mail ou se só gera o link. */
export async function inviteAdmin(_previousState: ActionResult | InviteLinkResult | null, form: FormData): Promise<ActionResult | InviteLinkResult> {
  await requireAdmin();

  const options = { email: String(form.get("email") ?? ""), redirectTo: await setPasswordUrl(), directory: createAdminDirectory() };
  const result = form.get("delivery") === "link" ? await createInviteLink(options) : await inviteAdminAccount(options);
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}

/** Novo link para um convite pendente (o anterior expirou ou se perdeu). */
export async function renewInviteLink(email: string): Promise<InviteLinkResult> {
  await requireAdmin();
  return createInviteLink({ email, redirectTo: await setPasswordUrl(), directory: createAdminDirectory() });
}

export async function removeAdmin(userId: string): Promise<ActionResult> {
  const currentAdmin = await requireAdmin();

  const result = await removeAdminAccount({ currentUserId: currentAdmin.id, targetUserId: userId, directory: createAdminDirectory() });
  if (result.ok) revalidatePath("/admin/usuarios");
  return result;
}
