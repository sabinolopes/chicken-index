import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import { isAdminUser } from "./admin-role";

export { isAdminUser };

export interface AdminUser {
  id: string;
  email: string;
}

/** Admin logado, ou `null` (sem sessão ou sem `app_metadata.role = admin`). */
export async function getAdmin(): Promise<AdminUser | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminUser(user) ? { id: user!.id, email: user!.email ?? "admin" } : null;
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
