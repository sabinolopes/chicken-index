import type { User } from "@supabase/supabase-js";

/** Mesmo critério da função SQL `public.is_admin()` (app_metadata só é editável no servidor). */
export function isAdminUser(user: Pick<User, "app_metadata"> | null | undefined) {
  return user?.app_metadata?.role === "admin";
}
