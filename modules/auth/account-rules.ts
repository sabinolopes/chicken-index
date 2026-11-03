// Regras da conta de admin (nome e senha), usadas no navegador e no servidor.

export const PASSWORD_MIN_LENGTH = 8;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 60;

/**
 * Nome de exibição como será guardado: sem espaços sobrando e com tamanho limitado.
 * Fica em `user_metadata.full_name`, que o próprio usuário pode editar — serve só para
 * exibir, nunca para permissão (essa vem do `app_metadata`).
 */
export function normalizeDisplayName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").slice(0, NAME_MAX_LENGTH);
}

/** Nome guardado na conta, ou null se a pessoa ainda não informou. */
export function displayNameFromMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  return normalizeDisplayName(metadata?.full_name) || null;
}

/** Erro de preenchimento do nome; null quando serve. */
export function displayNameError(name: string) {
  if (normalizeDisplayName(name).length < NAME_MIN_LENGTH) return "Informe seu nome (pelo menos 2 letras).";
  return null;
}

/** Erro de digitação da senha antes de chamar o servidor; null quando as senhas servem. */
export function passwordError(password: string, confirmation: string) {
  if (password.length < PASSWORD_MIN_LENGTH) return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (password !== confirmation) return "As senhas não conferem.";
  return null;
}
