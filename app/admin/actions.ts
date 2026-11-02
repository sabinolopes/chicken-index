"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminUser, requireAdmin } from "@/lib/auth";
import { PRICES_CACHE_TAG } from "@/lib/data";
import { PHOTO_BUCKET } from "@/lib/supabase/config";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { MAX_PHOTO_BYTES, parsePrice, parsePriceForm, PHOTO_MIME_TYPES, type PriceInput } from "@/lib/validation";

export type ActionResult = { ok: true; message: string; record?: PriceInput } | { ok: false; error: string };

/** Invalida o cache da home (ISR) logo após uma alteração do admin. */
function refreshPublicPages() {
  updateTag(PRICES_CACHE_TAG);
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Login / logout
// ---------------------------------------------------------------------------

export async function signIn(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Informe e-mail e senha." };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "E-mail ou senha incorretos." };
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    return { ok: false, error: "Esta conta não tem permissão de admin." };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Cadastro de preço
// ---------------------------------------------------------------------------

export async function createPrice(form: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = parsePriceForm(form);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const input = parsed.data;

  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return { ok: false, error: "Foto comprimida ausente." };
  if (!PHOTO_MIME_TYPES.includes(photo.type)) return { ok: false, error: "A foto deve estar em .webp ou .jpg." };
  if (photo.size > MAX_PHOTO_BYTES) return { ok: false, error: "Foto comprimida maior que 1 MB." };

  const supabase = await createServerSupabase();

  const { data: existing, error: dupError } = await supabase
    .from("chicken_prices")
    .select("id, recorded_at, market_name")
    .eq("original_sha256", input.original_sha256)
    .maybeSingle();
  if (dupError) return { ok: false, error: `Erro ao consultar o banco: ${dupError.message}` };
  if (existing) {
    return {
      ok: false,
      error: `Esta foto já foi cadastrada (${existing.market_name}, ${existing.recorded_at.split("-").reverse().join("/")}).`,
    };
  }

  const ext = photo.type === "image/webp" ? "webp" : "jpg";
  const path = `${input.recorded_at.slice(0, 7)}/${input.original_sha256}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo, {
    contentType: photo.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return { ok: false, error: `Falha no upload da foto: ${uploadError.message}` };

  const photoUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: insertError } = await supabase.from("chicken_prices").insert({ ...input, photo_url: photoUrl });
  if (insertError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    return { ok: false, error: `Falha ao salvar o registro: ${insertError.message}` };
  }

  refreshPublicPages();
  return { ok: true, record: input, message: "Preço cadastrado e publicado no dashboard." };
}

// ---------------------------------------------------------------------------
// Exclusão e configurações
// ---------------------------------------------------------------------------

export async function deletePrice(id: string): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createServerSupabase();
  const { data: row, error } = await supabase.from("chicken_prices").select("photo_url").eq("id", id).maybeSingle();
  if (error || !row) return { ok: false, error: "Registro não encontrado." };

  const { error: deleteError } = await supabase.from("chicken_prices").delete().eq("id", id);
  if (deleteError) return { ok: false, error: `Falha ao excluir: ${deleteError.message}` };

  const marker = `/object/public/${PHOTO_BUCKET}/`;
  const idx = row.photo_url.indexOf(marker);
  if (idx >= 0) await supabase.storage.from(PHOTO_BUCKET).remove([row.photo_url.slice(idx + marker.length)]);

  refreshPublicPages();
  return { ok: true, message: "Registro excluído." };
}

export async function updateSettings(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();

  const minWage = parsePrice(String(form.get("min_wage") ?? ""));
  const avgWage = parsePrice(String(form.get("avg_wage") ?? ""));
  if (!(minWage > 0) || !(avgWage > 0)) return { ok: false, error: "Informe salários válidos." };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("economic_settings")
    .update({ min_wage: minWage, avg_wage: avgWage })
    .eq("id", 1)
    .select("id");
  if (error) return { ok: false, error: `Falha ao salvar: ${error.message}` };
  if (!data?.length) return { ok: false, error: "Linha de configurações não encontrada — rode o supabase/schema.sql." };

  refreshPublicPages();
  return { ok: true, message: "Salários atualizados." };
}

// ---------------------------------------------------------------------------
// Admins: convite por e-mail e remoção
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteAdmin(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Informe um e-mail válido." };

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = createAdminSupabase();

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/definir-senha`,
  });

  let userId = data?.user?.id;
  let message = `Convite enviado para ${email}. O link vale por 24 horas.`;

  if (error) {
    if (error.code !== "email_exists") return { ok: false, error: `Falha ao convidar: ${error.message}` };
    // Já tem conta (ex.: convidado antes): só promove a admin.
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return { ok: false, error: `Falha ao buscar o usuário: ${listError.message}` };
    const existing = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!existing) return { ok: false, error: "Usuário existente não encontrado." };
    if (isAdminUser(existing)) return { ok: false, error: `${email} já é admin.` };
    userId = existing.id;
    message = `${email} já tinha conta e agora é admin. Peça para entrar em /admin/login.`;
  }

  const { error: roleError } = await supabase.auth.admin.updateUserById(userId!, { app_metadata: { role: "admin" } });
  if (roleError) return { ok: false, error: `Convite enviado, mas falhou ao marcar como admin: ${roleError.message}` };

  revalidatePath("/admin/usuarios");
  return { ok: true, message };
}

export async function removeAdmin(userId: string): Promise<ActionResult> {
  const me = await requireAdmin();
  if (userId === me.id) return { ok: false, error: "Você não pode remover a si mesmo." };

  const supabase = createAdminSupabase();
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return { ok: false, error: listError.message };
  if (list.users.filter(isAdminUser).length <= 1) return { ok: false, error: "É preciso manter pelo menos um admin." };

  // Apaga a conta: cancela convite pendente e impede novos logins. Uma sessão já
  // aberta ainda vale até o token expirar (até 1 hora).
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: `Falha ao remover: ${error.message}` };

  revalidatePath("/admin/usuarios");
  return { ok: true, message: "Acesso removido." };
}
