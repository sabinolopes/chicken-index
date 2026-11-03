import type { ReactNode } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";

const TONE = {
  error: { className: "bg-red-50 text-red-800", Icon: TriangleAlert, role: "alert" },
  warning: { className: "bg-amber-50 text-amber-900", Icon: TriangleAlert, role: "status" },
  success: { className: "bg-emerald-50 text-emerald-800", Icon: CheckCircle2, role: "status" },
} as const;

type AlertTone = keyof typeof TONE;

interface AlertProps {
  tone: AlertTone;
  children: ReactNode;
  className?: string;
}

/** Mensagem com ícone. Erro é anunciado na hora pelo leitor de tela (`role="alert"`). */
export function Alert({ tone, children, className = "" }: AlertProps) {
  const { className: toneClass, Icon, role } = TONE[tone];
  return (
    <p role={role} className={`flex items-start gap-2 rounded-lg p-2.5 text-sm ${toneClass} ${className}`.trim()}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** Resultado de uma Server Action: verde no sucesso, vermelho no erro, nada antes do envio. */
export function ActionMessage({ result, className }: { result: { ok: true; message: string } | { ok: false; error: string } | null; className?: string }) {
  if (!result) return null;
  if (result.ok) return <Alert tone="success" className={className}>{result.message}</Alert>;
  return <Alert tone="error" className={className}>{result.error}</Alert>;
}
