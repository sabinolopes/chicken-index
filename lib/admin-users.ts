import "server-only";
import { isAdminUser } from "./admin-role";
import { createAdminSupabase } from "./supabase/admin";

export interface AdminListItem {
  id: string;
  email: string;
  /** Convidado, mas ainda não definiu a senha. */
  pending: boolean;
  invitedAt: string | null;
  lastSignInAt: string | null;
}

/** Todos os usuários com `app_metadata.role = admin`. Chamar só depois de `requireAdmin()`. */
export async function listAdmins(): Promise<AdminListItem[]> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);

  return data.users
    .filter(isAdminUser)
    .map((user) => ({
      id: user.id,
      email: user.email ?? "(sem e-mail)",
      pending: !user.last_sign_in_at,
      invitedAt: user.invited_at ?? null,
      lastSignInAt: user.last_sign_in_at ?? null,
    }))
    .sort((first, second) => first.email.localeCompare(second.email));
}
