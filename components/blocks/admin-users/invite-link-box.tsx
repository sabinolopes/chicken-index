import { MessageCircle } from "lucide-react";
import { buttonClass } from "@/components/elements/button";
import { CopyButton } from "@/components/elements/copy-button";

/** Mensagem pronta para o WhatsApp, com o link no fim (o app transforma em link clicável). */
export const whatsappShareUrl = (link: string) =>
  `https://wa.me/?text=${encodeURIComponent(`Seu convite para o painel do Frangômetro (abra e defina sua senha): ${link}`)}`;

/** Link de convite gerado sem e-mail, com atalhos para copiar ou mandar pelo WhatsApp. */
export function InviteLinkBox({ message, link }: { message: string; link: string }) {
  return (
    <div role="status" className="space-y-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
      <p className="text-emerald-900">{message}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          aria-label="Link de convite"
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-xs text-foreground"
        />
        <CopyButton text={link} label="Copiar" className={buttonClass("secondary")} />
      </div>
      <a href={whatsappShareUrl(link)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
        <MessageCircle className="size-4" aria-hidden />
        Enviar pelo WhatsApp
      </a>
    </div>
  );
}
