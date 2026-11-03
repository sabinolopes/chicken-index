import { ImageResponse } from "next/og";

// Ícone quando alguém salva o site na tela inicial do iPhone (PNG 180×180, mesmo desenho do icon.svg).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#b42318" }}>
        <svg width="120" height="120" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23" fill="#fff" />
          <path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59" fill="none" />
        </svg>
      </div>
    ),
    size,
  );
}
