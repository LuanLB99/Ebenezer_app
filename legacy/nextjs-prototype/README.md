# App IP Ebenézer Taubaté

Web app responsivo (desktop-first, funciona também no navegador do celular) para gestão da igreja. Ver `spec-tecnica.md` na pasta do projeto para o desenho completo (banco de dados, fluxos, permissões).

## Stack

- **Next.js 14 (App Router) + TypeScript** — frontend
- **TailwindCSS** — estilo, com os tokens da identidade visual em `tailwind.config.ts`
- **Supabase** — Postgres + Auth + Storage + Row Level Security
- **TanStack Query** — cache/sync de dados no cliente
- **Zustand** — pronto para uso quando surgir estado global (ainda não usado nas telas atuais)

> Nota de arquitetura: optamos por uma web app responsiva em vez de um app nativo React Native/Expo (a recomendação original do spec). O banco de dados e as regras de negócio são exatamente as mesmas — só a camada de apresentação mudou. Se no futuro a notificação push nativa virar essencial, dá para embrulhar esta mesma aplicação com [Capacitor](https://capacitorjs.com/) e publicar nas lojas sem reescrever o código.

## Estrutura de pastas

```
app/
  (auth)/login/          - tela de login (sem cadastro público)
  (dashboard)/           - área autenticada, protegida pelo middleware.ts
    layout.tsx            - shell responsivo (sidebar desktop / tabs mobile)
    page.tsx               - Home
    membros/                - módulo de referência: CRUD completo
    ebd/                    - Escola Dominical (stub — seguir padrão de /membros)
    agenda/                 - Calendário + Boletim
    cultos/                 - Cultos + Escala de Louvor (núcleo do app)
    repertorio/             - Repertório musical (stub — seguir padrão de /membros)
    perfil/                 - Dados do usuário logado + logout
components/
  layout/                 - Sidebar, BottomTabs, Topbar
  ui/                     - Button, Card, Input, Badge (design system mínimo)
lib/
  supabase/               - clientes Supabase (browser e server)
  types.ts                - tipos das tabelas (trocar por `supabase gen types` depois)
supabase/
  migrations/
    0001_init.sql          - schema completo + RLS (traduzido do spec-tecnica.md)
    0002_storage.sql        - buckets de storage (fotos, boletim, letras/cifras, áudio)
```

O módulo **Membros** (`app/(dashboard)/membros/`) foi implementado por completo — listagem, criação e detalhe — e serve de padrão de referência para os módulos ainda em stub (EBD, Repertório, criação de Cultos/Escalas). Copie a estrutura dele ao evoluir os demais.

## Como rodar localmente

1. **Criar o projeto no Supabase**: acesse [supabase.com](https://supabase.com), crie um novo projeto (plano free) e guarde a `Project URL` e a `anon public key` (em Project Settings → API).

2. **Rodar as migrations**: no SQL Editor do painel do Supabase, cole e execute, nesta ordem, o conteúdo de `supabase/migrations/0001_init.sql` e depois `0002_storage.sql`.
   - Alternativa via CLI: `npx supabase login`, `npx supabase link --project-ref <seu-projeto>`, `npx supabase db push`.

3. **Variáveis de ambiente**: copie `.env.local.example` para `.env.local` e preencha com os dados do passo 1.
   ```
   cp .env.local.example .env.local
   ```

4. **Instalar dependências e subir o servidor**:
   ```
   npm install
   npm run dev
   ```
   Acesse http://localhost:3000 — vai te redirecionar para `/login`.

5. **Criar o primeiro usuário (pastor/líder)**: como não há cadastro público, crie manualmente no Supabase:
   - Authentication → Users → Add user (defina e-mail e senha).
   - Table Editor → `members` → insira uma linha com `auth_user_id` = o UUID do usuário criado acima, `role = 'pastor'`.
   - Agora esse e-mail/senha loga no app com permissão total.

## Deploy

O caminho mais simples é [Vercel](https://vercel.com) (plano free): conecte o repositório Git, configure as duas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) no painel do projeto, e cada `git push` gera um deploy automático.

## PWA (ícone na tela de início)

O `public/manifest.json` e os ícones (`icon-192.png`, `icon-512.png`, gerados a partir do logo oficial) já deixam o app "instalável" — no Android/Chrome e no desktop, o usuário pode adicionar à tela inicial e abrir como se fosse um app nativo, sem precisar de loja. No iPhone (Safari) o suporte é mais limitado, principalmente para notificação push (ver nota de arquitetura acima).

## Próximos passos sugeridos

1. Implementar criação de Culto + Escala de Louvor (o fluxo core descrito na seção 4 do spec-tecnica.md), seguindo o padrão de `membros/novo`.
2. Implementar upload de letra/cifra/áudio para Repertório via Supabase Storage (`storage.from('song-sheets').upload(...)`).
3. Implementar chamada digital da EBD (tela de marcar presença por classe/data).
4. Configurar notificações (e-mail via Supabase, e/ou Web Push para Android/desktop) para o botão "Notificar Equipe".
