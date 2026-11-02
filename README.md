# Índice do Peito de Frango

Monitoramento semanal e auditável do preço do quilo do peito de frango em supermercados brasileiros. Cada preço tem a foto da etiqueta, com auditoria de metadados EXIF e hash SHA-256 do arquivo original, e o dashboard compara o preço com o poder de compra do salário mínimo e do salário médio.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Recharts · Supabase (Postgres, Auth, Storage) · exifr

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem variáveis do Supabase, o site roda em **Modo Demo** com 8 semanas de dados fictícios — dashboard e admin (`/admin`) funcionam, mas nada é gravado.

## Ligando o Supabase

1. Crie um projeto no Supabase e rode [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor (tabelas, RLS e bucket `price-photos`).
2. Em **Authentication → Users**, crie o usuário admin e marque-o como admin no SQL Editor:
   ```sql
   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'seu@email.com';
   ```
   Só usuários com `app_metadata.role = 'admin'` podem escrever (RLS) e entrar no painel.
3. Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up** (camada extra; as políticas já bloqueiam não-admins).
4. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Estrutura

| Caminho | O quê |
|---|---|
| `app/page.tsx` | Dashboard público (cacheado 1h, invalidado quando o admin cadastra) |
| `app/admin/` | Login, painel e formulário mobile de cadastro (`/admin/novo`) |
| `app/admin/actions.ts` | Server Actions: login, cadastro, exclusão, salários |
| `lib/data.ts` | Leitura pública com `'use cache'` + fallback para dados mock |
| `lib/upload/process-photo.ts` | Pipeline no navegador: SHA-256 → EXIF → compressão .webp |
| `proxy.ts` | Renovação de sessão e proteção de `/admin` |
| `supabase/schema.sql` | Schema completo do banco |

## Auditoria das fotos

O hash SHA-256 é calculado no navegador sobre o arquivo **original**, antes da compressão. Quem tiver a foto original pode conferir com `sha256sum foto.jpg`. A foto publicada é recomprimida para .webp (máx. 1200px) e não carrega metadados — inclusive a localização GPS do celular.
