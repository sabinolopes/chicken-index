# Projeto: Frangômetro, o índice do peito de frango (Monitoramento de Inflação)

No ar em https://frangometro.vercel.app (projeto `frangometro` na Vercel, funções em São Paulo/gru1).

Sistema web público e auditável para monitoramento semanal do preço do quilo do peito de frango em supermercados brasileiros, com foco em comprovação visual (fotos com auditoria de metadados EXIF e hash SHA-256) e comparativo de poder de compra salarial.

## 1. Stack Tecnológica (100% Free-Tier Friendly)
- **Framework:** Next.js (App Router) com TypeScript
- **Estilização:** Tailwind CSS + Lucide React (ícones)
- **Gráficos:** Recharts (responsivo)
- **Backend / DB / Auth:** Supabase (`@supabase/supabase-js` e `@supabase/ssr`)
- **Armazenamento das fotos:** Cloudflare R2 (API compatível com S3, via `aws4fetch` em `modules/photos/storage.ts`, só no servidor) — 10 GB grátis e sem custo de tráfego de saída, para a galeria aguentar picos de acesso.
- **Processamento Client-Side no Upload:**
  - `exifr`: Extração de metadados da câmera no navegador.
  - Web Crypto API nativa (`crypto.subtle.digest`): Geração de hash SHA-256 do arquivo bruto original.
  - Canvas API (`modules/photos/process-photo.ts`, sem biblioteca extra): Conversão e compressão da foto para `.webp` (máx 1200px, ~150KB, JPEG como alternativa) ANTES do upload para economizar armazenamento e banda.

## 2. Regras Críticas de Escalabilidade (Proteção contra Tráfego Viral)
1. **Cache Estático na Home (ISR / On-Demand Revalidation):**
   - A página pública (`app/page.tsx`) NÃO deve fazer queries dinâmicas a cada acesso de visitante.
   - Cache de 1 hora: o projeto usa `cacheComponents` (Next 16), então é `'use cache'` + `cacheLife` + `cacheTag` em `modules/dashboard/queries.ts` — `export const revalidate` é incompatível e quebra o build. As Server Actions do admin chamam `refreshDashboard()` (`modules/dashboard/cache.ts`: `updateTag` + `revalidatePath('/')`) ao cadastrar, excluir ou alterar salários.
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
- `brand`: text, 2 a 40 caracteres (Sadia, Seara, Perdigão, Pif Paf ou o nome digitado em "Outra": Oi Frango, Ki Frango...; registros antigos podem ter "Outra"). No gráfico, só as quatro principais (`MAIN_BRANDS`) têm linha própria; as demais somam em "Outras marcas" (`brandGroup` em `modules/prices/types.ts`).
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
     - **Método do índice (`sameProductIndex` em `modules/dashboard/stats.ts`):** o preço médio e o gráfico mostram a média do que foi coletado, mas as variações e o termômetro seguem um índice encadeado de **mesmos produtos** (mercado + cidade/UF + marca + resfriado/congelado), como o IPCA: cada produto é comparado com o próprio último preço e a semana usa a média geométrica dessas variações. Assim, coletar um mercado mais caro ou mais barato não mexe no índice. Sem produto repetido, a variação semanal fica vazia (não 0%).
   - **Filtros Rápidos:** Por Estado/Cidade, Mercado e Marca.
   - **Gráfico de Evolução (Recharts):** Linha do tempo semanal mostrando a evolução do preço médio e linhas comparativas por marca.
   - **Galeria de Prova Real:** Grid de cards com a foto da etiqueta, preço/kg em destaque, mercado, cidade, data e badge "Foto Auditada (EXIF + SHA256)". Ao clicar, abre um Modal com Lupa/Zoom na etiqueta e os dados técnicos da câmera.
   - **Card Compartilhável:** Botão "Gerar Resumo para Redes" que formata um card limpo pronto para print ou download para WhatsApp/Instagram.
   - **Frangômetro vs. inflação oficial:** painel com o IPCA do IBGE (índice geral, Alimentação e bebidas e o subitem Frango em pedaços, tabela 7060 do SIDRA), buscado sozinho e em cache por um dia (`modules/inflation`). Compara os meses em comum desde a 1ª coleta; enquanto o IBGE não publica o 1º mês, mostra o acumulado em 12 meses como referência. IBGE fora do ar → painel diz que está indisponível (falha fica em cache só por minutos).
   - **Prévia do link (`app/opengraph-image.tsx`):** imagem 1200×630 gerada com os mesmos dados em cache (preço médio, variação, salário mínimo), que aparece ao colar o link no WhatsApp e nas redes. Fontes Geist em `assets/fonts/`.
3. **Como medimos (`/como-medimos`):** metodologia em linguagem simples (coleta, auditoria EXIF/SHA-256, o que entra no índice, cálculo de mesmos produtos, termômetro e comparação com o IPCA). Ao mudar uma regra do índice, atualize esta página.
4. **Área Admin (`/admin` e `/admin/login`):**
   - Login simples com Supabase Auth.
   - Formulário Mobile-First focado em rapidez no mercado: selecionar foto, pré-preenchimento automático da data via EXIF, input de preço por kg, seletor de marca, mercado e cidade.
   - Admins entram só por convite por e-mail (página **Admins**, `/admin/usuarios`); o link leva a `/auth/definir-senha`.

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
- **Interface não busca dados:** componentes não chamam Supabase nem `fetch`; usam `queries.ts` (leitura) e `actions.ts` (escrita) do módulo do domínio (ver seção 7).
- **Validação sempre no servidor** (`modules/prices/validation.ts`), mesmo que o cliente já valide. Nunca confie em ID ou role vindos do cliente: a role de admin vem do `app_metadata` (definido só pelo servidor) e as escritas passam por `requireAdmin()` + RLS.
- **Falhe de forma segura:** erro de configuração ou de integração bloqueia o fluxo com mensagem clara; nunca há modo mock/demo nem fallback que finja sucesso.
- **Nada sensível em logs ou respostas:** sem chaves, tokens ou dados pessoais em mensagens de erro.

### Testes (Vitest, `*.test.ts` ao lado do código)
- **Zero testes falsos:** todo teste exercita regra de negócio real com asserções significativas (nada de `expect(true).toBe(true)` ou teste que só instancia).
- **Bug corrigido = teste que reproduz o bug primeiro**, depois a correção.
- Antes de concluir, rode `npm run check` (tipos + lint sem avisos + testes). O hook de pré-commit (`.husky/pre-commit`) roda o mesmo e bloqueia o commit se algo falhar.

## 7. Organização por Domínio (`modules/`)

O código de negócio fica em `modules/<domínio>/`, cada um com os mesmos papéis de arquivo. Inspirado no padrão de módulos do Gotenks (rotas finas + camada de serviço + camada de dados):

| Arquivo | Papel | Regra |
|---|---|---|
| `types.ts` | Tipos e constantes do domínio | Sem dependência de infraestrutura |
| `validation.ts` | Leitura e validação da entrada (FormData) | Função pura, testada |
| `repository.ts` | Acesso ao banco (Supabase) atrás de uma interface | Só traduz dados e lança `Error`; nada de regra de negócio |
| `service.ts` | Regras de negócio | Recebe repositórios/armazenamentos por parâmetro (objeto desestruturado), devolve `ActionResult`; testado com implementações em memória |
| `queries.ts` | Leituras para as páginas | Sem regras; monta o cliente certo (público com cache ou sessão do admin) |
| `actions.ts` | Server Actions (`"use server"`) | Camada fina: `requireAdmin()` → validação → serviço → invalidação de cache. Sem regra de negócio |

Domínios: `auth` (sessão e role), `prices` (cadastro e exclusão), `settings` (salários), `admins` (convite e remoção), `photos` (chaves, R2 e pipeline do navegador), `dashboard` (consulta pública com cache, invalidação, estatísticas e prévia do link), `inflation` (IPCA do IBGE e comparação com o índice).

- **Dependências apontam para dentro:** `actions` → `service` → interfaces (`PricesRepository`, `PhotoStorage`, `AdminDirectory`). O serviço importa só tipos dessas interfaces; a implementação real é escolhida na action.
- **`lib/`** guarda apenas o que é genérico e sem domínio: `format.ts`, `parse.ts`, `action-result.ts` e os clientes em `lib/supabase/`.
- **`components/`** só renderiza: recebe dados por props e chama as `actions` do módulo (ver seção 8).
- **Novo domínio ou nova regra:** crie o `service.ts` com teste antes de ligar a action; se a função de serviço precisar de mais de 3 dependências, receba um objeto.

## 8. Componentes em Atomic Design (`components/`)

Inspirado na hierarquia `elements → blocks → pages` do Gotenks:

| Camada | Pasta | O que é | Pode importar |
|---|---|---|---|
| **Elements** (átomos) | `components/elements/<nome>.tsx` | Peças genéricas, sem domínio: `Button`/`IconButton`, `Alert`/`ActionMessage`, `Badge`, `Field`/`TextInput`/`Select`, `MoneyInput`, `ChoiceGroup`, `Panel`/`PanelHeader`, `FormSection`, `Modal`, `CopyButton`, `Skeleton` | Só `lib/` |
| **Blocks** (moléculas) | `components/blocks/<nome>/` | Uma funcionalidade do domínio (galeria, gráfico, formulário de cadastro…) | Elements, outros blocks, `modules/*` (`actions`, `types`, funções puras) |
| **Pages** (organismos) | `components/pages/<nome>/` | Composição de uma tela inteira com o estado que liga os blocks | Elements, blocks, `modules/*` |

As rotas em `app/` só buscam dados (`queries`) e montam uma page ou blocks; não têm marcação de UI própria além de layout.

**Estrutura de um block** (cada um numa pasta, mesmo que tenha um arquivo só):
```
components/blocks/new-price-form/
  index.ts                 <- só reexporta o que o resto do app usa
  new-price-form.tsx       <- composição (pouca lógica)
  use-new-price-form.ts    <- estado e ações (hook), quando há estado não trivial
  photo-step.tsx ...       <- subcomponentes do próprio block
  form-rules.ts            <- regras puras (sem React), sempre com form-rules.test.ts
```

Regras:
- **Antes de escrever classe Tailwind repetida, procure o element.** Botão, mensagem, selo, campo, grupo de escolha, painel e modal já existem; se um padrão visual aparecer em 2+ blocks, vire element.
- **Lógica fora do JSX:** cálculo, formatação de texto e regra de negócio de tela vão para `*.ts` puro com teste (ex.: `chart-data.ts`, `filter-options.ts`, `share-text.ts`, `zoom.ts`). Estado com várias ações vai para um hook `use-*.ts`.
- **Comunicação filho → pai só por props de callback** (`onChange`, `onSelect`, `onClose`). Filho nunca chama método do pai nem lê estado de irmão.
- **Importe pelo `index.ts` do block** (`@/components/blocks/gallery`), não pelos arquivos internos — exceto nos testes do próprio block.
- **Textos de interface ficam no próprio componente**, em pt-BR (o site é só para o Brasil). Se um dia houver outro idioma, extraia para `texts.ts` planos por block.
- **Testes de componente** usam Testing Library no jsdom (`// @vitest-environment jsdom` no topo): testam o que o usuário vê e faz (papel acessível, clique, digitação), nunca detalhes internos.

## 9. Backup

- `.github/workflows/backup.yml` roda toda segunda às 03:00 (Brasília) e sob demanda: `pg_dump` do schema `public` (Postgres 17, formato custom) para o bucket **privado** `frangometro-backups` do R2, em `db/AAAA-MM-DD.dump`. Falha se o dump vier sem `chicken_prices`.
- Segredos do GitHub Actions (cadastrados pelo dono do repositório, nunca no código nem no chat): `SUPABASE_DB_URL` (Session pooler, porta 5432), `R2_ACCOUNT_ID`, `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY` (token R2 só com acesso a esse bucket).
- Restaurar: baixe o `.dump` do R2 e rode `pg_restore --no-owner --no-privileges --clean --if-exists -d "<url do banco>" arquivo.dump`. Admins (schema `auth`) não entram no backup: convide de novo.
