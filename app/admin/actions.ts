"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminUser, requireAdmin } from "@/lib/auth";
import { PRICES_CACHE_TAG } from "@/lib/data";
import { isSupabaseConfigured, PHOTO_BUCKET } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { MAX_PHOTO_BYTES, parsePrice, parsePriceForm, PHOTO_MIME_TYPES, type PriceInput } from "@/lib/validation";

export type ActionResult = { ok: true; message: string; demo?: boolean; record?: PriceInput } | { ok: false; error: string };

/** Invalida o cache da home (ISR) logo após uma alteração do admin. */
function refreshPublicPages() {
  updateTag(PRICES_CACHE_TAG);
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Login / logout
// ---------------------------------------------------------------------------

export async function signIn(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) redirect("/admin");

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
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Cadastro de preço
// ---------------------------------------------------------------------------

export async function createPrice(form: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = parsePriceForm(form);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const input = parsed.data;

  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return { ok: false, error: "Foto comprimida ausente." };
  if (!PHOTO_MIME_TYPES.includes(photo.type)) return { ok: false, error: "A foto deve estar em .webp ou .jpg." };
  if (photo.size > MAX_PHOTO_BYTES) return { ok: false, error: "Foto comprimida maior que 1 MB." };

  if (admin.demo) {
    return {
      ok: true,
      demo: true,
      record: input,
      message: "Modo Demo: tudo validado, mas nada foi salvo (configure o Supabase para gravar de verdade).",
    };
  }

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
  const admin = await requireAdmin();
  if (admin.demo) return { ok: false, error: "Exclusão desativada no Modo Demo." };

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
  const admin = await requireAdmin();

  const minWage = parsePrice(String(form.get("min_wage") ?? ""));
  const avgWage = parsePrice(String(form.get("avg_wage") ?? ""));
  if (!(minWage > 0) || !(avgWage > 0)) return { ok: false, error: "Informe salários válidos." };
  if (admin.demo) return { ok: false, error: "Edição desativada no Modo Demo." };

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
