import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";

// Padrões de legibilidade do projeto (ver "Padrões de código" no CLAUDE.md).
const codeStandards = {
  plugins: { sonarjs, unicorn },
  rules: {
    // Return early: nada de else depois de return nem if sozinho dentro de else.
    "no-else-return": ["error", { allowElseIf: false }],
    "no-lonely-if": "error",
    // Sem pirâmide de ifs e funções curtas de entender.
    "max-depth": ["error", 2],
    "sonarjs/cognitive-complexity": ["error", 12],
    "sonarjs/no-nested-conditional": "error",
    // Mais de 3 parâmetros: receba um objeto desestruturado.
    "max-params": ["error", 3],
    // Sem subir pastas: use o alias @/.
    "no-restricted-imports": ["error", { patterns: [{ group: ["../*"], message: "Use o alias @/ em vez de ../" }] }],
    // Nomes completos: event e não e, response e não res, element e não el.
    "unicorn/prevent-abbreviations": [
      "error",
      {
        checkFilenames: false,
        checkProperties: false,
        allowList: { props: true, Props: true, params: true, searchParams: true },
        // Ref é a convenção do React (useRef): cameraRef, canvasRef.
        replacements: { ref: false, refs: false },
      },
    ],
    // Nada de variáveis de uma letra (p, d, a); o unicorn não cobre esses casos.
    "id-length": ["error", { min: 2, properties: "never", exceptions: ["_"] }],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  codeStandards,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
