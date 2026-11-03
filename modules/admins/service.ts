import { errorMessage, failure, success, type ActionFailure, type ActionResult } from "@/lib/action-result";
import type { AdminDirectory, UserAccount } from "./directory";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AdminListItem {
  id: string;
  email: string;
  /** Convidado, mas ainda não definiu a senha. */
  pending: boolean;
  invitedAt: string | null;
  lastSignInAt: string | null;
}

/** Só as contas de admin, em ordem alfabética de e-mail, no formato da página Admins. */
export function toAdminList(accounts: UserAccount[]): AdminListItem[] {
  return accounts
    .filter((account) => account.isAdmin)
    .map((account) => ({
      id: account.id,
      email: account.email ?? "(sem e-mail)",
      pending: !account.lastSignInAt,
      invitedAt: account.invitedAt,
      lastSignInAt: account.lastSignInAt,
    }))
    .sort((first, second) => first.email.localeCompare(second.email));
}

interface InviteAdminOptions {
  email: string;
  /** Página que recebe o link do e-mail (definir senha). */
  redirectTo: string;
  directory: AdminDirectory;
}

/** Quem já tinha conta (ex.: convidado antes) não recebe novo convite: só vira admin. */
async function existingAccountToPromote(email: string, directory: AdminDirectory): Promise<{ userId: string; message: string } | ActionFailure> {
  const accounts = await directory.listUsers();
  const existing = accounts.find((account) => account.email?.toLowerCase() === email);
  if (!existing) return failure("Usuário existente não encontrado.");
  if (existing.isAdmin) return failure(`${email} já é admin.`);
  return { userId: existing.id, message: `${email} já tinha conta e agora é admin. Peça para entrar em /admin/login.` };
}

export async function inviteAdmin({ email: typedEmail, redirectTo, directory }: InviteAdminOptions): Promise<ActionResult> {
  const email = typedEmail.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return failure("Informe um e-mail válido.");

  let target: { userId: string; message: string } | ActionFailure;
  try {
    const invitation = await directory.invite(email, redirectTo);
    target =
      "userId" in invitation
        ? { userId: invitation.userId, message: `Convite enviado para ${email}. O link vale por 24 horas.` }
        : await existingAccountToPromote(email, directory);
  } catch (error) {
    return failure(`Falha ao convidar: ${errorMessage(error)}`);
  }
  if ("ok" in target) return target;

  try {
    await directory.grantAdmin(target.userId);
  } catch (error) {
    return failure(`Convite enviado, mas falhou ao marcar como admin: ${errorMessage(error)}`);
  }
  return success(target.message);
}

interface RemoveAdminOptions {
  currentUserId: string;
  targetUserId: string;
  directory: AdminDirectory;
}

/**
 * Remove o acesso apagando a conta. Só apaga contas de admin (nunca qualquer usuário),
 * nunca a própria e nunca o último admin. Uma sessão já aberta vale até o token expirar (até 1 hora).
 */
export async function removeAdmin({ currentUserId, targetUserId, directory }: RemoveAdminOptions): Promise<ActionResult> {
  if (targetUserId === currentUserId) return failure("Você não pode remover a si mesmo.");

  try {
    const admins = (await directory.listUsers()).filter((account) => account.isAdmin);
    if (!admins.some((account) => account.id === targetUserId)) return failure("Admin não encontrado.");
    if (admins.length <= 1) return failure("É preciso manter pelo menos um admin.");
    await directory.deleteUser(targetUserId);
  } catch (error) {
    return failure(`Falha ao remover: ${errorMessage(error)}`);
  }
  return success("Acesso removido.");
}
