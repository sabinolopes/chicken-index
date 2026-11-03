# Frangômetro

No ar em **https://frangometro.vercel.app**.

Monitoramento semanal e auditável do preço do quilo do peito de frango em supermercados brasileiros. Cada preço tem a foto da etiqueta, com auditoria de metadados EXIF e hash SHA-256 do arquivo original, e o dashboard compara o preço com o poder de compra do salário mínimo e do salário médio.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Recharts · Supabase (Postgres, Auth) · Cloudflare R2 (fotos) · exifr

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # e preencha as variáveis
npm run dev
```

Abra http://localhost:3000. Sem as variáveis do Supabase o site não sobe, e sem as do R2 o cadastro de fotos falha — nos dois casos com um erro dizendo o que falta.

## Configurando o Supabase (uma vez)

1. Crie um projeto no Supabase e rode [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor (tabelas e RLS).
2. **Primeiro admin:** em **Authentication → Users → Add user**, crie o usuário e marque-o como admin no SQL Editor:
   ```sql
   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'seu@email.com';
   ```
   Só usuários com `app_metadata.role = 'admin'` escrevem no banco (RLS) e entram no painel. Os próximos admins são convidados pelo próprio painel (abaixo).
3. Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up** (camada extra; as políticas já bloqueiam não-admins).
4. Em **Authentication → URL Configuration**:
   - **Site URL:** o domínio de produção (ex.: `https://seu-projeto.vercel.app`);
   - **Redirect URLs:** `https://seu-projeto.vercel.app/**` e `http://localhost:3000/**`.

   Sem isso, o link do e-mail de convite aponta para o lugar errado.

## Configurando o Cloudflare R2 (uma vez)

As fotos ficam no R2 porque ele não cobra o tráfego de saída: uma galeria viral não derruba nem encarece nada.

1. No painel da Cloudflare, **R2 Object Storage → Create bucket** com o nome `chicken-index-photos` (o R2 pede um cartão cadastrado, mesmo no plano gratuito).
2. No bucket, **Settings → Public access**:
   - **Sem domínio próprio:** ative o **R2.dev subdomain** e use a URL `https://pub-….r2.dev` como `R2_PUBLIC_URL`. A Cloudflare limita esse endereço e o recomenda só para desenvolvimento.
   - **Com domínio no Cloudflare:** em **Custom Domains**, conecte algo como `fotos.seudominio.com.br` e use-o como `R2_PUBLIC_URL` (com cache da Cloudflare, sem limite).
3. Em **R2 → Manage API tokens → Create API token**: permissão **Object Read & Write**, restrita ao bucket. Copie o *Access Key ID* e o *Secret Access Key* (o segredo só aparece uma vez). O *Account ID* aparece na página inicial do R2.

**Trocar de `r2.dev` para um domínio depois:** mude `R2_PUBLIC_URL` na Vercel e atualize as URLs já salvas no SQL Editor do Supabase:

```sql
update public.chicken_prices set photo_url = replace(photo_url, 'https://pub-xxxx.r2.dev', 'https://fotos.seudominio.com.br');
```

## Variáveis de ambiente

| Variável | Onde | Para quê |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | chave publicável (`sb_publishable_…`); a segurança vem do RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **secreta, só servidor** | chave secreta (`sb_secret_…`), usada apenas para convidar/remover admins |
| `R2_ACCOUNT_ID` | só servidor | ID da conta Cloudflare |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | **secretas, só servidor** | token do R2 com escrita no bucket |
| `R2_BUCKET_NAME` | só servidor | `chicken-index-photos` |
| `R2_PUBLIC_URL` | só servidor | URL pública do bucket, sem barra no fim (vai gravada em `photo_url`) |

## Admins

No painel, **Admins** (`/admin/usuarios`): informe o e-mail e clique em **Enviar convite**. A pessoa recebe um e-mail do Supabase, abre o link, define a senha em `/auth/definir-senha` e cai direto no painel. Na mesma página dá para cancelar convites pendentes e remover admins (a conta é apagada; uma sessão já aberta vale até 1 hora).

O e-mail padrão do Supabase no plano gratuito tem limite baixo de envios por hora — suficiente para convidar admins. Para volumes maiores, configure um SMTP próprio em **Authentication → Emails**.

## Deploy (Vercel)

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório do GitHub (framework detectado: Next.js).
2. Em **Environment Variables**, cadastre as 8 variáveis acima e clique em **Deploy**.
3. Ajuste a **Site URL** e as **Redirect URLs** do Supabase com o domínio gerado (passo 4 acima).

Cada `git push` na `main` gera um novo deploy. A home fica em cache por 1 hora e é atualizada na hora quando um admin cadastra, exclui ou altera salários.

## Estrutura

| Caminho | O quê |
|---|---|
| `app/page.tsx` | Dashboard público (cacheado 1h, invalidado quando o admin cadastra) |
| `app/admin/` | Login, painel e formulário mobile de cadastro (`/admin/novo`) |
| `app/admin/actions.ts` | Server Actions: login, cadastro, exclusão, salários, convite e remoção de admins |
| `app/auth/definir-senha/` | Página do link de convite: valida o token e define a senha |
| `lib/data.ts` | Leitura pública com `'use cache'` (1 hora) |
| `lib/upload/process-photo.ts` | Pipeline no navegador: SHA-256 → EXIF → compressão .webp |
| `lib/r2.ts` | Upload e exclusão das fotos no Cloudflare R2 (só servidor) |
| `proxy.ts` | Renovação de sessão e proteção de `/admin` |
| `supabase/schema.sql` | Schema completo do banco |

## Auditoria das fotos

O hash SHA-256 é calculado no navegador sobre o arquivo **original**, antes da compressão. Quem tiver a foto original pode conferir com `sha256sum foto.jpg`. A foto publicada é recomprimida para .webp (máx. 1200px) e não carrega metadados — inclusive a localização GPS do celular.
