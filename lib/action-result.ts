/** Resposta de uma Server Action para a interface: sucesso com mensagem ou erro legível. */
export type ActionFailure = { ok: false; error: string };
export type ActionSuccess = { ok: true; message: string };
export type ActionResult = ActionSuccess | ActionFailure;

export const failure = (error: string): ActionFailure => ({ ok: false, error });
export const success = (message: string): ActionSuccess => ({ ok: true, message });

/** Texto de um erro qualquer (Error ou valor lançado), para compor mensagens. */
export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));
