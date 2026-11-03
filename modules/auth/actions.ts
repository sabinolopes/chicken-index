"use server";

import { redirect } from "next/navigation";
import { failure, type ActionResult } from "@/lib/action-result";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAdminUser } from "./role";

export async function signIn(_previousState: ActionResult | null, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return failure("Informe e-mail e senha.");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return failure("E-mail ou senha incorretos.");
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    return failure("Esta conta não tem permissão de admin.");
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
