import type { EmailOtpType } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export type LinkStatus = { kind: "checking" } | { kind: "ready"; email: string } | { kind: "invalid"; message: string };

const EXPIRED = "Este link expirou ou já foi usado.";

/** Mensagem do Supabase no link (ex.: "Email link is invalid or has expired") em português. */
export const linkErrorMessage = (description: string) => (/expired|invalid/i.test(description) ? EXPIRED : description);

/** Troca o que veio no link por uma sessão, em qualquer dos três formatos que o Supabase usa. */
async function exchangeLinkForSession(hash: URLSearchParams, query: URLSearchParams) {
  const supabase = createBrowserSupabase();
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) return supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

  const tokenHash = query.get("token_hash");
  const type = query.get("type") as EmailOtpType | null;
  if (tokenHash && type) return supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  const code = query.get("code");
  if (code) return supabase.auth.exchangeCodeForSession(code);
  return { error: null };
}

/** Abre a sessão a partir do link do e-mail (convite). Sem link, vale a sessão já aberta (trocar senha). */
export async function sessionFromLink(): Promise<LinkStatus> {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);

  const linkError = hash.get("error_description") ?? query.get("error_description");
  if (linkError) return { kind: "invalid", message: linkErrorMessage(linkError) };

  const { error } = await exchangeLinkForSession(hash, query);
  // Tira os tokens da barra de endereço (e do histórico).
  window.history.replaceState(null, "", window.location.pathname);
  if (error) return { kind: "invalid", message: EXPIRED };

  const {
    data: { user },
  } = await createBrowserSupabase().auth.getUser();
  if (!user) return { kind: "invalid", message: "Abra esta página pelo link do e-mail de convite." };
  return { kind: "ready", email: user.email ?? "" };
}
