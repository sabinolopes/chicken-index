import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/config";
import { createServerSupabase } from "./supabase/server";
import { isAdminUser } from "./admin-role";

export { isAdminUser };

export interface AdminUser {
  email: string;
  demo: boolean;
}

/** Admin logado, ou `null`. No Modo Demo não há login: todos entram como admin demo. */
export async function getAdmin(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return { email: "admin@demo", demo: true };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminUser(user) ? { email: user!.email ?? "admin", demo: false } : null;
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
