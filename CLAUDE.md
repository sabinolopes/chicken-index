# Projeto: Índice do Peito de Frango (Monitoramento de Inflação)

Sistema web público e auditável para monitoramento semanal do preço do quilo do peito de frango em supermercados brasileiros, com foco em comprovação visual (fotos com auditoria de metadados EXIF e hash SHA-256) e comparativo de poder de compra salarial.

## 1. Stack Tecnológica (100% Free-Tier Friendly)
- **Framework:** Next.js (App Router) com TypeScript
- **Estilização:** Tailwind CSS + Lucide React (ícones)
- **Gráficos:** Recharts (responsivo)
- **Backend / DB / Auth / Storage:** Supabase (`@supabase/supabase-js` e `@supabase/ssr`)
- **Processamento Client-Side no Upload:**
  - `exifr`: Extração de metadados da câmera no navegador.
  - Web Crypto API nativa (`crypto.subtle.digest`): Geração de hash SHA-256 do arquivo bruto original.
  - Canvas API / `browser-image-compression`: Conversão e compressão da foto para `.webp` (máx 1200px, ~150KB) ANTES do upload para economizar Supabase Storage e banda.

## 2. Regras Críticas de Escalabilidade (Proteção contra Tráfego Viral)
1. **Cache Estático na Home (ISR / On-Demand Revalidation):**
   - A página pública (`app/page.tsx`) NÃO deve fazer queries dinâmicas a cada acesso de visitante.
   - Usar `export const revalidate = 3600;` (cache de 1 hora no CDN da Vercel) e acionar `revalidatePath('/')` via Server Action apenas quando um admin cadastrar um novo preço.
2. **Bypass do Limite de Imagens da Vercel:**
   - Como as imagens já são convertidas para `.webp` leve no momento do upload pelo celular, use `<Image unoptimized />` do Next.js ou `<img>` com `loading="lazy"` e `decoding="async"`. Isso evita estourar a cota de 1.000 otimizações/mês do plano gratuito da Vercel em caso de viralização.
3. **Paginação na Galeria:**
   - Carregar inicialmente apenas os 12 registros mais recentes na galeria de fotos, com botão "Carregar mais".

## 3. Fluxo de Auditoria Antifraude (Upload Mobile)
Quando o admin seleciona uma foto no formulário (`/admin/novo`):
1. O navegador lê o arquivo original intacto.
2. Calcula o hash `SHA-256` do arquivo original.
3. Extrai via `exifr`: `DateTimeOriginal`, `Make` (fabricante) e `Model` (modelo do aparelho).
4. Se não houver EXIF (ex: foto repassada por WhatsApp), exibe um alerta visual avisando o admin que a foto perdeu os metadados originais, mas permite o envio marcando `has_valid_exif = false`.
5. Somente após extrair o EXIF e o Hash, comprime a imagem para `.webp` e envia para o bucket `price-photos` do Supabase.

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