# Quality Gates

> Princípio: o gate nasce **bloqueante**; relaxar exige justificativa escrita aqui.
> Onde roda: `L` = local (`composer test`), `CI` = GitHub Actions em todo PR/push na `main`, `GH` = configuração do GitHub.

## Ativos

| Gate | Regra | Ferramenta | Onde | Bloqueia? |
|---|---|---|---|---|
| Build | `composer.json`/`composer.lock` válidos e coerentes | `composer validate --strict` | CI | Sim |
| Build | Dependências instalam a partir do lock; front compila | `composer setup` (install + migrate + npm build) | CI | Sim |
| Build | Caches de produção geram sem erro | `config:cache`, `route:cache`, `view:cache` | CI | Sim |
| Build | Migrations sobem e descem | `migrate:refresh` | CI | Sim |
| Compatibilidade | Suite passa em PHP 8.4 (alvo) e 8.5 (local) | matriz no workflow | CI | Sim |
| Code Quality | Zero violação de estilo | Pint | L + CI | Sim |
| Code Quality | Zero erro de análise estática, nível 7 | Larastan | L + CI | Sim |
| Code Quality | Regras de arquitetura (sem debug, sem funções inseguras, `env()` só em config, sem `DB::` em controller/Livewire) | Pest `arch()` — `tests/Unit/ArchitectureTest.php` | L + CI | Sim |
| Functional | 100% dos testes passam | Pest | L + CI | Sim |
| Security | Nenhuma vulnerabilidade conhecida em pacotes PHP | `composer audit --locked` | CI | Sim |
| Security | Nenhuma vulnerabilidade high/critical em pacotes JS | `npm audit --audit-level=high` | CI | Sim |
| Security | Nenhum segredo commitado | GitHub Secret Scanning + Push Protection | GH | Sim (bloqueia o push) |
| Security | Atualização de dependências | Dependabot (actions, composer, npm; semanal) | GH | Informa (abre PR) |
| Processo | `main` só recebe PR com CI verde | Branch protection / ruleset | GH | Sim |

## Planejados (entram quando houver código que justifique)

| Gate | Quando | Motivo de esperar |
|---|---|---|
| Cobertura ≥ 90% em `app/Policies` e serviços de domínio | Fase 2 | Ainda não existem esses diretórios; cobertura global não é meta |
| Matriz de permissões cobre toda rota autenticada | Fase 2 | Depende das Policies |
| Contagem de queries do dashboard ≤ N + `preventLazyLoading` | Fase 5 | Dashboard ainda não existe |
| Mutation testing no cálculo de % (informativo) | Fase 5 | Idem |
| Smoke test pós-deploy (`/up`, `/login`) com rollback | Fase 6 | Ainda não há deploy |
| Subir Larastan para nível 8 → max | Contínuo | Ratchet após cada fase |

## Baseline (26/09/2026 — após scaffold)

| Métrica | Valor |
|---|---|
| Estilo (Pint) | 44 arquivos, 0 problemas |
| Larastan | nível 7, 0 erros |
| Testes | 23 passando, 53 asserções (antes deste PR) |
| PHP | alvo 8.4.1 · CI 8.4 e 8.5 |
