import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { displayNameFromMetadata } from "@/modules/auth/account-rules";
import { isAdminUser } from "@/modules/auth/role";

export interface UserAccount {
  id: string;
  email: string | null;
  /** Nome que a pessoa informou ao definir a senha; null para convites antigos ou pendentes. */
  name: string | null;
  isAdmin: boolean;
  invitedAt: string | null;
  lastSignInAt: string | null;
}

/** Operações de contas que as regras de admins precisam (Supabase Auth em produção). */
export interface AdminDirectory {
  listUsers(): Promise<UserAccount[]>;
  /** Envia o convite; `alreadyRegistered` quando o e-mail já tem conta. */
  invite(email: string, redirectTo: string): Promise<{ userId: string } | { alreadyRegistered: true }>;
  /** Cria a conta e devolve o link de convite sem enviar e-mail; `alreadyRegistered` quando já existe. */
  inviteLink(email: string, redirectTo: string): Promise<{ userId: string; link: string } | { alreadyRegistered: true }>;
  /** Link de uso único para uma conta existente definir uma nova senha (sem enviar e-mail). */
  passwordLink(email: string, redirectTo: string): Promise<string>;
  grantAdmin(userId: string): Promise<void>;
  /** Apaga a conta: cancela convite pendente e impede novos logins. */
  deleteUser(userId: string): Promise<void>;
}

/** Usa a service role: chame só depois de `requireAdmin()`. */
export function createAdminDirectory(): AdminDirectory {
  const auth = createAdminSupabase().auth.admin;
  return {
    async listUsers() {
      const { data, error } = await auth.listUsers({ perPage: 1000 });
      if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);
      return data.users.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        name: displayNameFromMetadata(user.user_metadata),
        isAdmin: isAdminUser(user),
        invitedAt: user.invited_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
      }));
    },
    async invite(email, redirectTo) {
      const { data, error } = await auth.inviteUserByEmail(email, { redirectTo });
      if (error?.code === "email_exists") return { alreadyRegistered: true };
      if (error) throw new Error(error.message);
      return { userId: data.user.id };
    },
    async inviteLink(email, redirectTo) {
      const { data, error } = await auth.generateLink({ type: "invite", email, options: { redirectTo } });
      if (error?.code === "email_exists") return { alreadyRegistered: true };
      if (error) throw new Error(error.message);
      return { userId: data.user.id, link: data.properties.action_link };
    },
    async passwordLink(email, redirectTo) {
      const { data, error } = await auth.generateLink({ type: "recovery", email, options: { redirectTo } });
      if (error) throw new Error(error.message);
      return data.properties.action_link;
    },
    async grantAdmin(userId) {
      const { error } = await auth.updateUserById(userId, { app_metadata: { role: "admin" } });
      if (error) throw new Error(error.message);
    },
    async deleteUser(userId) {
      const { error } = await auth.deleteUser(userId);
      if (error) throw new Error(error.message);
    },
  };
}
