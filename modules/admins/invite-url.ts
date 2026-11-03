export type InviteLinkType = "invite" | "recovery";

/**
 * Link que o admin manda por WhatsApp. Aponta para a nossa página de definir senha (não
 * para o Supabase): quem abre o link — inclusive o robô que monta a prévia do WhatsApp —
 * não gasta o convite. O código só é usado quando a pessoa salva a senha.
 */
export function invitationUrl({ setPasswordUrl, tokenHash, type }: { setPasswordUrl: string; tokenHash: string; type: InviteLinkType }) {
  const url = new URL(setPasswordUrl);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  return url.toString();
}
