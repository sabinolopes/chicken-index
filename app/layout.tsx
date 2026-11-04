import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Frangômetro · Preço do peito de frango";
const description =
  "Monitoramento semanal e auditável do preço do quilo do peito de frango em supermercados brasileiros, com fotos verificadas (EXIF + SHA-256) e comparativo de poder de compra.";

// A imagem da prévia vem de app/opengraph-image.tsx; na Vercel, o Next monta a URL
// absoluta com o domínio de produção (VERCEL_PROJECT_PRODUCTION_URL).
export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: "Frangômetro", locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
