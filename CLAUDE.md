# Projeto: Frangômetro, o índice do peito de frango (Monitoramento de Inflação)

No ar em https://frangometro.vercel.app (projeto `frangometro` na Vercel, funções em São Paulo/gru1).

Sistema web público e auditável para monitoramento semanal do preço do quilo do peito de frango em supermercados brasileiros, com foco em comprovação visual (fotos com auditoria de metadados EXIF e hash SHA-256) e comparativo de poder de compra salarial.

## 1. Stack Tecnológica (100% Free-Tier Friendly)
- **Framework:** Next.js (App Router) com TypeScript
- **Estilização:** Tailwind CSS + Lucide React (ícones)
- **Gráficos:** Recharts (responsivo)
- **Backend / DB / Auth:** Supabase (`@supabase/supabase-js` e `@supabase/ssr`)
- **Armazenamento das fotos:** Cloudflare R2 (API compatível com S3, via `aws4fetch` em `lib/r2.ts`, só no servidor) — 10 GB grátis e sem custo de tráfego de saída, para a galeria aguentar picos de acesso.
- **Processamento Client-Side no Upload:**
  - `exifr`: Extração de metadados da câmera no navegador.
  - Web Crypto API nativa (`crypto.subtle.digest`): Geração de hash SHA-256 do arquivo bruto original.
  - Canvas API / `browser-image-compression`: Conversão e compressão da foto para `.webp` (máx 1200px, ~150KB) ANTES do upload para economizar armazenamento e banda.

## 2. Regras Críticas de Escalabilidade (Proteção contra Tráfego Viral)
1. **Cache Estático na Home (ISR / On-Demand Revalidation):**
   - A página pública (`app/page.tsx`) NÃO deve fazer queries dinâmicas a cada acesso de visitante.
   - Cache de 1 hora: o projeto usa `cacheComponents` (Next 16), então é `'use cache'` + `cacheLife` + `cacheTag` em `lib/data.ts` — `export const revalidate` é incompatível e quebra o build. As Server Actions do admin chamam `updateTag` e `revalidatePath('/')` ao cadastrar, excluir ou alterar salários.
2. **Bypass do Limite de Imagens da Vercel:**
   - Como as imagens já são convertidas para `.webp` leve no momento do upload pelo celular e servidas direto da URL pública do R2, use `<Image unoptimized />` do Next.js ou `<img>` com `loading="lazy"` e `decoding="async"`. Isso evita estourar a cota de 1.000 otimizações/mês do plano gratuito da Vercel em caso de viralização.
3. **Paginação na Galeria:**
   - Carregar inicialmente apenas os 12 registros mais recentes na galeria de fotos, com botão "Carregar mais".

## 3. Fluxo de Auditoria Antifraude (Upload Mobile)
Quando o admin seleciona uma foto no formulário (`/admin/novo`):
1. O navegador lê o arquivo original intacto.
2. Calcula o hash `SHA-256` do arquivo original.
3. Extrai via `exifr`: `DateTimeOriginal`, `Make` (fabricante) e `Model` (modelo do aparelho).
4. Se não houver EXIF (ex: foto repassada por WhatsApp), exibe um alerta visual avisando o admin que a foto perdeu os metadados originais, mas permite o envio marcando `has_valid_exif = false`.
5. Somente após extrair o EXIF e o Hash, comprime a imagem para `.webp` e envia pela Server Action `createPrice`, que confere se é admin e se o hash já existe, grava no Cloudflare R2 como `AAAA-MM/<sha256>.webp` e salva a URL pública (`R2_PUBLIC_URL`) em `photo_url`.
6. Sem as variáveis do R2 configuradas, o upload falha com erro claro — nunca há modo mock/demo (dados falsos não cabem num site antifraude).

## 4. Modelagem do Banco de Dados (Supabase SQL)

### Tabela `chicken_prices`
- `id`: uuid PK
- `brand`: text (Ex: Sadia, Seara, Perdigão, Outra)
- `state_type`: text ('resfriado' | 'congelado')
- `price_per_kg`: numeric(10,2) NOT NULL (Sempre o valor do KG na etiqueta)
- `market_name`: text NOT NULL
- `city`: text NOT NULL
- `state`: varchar(2) NOT NULL
- `recorded_at`: date NOT NULL
- `photo_url`: text NOT NULL
- `original_sha256`: text NOT NULL
- `exif_device`: text (Ex: "Apple iPhone 13" ou "Samsung SM-A546E")
- `exif_datetime`: timestamp with time zone
- `has_valid_exif`: boolean DEFAULT false
- `created_at`: timestamp with time zone DEFAULT now()

### Tabela `economic_settings`
- `id`: int PK DEFAULT 1
- `min_wage`: numeric(10,2) NOT NULL DEFAULT 1518.00
- `avg_wage`: numeric(10,2) NOT NULL DEFAULT 3225.00
- `updated_at`: timestamp with time zone DEFAULT now()

## 5. Estrutura de Telas
1. **Dashboard Público (`/`):**
   - **Header & Poder de Compra:** Cards destacando o Preço Médio Atual do Kg, Variação Acumulada (%) desde a 1ª semana, e o "Termômetro Salarial": Quantos Kg de peito de frango 1 Salário Mínimo e 1 Salário Médio compravam no início do projeto vs. hoje.
   - **Filtros Rápidos:** Por Estado/Cidade, Mercado e Marca.
   - **Gráfico de Evolução (Recharts):** Linha do tempo semanal mostrando a evolução do preço médio e linhas comparativas por marca.
   - **Galeria de Prova Real:** Grid de cards com a foto da etiqueta, preço/kg em destaque, mercado, cidade, data e badge "Foto Auditada (EXIF + SHA256)". Ao clicar, abre um Modal com Lupa/Zoom na etiqueta e os dados técnicos da câmera.
   - **Card Compartilhável:** Botão "Gerar Resumo para Redes" que formata um card limpo pronto para print ou download para WhatsApp/Instagram.
2. **Área Admin (`/admin` e `/admin/login`):**
   - Login simples com Supabase Auth.
   - Formulário Mobile-First focado em rapidez no mercado: selecionar foto, pré-preenchimento automático da data via EXIF, input de preço por kg, seletor de marca, mercado e cidade.
## 6. Padrões de Código (inspirados no guia Gotenks)

> "A máquina compila qualquer código que funcione; humanos precisam entender esse código para dar manutenção."

Toda entrega tem duas etapas: **(1) faça funcionar, com testes reais e segurança desde a primeira linha; (2) refatore para a menor complexidade possível.** Não deixe qualidade nem segurança para depois.

### Regras que o lint garante (`eslint.config.mjs`, zero avisos)
- **Return early:** validações negativas no topo, caminho feliz sem indentação. Proibido `else` depois de `return` (`no-else-return`), `if` sozinho dentro de `else` (`no-lonely-if`) e mais de 2 níveis de bloco (`max-depth`).
- **Sem ternário dentro de ternário** (`sonarjs/no-nested-conditional`): use uma função com guard clauses ou um mapa (`Record<Tipo, valor>`).
- **Complexidade cognitiva máxima 12** por função (`sonarjs/cognitive-complexity`): passou disso, fatie em funções com nome descritivo.
- **Máximo de 3 parâmetros** (`max-params`); acima disso, um objeto desestruturado.
- **Sem abreviações** (`unicorn/prevent-abbreviations` + `id-length`): `event` e não `e`, `error` e não `err`, `response`/`result` e não `res`, `price` e não `p`, `context` e não `ctx`. Exceções: termos do domínio (`uf`, `kg`) e `ref` do React (`cameraRef`).
- **Sem `../`**: importe pelo alias `@/` (`no-restricted-imports`). `./` só para arquivos da mesma pasta.

### Regras de convenção (revisão humana)
- **Comentários em pt-BR**, explicando o porquê, não o quê.
- **Operadores nullish:** `?.` e `??` quando `0`, `false` ou `""` são valores válidos; `||` quando qualquer valor falsy deve cair no padrão.
- **Interface não busca dados:** componentes não chamam Supabase nem `fetch`. Leitura em `lib/data.ts` / `lib/admin-data.ts`, escrita em Server Actions (`app/admin/actions.ts`), infraestrutura em `lib/supabase/*` e `lib/r2.ts`.
- **Validação sempre no servidor** (`lib/validation.ts`), mesmo que o cliente já valide. Nunca confie em ID ou role vindos do cliente: a role de admin vem do `app_metadata` (definido só pelo servidor) e as escritas passam por `requireAdmin()` + RLS.
- **Falhe de forma segura:** erro de configuração ou de integração bloqueia o fluxo com mensagem clara; nunca há modo mock/demo nem fallback que finja sucesso.
- **Nada sensível em logs ou respostas:** sem chaves, tokens ou dados pessoais em mensagens de erro.

### Testes (Vitest, `*.test.ts` ao lado do código)
- **Zero testes falsos:** todo teste exercita regra de negócio real com asserções significativas (nada de `expect(true).toBe(true)` ou teste que só instancia).
- **Bug corrigido = teste que reproduz o bug primeiro**, depois a correção.
- Antes de concluir, rode `npm run check` (tipos + lint sem avisos + testes). O hook de pré-commit (`.husky/pre-commit`) roda o mesmo e bloqueia o commit se algo falhar.
