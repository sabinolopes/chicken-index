import type { Metadata } from "next";
import { Methodology } from "@/components/pages/methodology";

export const metadata: Metadata = {
  title: "Como medimos · Frangômetro",
  description: "Como o Frangômetro coleta, audita (EXIF + SHA-256) e calcula a variação do preço do peito de frango.",
};

export default function MethodologyPage() {
  return <Methodology />;
}
