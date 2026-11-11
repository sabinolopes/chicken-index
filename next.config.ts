import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // A imagem da prévia do link lê as fontes do disco: garante que elas vão junto na função da Vercel.
  outputFileTracingIncludes: { "/opengraph-image": ["./assets/fonts/**"] },
  // Só o /widget pode aparecer dentro de outro site (iframe dos parceiros). O resto, admin
  // inclusive, recusa ser emoldurado: impede páginas falsas com o login do Frangômetro dentro.
  async headers() {
    return [
      { source: "/((?!widget$).*)", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }] },
      { source: "/widget", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
