import { afterEach } from "vitest";

// Desmonta o que cada teste de componente renderizou, para um teste não enxergar a tela do outro.
afterEach(async () => {
  if (typeof document === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});
