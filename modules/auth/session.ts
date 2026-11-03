import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { displayNameFromMetadata } from "./account-rules";
import { isAdminUser } from "./role";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
}

/** Admin logado, ou `null` (sem sessão ou sem `app_metadata.role = admin`). */
export async function getAdmin(): Promise<AdminUser | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) return null;
  return { id: user.id, email: user.email ?? "admin", name: displayNameFromMetadata(user.user_metadata) };
}

/** Use no início de toda página ou ação de admin: sem permissão, vai para o login. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
