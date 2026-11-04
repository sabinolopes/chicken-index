import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getDashboardData } from "@/modules/dashboard/queries";
import { linkPreview, type PreviewTone } from "@/modules/dashboard/link-preview";
import { computeKpis } from "@/modules/dashboard/stats";

// Imagem da prévia quando o link é colado no WhatsApp e nas redes. Usa os mesmos
// dados em cache da página (1 hora, invalidados quando o admin cadastra).
export const alt = "Frangômetro: preço médio do kg do peito de frango, variação e poder de compra";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TONE_STYLE: Record<PreviewTone, { color: string; background: string; arrow: string }> = {
  up: { color: "#b42318", background: "#fde8e7", arrow: "▲" },
  down: { color: "#047857", background: "#e7f6ee", arrow: "▼" },
  stable: { color: "#57534e", background: "#f0ede8", arrow: "■" },
};

// Geist (licença OFL) em arquivo: a imagem não depende do Google Fonts no ar.
const readFont = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

export default async function OpengraphImage() {
  const [data, regular, extraBold] = await Promise.all([getDashboardData(), readFont("Geist-Regular.ttf"), readFont("Geist-ExtraBold.ttf")]);
  const preview = linkPreview(computeKpis(data.prices, data.settings));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "Geist", background: "#f7f5f1", color: "#1c1917", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#b42318", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23" fill="#fff" />
              <path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59" fill="none" />
            </svg>
          </div>
          <div style={{ fontFamily: "Geist ExtraBold", fontSize: 48 }}>Frangômetro</div>
        </div>

        {preview ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
            <div style={{ fontSize: 34, color: "#57534e" }}>{`Preço médio do kg do peito de frango · ${preview.week}`}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 8 }}>
              <div style={{ fontFamily: "Geist ExtraBold", fontSize: 150, letterSpacing: -4 }}>{preview.price}</div>
              {preview.change && (
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Geist ExtraBold",
                    fontSize: 40,
                    padding: "12px 28px",
                    borderRadius: 999,
                    color: TONE_STYLE[preview.change.tone].color,
                    background: TONE_STYLE[preview.change.tone].background,
                  }}
                >
                  {`${TONE_STYLE[preview.change.tone].arrow} ${preview.change.text}`}
                </div>
              )}
            </div>
            <div style={{ fontSize: 38, marginTop: 8 }}>{preview.wage}</div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 56, marginTop: 72, lineHeight: 1.2 }}>Monitor semanal do preço do peito de frango</div>
        )}

        <div style={{ display: "flex", marginTop: "auto", fontSize: 30, color: "#57534e" }}>
          Etiquetas fotografadas e auditadas (EXIF + SHA-256)
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist ExtraBold", data: extraBold, weight: 800, style: "normal" },
      ],
    },
  );
}
