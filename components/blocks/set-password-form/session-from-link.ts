import type { EmailOtpType } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { displayNameFromMetadata } from "@/modules/auth/account-rules";

export type LinkStatus =
  | { kind: "checking" }
  /** Convite ainda não usado: o código só é gasto quando a pessoa salvar a senha. */
  | { kind: "claimable"; tokenHash: string; type: EmailOtpType }
  | { kind: "ready"; email: string; name: string | null }
  | { kind: "invalid"; message: string };

const EXPIRED = "Este link expirou ou já foi usado.";

/** Mensagem do Supabase no link (ex.: "Email link is invalid or has expired") em português. */
export const linkErrorMessage = (description: string) => (/expired|invalid/i.test(description) ? EXPIRED : description);

const CLAIMABLE_TYPES: readonly string[] = ["invite", "recovery", "magiclink", "email"];

/**
 * O que veio no endereço da página, sem chamar nada. Links gerados pelo painel trazem
 * `token_hash` (código ainda não usado); links antigos do e-mail já chegam com a sessão aberta.
 */
export function readLink({ hash, search }: { hash: string; search: string }) {
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const query = new URLSearchParams(search);
  const error = fragment.get("error_description") ?? query.get("error_description");
  const tokenHash = query.get("token_hash");
  const type = query.get("type");
  return {
    error: error ? linkErrorMessage(error) : null,
    claim: tokenHash && type && CLAIMABLE_TYPES.includes(type) ? { tokenHash, type: type as EmailOtpType } : null,
    session: { accessToken: fragment.get("access_token"), refreshToken: fragment.get("refresh_token"), code: query.get("code") },
  };
}

/** Links antigos (fluxo do e-mail do Supabase): a sessão já veio pronta no endereço. */
async function openSessionFromLink({ accessToken, refreshToken, code }: ReturnType<typeof readLink>["session"]) {
  const supabase = createBrowserSupabase();
  if (accessToken && refreshToken) return supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (code) return supabase.auth.exchangeCodeForSession(code);
  return { error: null };
}

/** Estado inicial da página. Com convite do painel, não gasta o código: só avisa que dá para usá-lo. */
export async function sessionFromLink(): Promise<LinkStatus> {
  const link = readLink(window.location);
  if (link.error) return { kind: "invalid", message: link.error };
  if (link.claim) return { kind: "claimable", ...link.claim };

  const { error } = await openSessionFromLink(link.session);
  // Tira os tokens da barra de endereço (e do histórico).
  window.history.replaceState(null, "", window.location.pathname);
  if (error) return { kind: "invalid", message: EXPIRED };

  const {
    data: { user },
  } = await createBrowserSupabase().auth.getUser();
  if (!user) return { kind: "invalid", message: "Abra esta página pelo link do convite." };
  return { kind: "ready", email: user.email ?? "", name: displayNameFromMetadata(user.user_metadata) };
}

/** Usa o código do convite e abre a sessão. Chamado só quando a pessoa salva a senha. */
export async function claimInvite({ tokenHash, type }: { tokenHash: string; type: EmailOtpType }): Promise<LinkStatus> {
  const { data, error } = await createBrowserSupabase().auth.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data.user) return { kind: "invalid", message: EXPIRED };
  window.history.replaceState(null, "", window.location.pathname);
  return { kind: "ready", email: data.user.email ?? "", name: displayNameFromMetadata(data.user.user_metadata) };
}
