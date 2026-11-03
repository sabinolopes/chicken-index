import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
      // "server-only" só existe para o bundler do Next barrar import no cliente; nos testes é um módulo vazio.
      "server-only": path.join(import.meta.dirname, "test/server-only.ts"),
    },
  },
  test: {
    // Node por padrão; testes de componente pedem o navegador simulado com `// @vitest-environment jsdom`.
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    setupFiles: ["test/setup.ts"],
  },
});
