# Diagnóstico — Fase 0 (Discovery) · App IP Ebenézer

> **Escopo:** análise do que existe hoje na pasta `Ebenezer App/` e do que precisa mudar para o novo direcionamento (Laravel, webmobile, MVP = EBD/Chamada, custo mínimo, quality gates).
> **Nenhum arquivo do projeto foi alterado.** Este documento foi criado ao lado do `spec-tecnica.md`, fora da pasta de código.
> **Data:** 26/09/2026
>
> Legenda de evidência: **`OBSERVED`** confirmado no código/config · **`INFERRED`** interpretação razoável sem confirmação · **`UNKNOWN`** não dá para determinar só pelo repositório.

---

## Executive Summary

O "sistema legado" é um **protótipo (scaffold) Next.js 14 + Supabase** com ~1.800 linhas, sem git, sem testes, sem CI, sem lockfile e (aparentemente) nunca publicado. O ativo de valor não é o código de UI, e sim **o modelo de domínio e a matriz de permissões** (`supabase/migrations/0001_init.sql` + `spec-tecnica.md` §3).

Três conclusões principais:

1. **Laravel é viável e adequado** para o objetivo (monolito full-stack, baixo custo, estudo). Como não há usuários nem dados em produção (`UNKNOWN`, precisa confirmar), **uma reescrita é justificada aqui** — o princípio "não reescrever" protege sistemas que já estão em produção, e este não está. O que deve ser preservado é o **comportamento especificado**, não o código.
2. O modelo atual tem **lacunas que afetariam diretamente o MVP de chamada**: não impede registros de presença duplicados, não registra quando o membro entrou ou saiu da classe (o que distorce a % de presença), mistura *cargo eclesiástico* com *permissão no sistema* e não tem o conceito de "responsável por classe".
3. Há **problemas de segurança/LGPD** no desenho atual (dados de membros legíveis por qualquer logado, incluindo visitantes; fotos em bucket público; líderes podem se promover a pastor). Dados de filiação religiosa são **dados pessoais sensíveis** (LGPD art. 5º, II) e boa parte do público de UPA/UCP é menor de idade.

Como é um projeto novo, **os quality gates podem começar rígidos desde o primeiro commit**: o baseline é zero, sem dívida técnica herdada.

---

## Technology Stack

### Estado atual (`OBSERVED`, `ebenezer-app/package.json`)

| Camada | Tecnologia | Observação |
|---|---|---|
| Linguagem | TypeScript ^5.6 | `Database = any` em `lib/types.ts` anula a tipagem das queries |
| Framework | Next.js 14.2.15 (App Router), React 18 | Server Components para leitura; Client Components para escrita |
| UI | TailwindCSS 3 + tokens da marca (`tailwind.config.ts`) | Verde `#1A6648`, Playfair + Inter — **reaproveitável** |
| Estado/cache | TanStack Query (provider configurado, não usado), Zustand (não usado) | Dependências sem uso |
| Validação | zod, react-hook-form | **Declarados, não usados** (form de membro não valida) |
| BaaS | Supabase: Postgres + Auth + Storage + RLS | Toda a autorização está no banco (RLS) |
| Build | `next build` | Sem lockfile → build não reprodutível (versões `^`) |
| Testes | — | Nenhum |
| Lint | script `next lint` | Sem `.eslintrc` → `INFERRED`: o comando pediria configuração interativa |
| CI/CD | — | Sem `.github/`, sem git |
| Deploy | README sugere Vercel | `UNKNOWN` se chegou a ser publicado (sem `.vercel/`) |
| Logging / métricas / tracing / health | — | Nada |
| Cache, filas, jobs | — | Nada (nem necessário hoje) |
| Integrações externas | Supabase, Google Fonts (`next/font`) | — |
| PWA | `public/manifest.json` + ícones 192/512 | Reaproveitável |

### Stack alvo proposta (a validar)

| Camada | Escolha | Por quê | Paralelo Java |
|---|---|---|---|
| Linguagem | PHP 8.3+ | Suportado pelo Laravel atual | — |
| Framework | **Laravel** (versão estável mais recente no momento do `laravel new`) | Back + front + ORM + migrations + auth no mesmo projeto | Spring Boot "baterias incluídas" |
| Front | **Blade + Livewire 3 + Alpine + Tailwind** | Uma linguagem só, renderizado no servidor, responsivo; bom para estudo | Thymeleaf + um pouco de reatividade |
| Auth | Starter kit oficial (login, reset de senha, rate limit) + 2FA para admins | Evita escrever auth na mão | Spring Security |
| Autorização | **Policies + Gates** | Regra de acesso em classes testáveis, fora do controller | `@PreAuthorize` / `AccessDecisionVoter` |
| Validação | Form Requests | Validação declarativa na entrada | Bean Validation em DTO |
| ORM | Eloquent | **Atenção:** é *Active Record*, não *Data Mapper* como o JPA. A entidade conhece o banco | Hibernate, com filosofia diferente |
| DB | SQLite (dev) · Postgres ou SQLite (prod), ver *Custo* | — | — |
| Testes | **Pest** (sobre PHPUnit) | Sintaxe enxuta, datasets para a matriz de permissões | JUnit 5 + `@ParameterizedTest` |
| Estática | **Larastan** (PHPStan) · **Pint** · Rector (opcional) | — | SpotBugs/ErrorProne · Spotless · OpenRewrite |
| Dev no Windows | **Laravel Herd** (mais simples) ou Sail/Docker (paridade com prod) | — | — |

**Resposta direta:** sim, dá para fazer em Laravel, e ele cobre back, front e banco no mesmo projeto. O banco em si continua sendo um serviço separado (SQLite é um arquivo; Postgres é um servidor), mas as migrations, o ORM e os seeds ficam no Laravel.

### Custo mínimo — opções de hospedagem (confirmar preços na hora de contratar)

| Opção | Custo | Integridade/Segurança | Esforço operacional |
|---|---|---|---|
| **A. Laravel Cloud** | Planos por uso, a partir de ~US$ 5/mês, com *scale-to-zero* e limite de gasto | Gerenciado (TLS, deploy, rollback) | Baixo |
| **B. VPS pequena** (Hetzner, Contabo, Hostinger VPS…) + SQLite ou Postgres local | Poucos US$/€ por mês | Depende de você: patches, firewall, backups | Médio (ótimo para aprender) |
| **C. Oracle Cloud Always Free** | Zero | Igual à B | Médio. **Risco:** em 2026 a Oracle reduziu pela metade os limites do free tier (4→2 OCPU, 24→12 GB) sem anúncio público |
| D. Hospedagem compartilhada | Muito barata | Pouco controle (versão de PHP, workers, SSH) | Baixo, mas com limitações |

Recomendação `INFERRED`: **A** se o objetivo for "no ar e esquecer"; **B** se quiser aprender infraestrutura. Com o volume de uma igreja (centenas de membros, dezenas de chamadas por semana), **SQLite em WAL com backup externo diário** aguenta bem e elimina o custo de um banco gerenciado. Postgres passa a valer a pena se houver mais de uma instância da aplicação.

---

## Architecture

### Arquitetura atual (`OBSERVED`)

```
Browser ──► Next.js (Vercel)  ── Server Components ──► Supabase REST (anon key + cookie de sessão)
   │              │ middleware.ts: getUser() → redireciona p/ /login
   └── Client Components ─────────────────────────────► Supabase REST direto do navegador
                                                          │
                                         Postgres + RLS (TODA a autorização)
                                         Storage (4 buckets públicos)
```

- **Componentes:** `app/(auth)/login`, `app/(dashboard)/*` (membros, ebd, agenda, cultos, repertorio, perfil), `components/ui` (Button, Card, Input, Badge), `components/layout` (Sidebar/BottomTabs responsivos), `lib/supabase` (clients browser/server).
- **Persistência:** apenas Supabase. Não existe camada de serviço nem de domínio: as páginas chamam `supabase.from(...)` diretamente (acesso direto à infraestrutura em 9 pontos).
- **Regras de negócio:** vivem **somente nas policies RLS** e em constraints SQL. A UI não conhece permissões (ex.: o botão "Novo Membro" aparece para qualquer usuário, e o insert só falha no banco).
- **Assíncrono / filas / jobs:** nenhum.
- **Acoplamento:** alto com o Supabase (SDK na UI, `auth.uid()` nas policies, `auth.users` como FK). Nada disso migra para Laravel. O que migra é o **modelo e as regras**.
- **Arquivos grandes/complexos:** nenhum (maior arquivo: 263 linhas de SQL).

### O que é reaproveitável

| Ativo | Reuso |
|---|---|
| `0001_init.sql` (modelo) | Base para as migrations Laravel, com as correções abaixo |
| Matriz de permissões (`spec-tecnica.md` §3 + RLS) | Vira a especificação das Policies e a matriz de testes |
| Tokens de design (`tailwind.config.ts`), ícones, manifest PWA, wireframes | Reuso direto no Tailwind do Laravel |
| Código TSX | Referência visual apenas |

---

## Main Behaviors

### F1 — Login
- **Entrada:** `/login`, e-mail + senha. Não há cadastro público (`OBSERVED`).
- **Processo:** `signInWithPassword` no cliente. O `middleware.ts` chama `getUser()` a cada request (valida no servidor, que é a prática correta) e redireciona. `OBSERVED`
- **Saída:** cookie de sessão; redireciona para `/`.
- **Falhas:** mensagem genérica "E-mail ou senha inválidos" (`OBSERVED`, bom: não revela se o e-mail existe). Rate limit: depende do Supabase (`INFERRED`). Reset de senha: inexistente (`OBSERVED`).
- **Primeiro admin:** criado manualmente no painel do Supabase (README passo 5).

### F2 — Cadastro de membro
- **Entrada:** `/membros/novo` (client). Campos: nome, nascimento, cargo, telefone, e-mail.
- **Processo:** `insert` direto do navegador; a RLS `members_write_leader` exige pastor/líder. `OBSERVED`
- **Falhas:** sem validação no cliente (zod não usado); `error.message` do Postgres exibido cru ao usuário. `OBSERVED`
- **Sem** edição, exclusão, upload de foto nem vínculo com login. `OBSERVED`

### F3 — Listagem e detalhe de membro
- Qualquer usuário **autenticado** (inclusive `visitante`) lê todos os membros com telefone, e-mail e nascimento (policy `members_select_authenticated`). `OBSERVED`
- O comentário em `membros/page.tsx` diz "visível para líderes/pastores". **O comportamento pretendido diverge do observado.**
- Nascimento: `format(new Date("YYYY-MM-DD"))`. Uma string só com data é interpretada como UTC. `INFERRED`: rodando em UTC-3 (dev local), mostra **o dia anterior**; na Vercel (UTC) mostra certo. Bug dependente de ambiente.

### F4 — Classes EBD (listagem)
- Lista `ebd_classes` ativas com o professor. `OBSERVED`
- Botão "Nova Classe" desabilitado; link "Chamada →" aponta para `/ebd/[id]`, **rota inexistente (404)**. `OBSERVED`

### F5 — Chamada (registro de presença) — **não implementado na UI**
- Existe só o schema: `attendance_sessions` (unique `class_id + session_date`) e `attendance_records (session_id, member_id, present default false)`. `OBSERVED`
- **Sem** unique `(session_id, member_id)`: é possível gravar duas presenças para o mesmo membro no mesmo dia. `OBSERVED`
- **Sem** checagem de que o membro pertence à classe. `OBSERVED`
- Excluir um membro com presença registrada **falha** (FK sem `on delete`, ao contrário de `class_members`, que tem cascade). `OBSERVED`
- Só pastor/líder escreve. **Não existe "responsável/professor pode fazer a chamada da própria classe"**, mesmo com `teacher_id` na tabela. `OBSERVED`

### F6 — Agenda, Boletim, Cultos, Repertório (fora do MVP)
- Só leitura. `bulletin_posts` e `events` têm `select using (true)`: **qualquer pessoa sem login** lê pela API REST com a anon key (que é pública no bundle). `OBSERVED`. Se isso é intencional: `UNKNOWN`.
- A "Minha próxima escala" da Home está fixa no código. `OBSERVED`

### F7 — Upload de arquivos (só policies, sem UI)
- 4 buckets **públicos**; qualquer autenticado (inclusive visitante) faz upload em qualquer bucket; não há policy de update/delete nem limite de tipo/tamanho. `OBSERVED`
- Fotos de membros (inclusive de menores) acessíveis por URL pública. `OBSERVED`

### Autorização: pontos de atenção (`OBSERVED`)
- `members_write_leader` é `for all` → um **líder pode alterar o próprio `role` para `pastor`**, rebaixar ou excluir o pastor. É escalonamento de privilégio.
- `members.role` mistura **cargo** (pastor, líder…) com **permissão de sistema**. No MVP, a secretária da SAF, que é "membro", precisa fazer chamada, e um presbítero não precisa ser admin do sistema.

---

## Critical Flows

| # | Fluxo (no MVP Laravel) | Criticidade | Evidência / motivo |
|---|---|---|---|
| C1 | **Autorização** (admin global × responsável por classe × usuário comum) | **Crítica** | Os achados de F3, F7 e de escalonamento mostram que é aqui que o desenho atual falha. Com dados sensíveis (LGPD art. 5º, II, e menores), um vazamento tem impacto legal e de confiança |
| C2 | **Registrar/editar chamada** | **Crítica** | É o produto do MVP. Os achados de F5 (duplicidade, membro fora da classe) corrompem silenciosamente todos os números |
| C3 | **Cálculo do dashboard** (% presença, faltas) | **Alta** | Sem data de entrada/saída na classe (`class_members` só tem `class_id`, `member_id`), a % fica errada para quem entrou no meio do ano. `OBSERVED` no schema |
| C4 | Vínculo membro ↔ classe | Alta | Define o denominador do C3 e quem aparece na lista de chamada |
| C5 | CRUD de membros / classes | Média | Volume baixo; o risco está em hard delete apagar histórico (hoje a FK bloqueia o delete) |
| C6 | Login / reset de senha | Alta | Hoje não existe reset; sem ele, o suporte vira manual |

---

## Testing Assessment

| Tipo | Existe? | Observação |
|---|---|---|
| Unit | Não | — |
| Integration | Não | — |
| E2E | Não | — |
| Contract | Não | — |
| Performance | Não | — |
| Segurança (RLS/policies) | Não | As policies são a *única* camada de autorização e não têm nenhum teste |
| Integração externa | Não | — |

**O que está protegido:** somente as constraints do banco (FK, `check`, `unique(class_id, session_date)`, `unique(class_id, member_id)`).
**O que está desprotegido:** todo o resto, com destaque para a matriz de permissões.

---

## Safety Net Proposal

Como a direção é **reescrever em Laravel**, a safety net não vai proteger o código Next. Ela funciona como uma **especificação executável** escrita junto (ou antes) de cada feature, de modo que o comportamento desejado fique fixado em teste desde o início.

| # | Comportamento a proteger | Teste | Nível | Prioridade |
|---|---|---|---|---|
| S1 | Matriz de permissões: cada perfil × cada ação × (própria classe / outra classe) → permitido ou 403 | Pest **dataset** percorrendo a matriz | Feature (HTTP) | **P0** |
| S2 | Usuário comum não altera o próprio perfil de acesso; responsável não vira admin | Feature | Feature | **P0** |
| S3 | Chamada idempotente: salvar duas vezes = 1 registro por membro/sessão | Feature + constraint `unique` no banco | Feature + DB | **P0** |
| S4 | Presença só para quem tem vínculo ativo com a classe naquela data, seja membro ou visitante (RN-03/RN-04) | Feature | Feature | **P0** |
| S4c | Visitante não pode existir sem classe: cadastrar visitante cria pessoa + vínculo `visitante` na mesma transação; sem `group_id`, dá erro 422 (RN-04) | Feature | Feature | **P0** |
| S4b | Prazo: secretária edita até a próxima segunda 23h59 (horário de SP); depois disso recebe 403; admin continua editando e a alteração fica auditada (RN-05) | Feature com `travelTo()` nas bordas (domingo 23h59, segunda 23h59, terça 00h00) | Feature | **P0** |
| S5 | Cálculo de %: denominador = sessões realizadas dentro do período em que o membro esteve na classe; casos de borda (0 sessões, entrou hoje, saiu, justificado) | Unit na classe de cálculo | Unit | **P0** |
| S6 | Dashboard sem N+1: nº de queries ≤ limite com seed de 500 membros × 52 domingos | Feature com contador de queries + `preventLazyLoading` | Feature | P1 |
| S7 | Soft delete de membro preserva o histórico de chamadas | Feature | Feature | P1 |
| S8 | Migrations sobem e descem (`migrate:fresh`, `migrate:rollback`) | CI | Build | P1 |
| S9 | Fluxo feliz no celular: login → classe → marcar presença → salvar → ver % | E2E (Pest browser/Dusk) — 1 cenário só | E2E | P2 |
| S10 | Datas "só dia" (nascimento, data da chamada) não mudam com o fuso | Unit | Unit | P2 |

---

## Observability Assessment

| Área | Estado atual | Lacuna | Proposta MVP (proporcional) |
|---|---|---|---|
| Logs | Nenhum | Total | Logs em JSON do Laravel com `request_id` e `user_id` via `Log::withContext` |
| Auditoria | Nenhuma | **Quem alterou a chamada ou o membro?** Importante para LGPD e para disputas ("eu estava presente!") | `spatie/laravel-activitylog` em Member, Class, AttendanceRecord |
| Métricas | Nenhuma | — | Métricas **de negócio**, não de infra: chamadas registradas por domingo; classes sem chamada até segunda (vale um alerta); falhas de login |
| Tracing | Nenhum | — | **Não justificado** agora (monolito + 1 banco). Reavaliar se surgirem integrações |
| Erros | Nenhum | — | Sentry (tem plano gratuito; confirmar limites) ou Flare, com `request_id` |
| Health | Nenhum | — | Rota `/up` nativa do Laravel + monitor de uptime gratuito (UptimeRobot/Better Stack) |
| Performance | — | — | Laravel Pulse (gratuito, self-hosted) para queries lentas; opcional |
| Backups | Dependiam do Supabase | **Restore nunca testado** | Dump diário criptografado fora do servidor + restore mensal testado |

---

## Quality Engineering Assessment

| Verificação | Existe? |
|---|---|
| Lint | Script declarado, sem config (`INFERRED`: não roda) |
| Formatação | Não |
| Type check | Script `tsc --noEmit` existe, mas `Database = any` anula o ganho |
| Análise estática | Não |
| Dependency scanning | Não (e sem lockfile nem é possível) |
| Secret scanning | Não (`.gitignore` cobre `.env*`, o que ajuda) |
| Testes / coverage | Não |
| Build validation / deploy validation | Não |

---

## Proposed Quality Gates

Como o projeto é greenfield, não há legado a tolerar. **A regra é: o gate nasce bloqueante; só se relaxa com justificativa escrita.**

| Categoria | Regra | Motivo | Ferramenta | Quando | Bloqueia? |
|---|---|---|---|---|---|
| Build | `composer validate`, `composer install`, `npm ci && npm run build` passam | Build reprodutível (lockfiles versionados) | Composer, Vite | PR | **Sim** |
| Build | `config:cache`, `route:cache`, `view:cache` passam | Pega erro de config que só estoura em prod | Artisan | PR | **Sim** |
| Build | Migrations: `migrate:fresh --seed` + `migrate:rollback` | Garante que o schema é reversível | Artisan | PR | **Sim** |
| Functional | 100% dos testes Pest passam | — | Pest | PR + pre-push | **Sim** |
| Functional | Matriz de permissões (S1) cobre toda rota autenticada | Autorização é o risco nº 1 | Teste arquitetural Pest (`arch()`) + teste que lista rotas sem policy | PR | **Sim** |
| Code Quality | Zero diffs de estilo | Remove discussão de estilo do review | Pint `--test` | PR + hook local | **Sim** |
| Code Quality | Larastan sem erros no nível acordado (começar no 6 e subir 1 nível por marco até o `max`) | Pega nulls e tipos, faz o papel do compilador Java | Larastan | PR | **Sim** |
| Code Quality | Regras arquiteturais: controllers não usam `DB::`; models sem `env()`; sem `dd()`/`dump()` | Evita acoplamento e lixo de debug | Pest `arch()` | PR | **Sim** |
| Security | Nenhuma vulnerabilidade **high/critical** em dependências | — | `composer audit`, `npm audit --audit-level=high`, Dependabot | PR + semanal | **Sim** (high+) / informa (moderate) |
| Security | Nenhum segredo commitado | — | gitleaks | PR | **Sim** |
| Security | Prod com `APP_DEBUG=false`, `APP_ENV=production`, HTTPS, cookies `secure` | Debug ligado em prod vaza stack trace e env | Script de checagem no deploy | Deploy | **Sim** |
| Coverage | ≥ 90% de linhas **em `app/Policies` e nos serviços de domínio (chamada/estatística)**; global só informativo | Cobertura onde há regra; não vira meta de vaidade | Pest `--coverage --min` por diretório (PCOV) | PR | Sim (domínio) / informa (global) |
| Coverage (qualidade do teste) | Mutation score no cálculo de % | Coverage não prova que o teste valida algo | Pest `--mutate` | Semanal | Informa |
| Performance | Dashboard: nº de queries ≤ N (S6); lazy loading proibido fora de prod | Único ponto com volume que cresce (membros × semanas) | `Model::preventLazyLoading()`, asserção de query count | PR | **Sim** |
| Performance | p95 do dashboard < 500 ms com seed realista | Só como sinal | Script k6/`ab` local | Manual/mensal | Informa |
| Deploy | Smoke pós-deploy: `/up` 200 + `/login` 200 | Detecta deploy quebrado | curl no pipeline | Pós-deploy | **Sim** (dispara rollback) |

---

## Baselines

| Métrica | Protótipo Next (atual) | Projeto Laravel (baseline inicial) |
|---|---|---|
| LOC | ~1.809 (TS/SQL/config) | ~0 de código próprio |
| Testes / coverage | 0 / 0% | Começa em 100% dos testes passando; cobertura de domínio ≥ 90% desde a 1ª feature |
| Issues de lint/estática | `UNKNOWN`: não executado, porque `npm install` criaria `node_modules` e lockfile na pasta | 0 (Pint e Larastan limpos) |
| Vulnerabilidades | `UNKNOWN`: sem lockfile, `npm audit` não é determinístico | 0 high/critical |
| Achados de segurança em revisão manual | **7** (F3, F7 ×2, escalonamento de role, leitura anônima, sem reset de senha, fotos públicas) | 0 abertos no go-live |
| Achados de integridade de dados | **4** (sem unique na presença, membro fora da classe, FK sem regra de delete, sem período na classe) | 0 |
| Tempo de build / CI | `UNKNOWN` | Medir no 1º pipeline; alvo < 5 min |
| Bugs funcionais observados | 3 (rota 404 da chamada, data com fuso, home fixa) | — |

A evolução passa a ser: **CURRENT STATE (protótipo) → BASELINE ZERO (Laravel) → ratchet** (Larastan sobe de nível; mutation score sobe).

---

## CI/CD Assessment

**Atual:** não existe. Sem git, sem pipeline, sem ambientes, sem rollback. `OBSERVED`

**Proposta incremental (GitHub Actions, gratuito para repositório privado dentro da cota):**

1. **v1 — PR:** `lint` (Pint) → `static` (Larastan) → `test` (Pest em SQLite; job extra em Postgres se a produção usar Postgres) → `security` (composer/npm audit, gitleaks) → `build` (Vite + caches do Artisan).
2. **v2 — main:** deploy automático (Laravel Cloud via git, ou script com releases por symlink na VPS: deploy sem downtime e rollback = trocar o symlink de volta).
3. **v3 — pós-deploy:** smoke test (`/up`, `/login`), `migrate --force` com backup antes, alerta se o smoke falhar.
4. **v4 — rotina:** Dependabot, job semanal de mutation testing e **teste de restore de backup** mensal.

Ambientes: `local` → `production`. Staging só se o custo permitir (Laravel Cloud tem ambientes por branch; na VPS, um subdomínio com SQLite separado sai praticamente de graça).

---

## Risks

| # | Risco | Evidência | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Regras de negócio da chamada/dashboard **não definidas** | Schema sem período, sem status "justificado"; a spec não define % | Dashboard mostra números errados e perde credibilidade | Responder as perguntas abertas abaixo antes de codar a chamada; fixar em testes (S5) |
| R2 | Autorização mal desenhada (cargo = permissão) | `members.role` usado nas policies | Vazamento ou escalonamento de privilégio | Separar `users.is_admin` (sistema) + `class_user` (responsável por classe) de `members.cargo` (eclesiástico) |
| R3 | LGPD: dado religioso sensível + menores | Público UPA/UCP; fotos públicas | Legal/reputacional | Minimização, acesso por necessidade, fotos privadas via URL assinada, termo de consentimento (validar com a liderança) |
| R4 | Existe dado real no Supabase? | `UNKNOWN` | Se existir, a reescrita precisa de migração | Confirmar; se sim, script de export/import testado |
| R5 | Curva de aprendizado PHP/Laravel (você vem de Java) | Contexto | Código "Java em PHP" ou excesso de mágica do Eloquent | Convenções no `CLAUDE.md`; Larastan rígido; Form Requests e Policies desde o início |
| R6 | Free tier que muda sem aviso | Oracle cortou limites em 2026 | Queda ou migração forçada | Infra reproduzível (script ou Docker) + backup fora do provedor |
| R7 | Backup nunca testado | Nada existe | Perda de histórico de presença | Restore mensal automatizado com verificação |
| R8 | Operação com SQLite | Escolha de custo | Lock em escrita concorrente (baixo nesse volume) | Modo WAL, `busy_timeout`, 1 instância; plano de migração para Postgres documentado |

---

## Modernization Roadmap

A ordem foi ajustada porque o projeto é greenfield e não há comportamento em produção a proteger. **CI e gates vêm antes das features**, que é quando instalar sai mais barato.

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **0 — Discovery** | Este documento + respostas às perguntas abertas + ADRs (hospedagem, banco, Livewire) | Todas as perguntas abertas respondidas |
| **1 — Walking skeleton + CI + Gates** | Repo git, `laravel new`, pipeline v1 com todos os gates bloqueantes, `/up`, logs JSON com `request_id`, Sentry | PR com violação proposital **falha**; `main` verde |
| **2 — Identidade & Autorização (safety net S1/S2)** | Users, convite (sem cadastro público), reset de senha, 2FA admin, Policies, matriz de testes | Matriz 100% verde; nenhuma rota sem policy |
| **3 — Membros & Classes** | CRUD de membros (soft delete, foto privada), classes (UPH/SAF/UMP/UPA…), vínculo com período, responsáveis | S4, S7 verdes; activity log ativo |
| **4 — Chamada (fluxo crítico)** | Tela mobile-first de chamada por classe/data, idempotente, edição auditada | S3, S4, S10 verdes; E2E S9 |
| **5 — Dashboard** | Consolidado por classe/membro/período (presença, faltas, %) | S5, S6 verdes; p95 medido |
| **6 — Go-live hardening** | Deploy v2/v3, backup + restore testado, uptime monitor, revisão LGPD | Restore testado; smoke pós-deploy verde |
| **7 — Melhoria contínua** | Subir o nível do Larastan, mutation testing, Dependabot; depois Agenda → Louvor reutilizando o padrão | Ratchet mensal registrado |

**Destino do protótipo Next:** não apagar. No primeiro commit do repositório, arquivar em `legacy/nextjs-prototype/` (ou numa tag git) como referência visual e de domínio.

---

## Recommended First Step

**Fase 1: criar o esqueleto Laravel com pipeline de CI e quality gates, sem nenhuma feature de negócio.**

- **O que fazer:** `git init`; arquivar o protótipo; `laravel new` com o starter kit Livewire + Pest; instalar Pint, Larastan e gitleaks; criar `.github/workflows/ci.yml` com os gates de Build, Functional, Code Quality e Security; configurar logs JSON com `request_id`; escrever um `CLAUDE.md` com as convenções e os comandos de gate; portar os tokens de cor/fonte para o Tailwind.
- **Por que primeiro:** é o momento em que instalar gates custa menos (zero dívida). Toda feature seguinte já nasce validada. Também não depende das respostas de negócio pendentes, então dá para fazer em paralelo à Fase 0.
- **Arquivos/componentes:** `composer.json`, `phpstan.neon`, `pint.json`, `.github/workflows/ci.yml`, `tests/Arch.php`, `config/logging.php`, middleware de `request_id`, `tailwind`/`app.css`, `CLAUDE.md`, `README.md`.
- **Como saber que terminou:**
  1. `php artisan test`, `pint --test` e `phpstan` passam localmente;
  2. um PR com erro de estilo **falha** no CI; um PR com teste quebrado **falha**; um PR com um `dd()` **falha**;
  3. `main` verde; `/up` retorna 200 localmente;
  4. o README tem o runbook "clonar → rodar → testar" em até 5 comandos.

---

## Decisões da Fase 0 (26/09/2026) — perguntas encerradas

| # | Pergunta | Decisão | Consequência técnica |
|---|---|---|---|
| D1 | Há dados no Supabase? | **Não** | Reescrita total sem migração de dados. R4 eliminado. Protótipo só arquivado |
| D2 | Sociedades × classes EBD | **Mesmo conceito** | Uma entidade só (`Group`). O membro pode estar em várias ao mesmo tempo (N:N com período) |
| D3 | Falta justificada? | **Não** | Presença binária (`present` true/false) |
| D4 | Visitantes | **Cadastro rápido e sempre vinculado a uma classe** (revisado em 26/09); se continuar vindo, é promovido a membro da classe | Visitante é um **tipo de vínculo** (`group_memberships.kind = visitante`), não um atributo da pessoa. Promoção = mudar o `kind` no mesmo vínculo |
| D5 | Prazo de edição | **Até a próxima segunda 23h59 (SP)** para a secretária; **admin edita depois**, com auditoria | Regra de prazo centralizada numa classe testável (não espalhada em Blade/controller) |
| D6 | Dados pessoais | Secretária **vê e edita só membros das classes dela** | Policy com escopo por classe; query scope `visibleTo($user)` |
| D7 | Boletim/agenda públicos | **Sim** (fora do MVP) | Rotas públicas somente-leitura no futuro, isoladas do resto |
| D8 | Login no MVP | **Só admins e secretárias** | Membro comum não tem conta; `members.user_id` é opcional |

Com isso, **não há mais `UNKNOWN` bloqueante**. A Fase 0 está encerrada.

---

## Modelo de domínio do MVP (alvo)

> `class` é palavra reservada no PHP, então o model não pode se chamar `Class`. Proposta: **`Group`** no código e "Classe" na interface. Convenção: código em inglês, textos da UI em pt-BR.

```
users ──0..1── members ──< group_memberships >── groups ──< attendance_sessions ──< attendance_records >── members
  │                                                  │
  └──────────────< group_roles >─────────────────────┘      (secretária por classe)
```

| Tabela | Campos principais | Integridade no banco |
|---|---|---|
| `users` | name, email, password, `is_admin`, campos de 2FA | `unique(email)` |
| `members` | `user_id` (nullable), full_name, birth_date (DATE), phone, email, photo_path, soft deletes (sem `status`: ser visitante depende da classe) | `unique(user_id)` |
| `groups` | name, acronym (UPH, SAF, UMP, UPA…), description, active, soft deletes | `unique(acronym)` |
| `group_memberships` | group_id, member_id, **`kind`** (`membro`/`visitante`), `joined_on` (1ª presença/entrada), **`member_since`** (nullable; data da promoção ou da entrada direta como membro), `left_on` (nullable) | Índice único **parcial** `(group_id, member_id) WHERE left_on IS NULL` (SQLite e Postgres suportam); `check(left_on >= joined_on)`; `check(kind = 'visitante' OR member_since IS NOT NULL)` |
| `group_roles` | group_id, user_id, role (`secretario`) | `unique(group_id, user_id)` |
| `attendance_sessions` | group_id, `held_on` (DATE), created_by | `unique(group_id, held_on)` |
| `attendance_records` | session_id, member_id, `present`, recorded_by, timestamps (sem `is_guest`: o tipo vem do vínculo, evitando dado duplicado que pode divergir) | **`unique(session_id, member_id)`** |
| `activity_log` | (spatie) quem, o quê, antes/depois | — |

Cargo eclesiástico (pastor, presbítero…) **não** entra em autorização. Se for útil, vira um campo informativo em `members`.

---

## Regras de negócio (cada uma vira teste)

| ID | Regra | Teste |
|---|---|---|
| RN-01 | Só **admin** cria, edita e desativa classes, e concede ou remove o papel de secretária. Ninguém altera as próprias permissões | S1, S2 |
| RN-02 | **Secretária** vê, cria e edita membros **das classes dela**; incluir na classe = abrir vínculo (`joined_on`); remover = fechar vínculo (`left_on`), **sem apagar o membro**. Excluir membro (soft delete) é só do admin | S1, S7 |
| RN-03 | Chamada = 1 sessão por classe/data. A lista traz os membros com vínculo ativo naquela data, com cada um marcado como presente ou ausente. Salvar de novo é idempotente (upsert) | S3 |
| RN-04 | **Visitante sempre pertence a uma classe.** Cadastro rápido (nome obrigatório, telefone opcional) feito a partir da tela de chamada: cria a pessoa **e** o vínculo `kind = visitante` com `joined_on` = data da sessão, na mesma transação. A tela busca por nome/telefone antes de criar, para evitar duplicado. Os visitantes aparecem na chamada numa seção separada | S4, S4c |
| RN-05 | **Prazo:** a secretária edita até **a primeira segunda-feira depois de `held_on`, 23h59min59s, America/Sao_Paulo** (sessão de domingo → segunda seguinte; sessão de segunda → segunda da semana seguinte). Depois disso, só o admin edita, e fica registrado no activity log | S4b |
| RN-06 | **% de presença** (por membro, por classe) = presentes ÷ sessões elegíveis. Elegível = sessão da classe com `held_on` dentro de `[joined_on, left_on]`. Faltas = elegíveis − presentes. Com 0 sessões elegíveis, mostra "—" em vez de 0% | S5 |
| RN-07 | **Promover visitante:** no mesmo vínculo, `kind → membro` e `member_since = hoje`. A **média da classe** conta a pessoa só a partir de `member_since`, então as visitas anteriores não entram retroativamente. O histórico individual (desde `joined_on`) continua visível | S5 |
| RN-08 | Visitantes são vistos e editados pela secretária da classe do vínculo, pela mesma regra dos membros (D6). A exceção que existia antes deixou de ser necessária | S1 |
| RN-10 | `INFERRED` (confirmar): visitantes **não entram na % média da classe**, para que quem veio uma vez só não derrube o índice. Eles aparecem em indicadores próprios: visitantes por sessão e visitantes recorrentes (candidatos a promoção) | S5 |
| RN-09 | Datas "só dia" (`birth_date`, `held_on`, `joined_on`) são `DATE`, sem hora; o fuso da aplicação é America/Sao_Paulo | S10 |

### Dashboard (Fase 5)
- **Admin:** todas as classes. **Secretária:** só as dela.
- Por classe e período: membros ativos, sessões realizadas, % média de presença, presença por sessão (série no tempo), visitantes por sessão e **visitantes com 3+ presenças** (candidatos a promoção).
- Por membro: % e faltas. Sugestão (`INFERRED`, validar com o pastor): destacar quem tem **3+ faltas seguidas**, que é um sinal útil de cuidado pastoral.
- A % é sempre **por classe**. Um membro de duas classes tem duas %. Não existe % "geral" no MVP.

---

## Sugestões de ferramentas do Claude Code para as próximas fases

- **`CLAUDE.md` no repositório** com as convenções (Policies obrigatórias, Form Requests, nada de `DB::` em controller) e os comandos de gate. O Claude lê esse arquivo em toda sessão.
- **Hook `PostToolUse`** que roda `pint` no arquivo PHP editado: a formatação passa a ser automática.
- **Slash command customizado** (ex.: `/gate`) que roda Pint + Larastan + Pest de uma vez.
- **Subagente de review** focado na matriz de permissões antes de cada PR.

---

### Fontes
- Código analisado: `ebenezer-app/` (todos os arquivos), `spec-tecnica.md`
- [Laravel Cloud — Pricing](https://laravel.com/cloud/pricing) · [Laravel Cloud adds scale-to-zero and spending limits](https://laravel-news.com/laravel-cloud-adds-scale-to-zero-and-spending-limits)
- [InfoQ — Oracle halves Free Tier Ampere A1 limits (jul/2026)](https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/)
