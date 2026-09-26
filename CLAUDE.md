# CLAUDE.md — Ebenezer App

Web app responsivo (mobile-first) para a IP Ebenézer Taubaté. MVP: **chamada da EBD/sociedades** (UPH, SAF, UMP, UPA…) + cadastro de membros + dashboard de presença.

## Regras de trabalho (obrigatórias)

- **Nunca faça `git commit`, `git push`, merge ou rebase.** Quem commita é o Luan. Prepare as mudanças e diga o que mudou e qual mensagem de commit sugerida.
- Trabalhe sempre supondo uma branch de feature; `main` é protegida (PR + CI verde).
- Antes de dizer que terminou: rode `composer test` (Pint + Larastan + Pest) e informe o resultado real.
- Não altere comportamento sem teste. Regra de negócio nova ⇒ teste novo referenciando o ID da regra (ex.: `RN-05`).
- Quando houver dúvida de regra de negócio, **pergunte**; não invente. Registre a decisão em `docs/diagnostico-fase0.md`.

## Comandos

| Objetivo | Comando |
|---|---|
| Subir ambiente (server + Vite + fila) | `composer run dev` |
| Todos os gates locais | `composer test` |
| Corrigir estilo | `composer lint` |
| Só testes / filtrar | `php artisan test` · `php artisan test --filter=RequestId` |
| Análise estática | `composer types:check` |

## Stack

Laravel 13 · PHP **8.4 como plataforma-alvo** (`config.platform.php` no composer.json; local roda 8.5) · Livewire 4 (componentes multi-arquivo, **sem** single-file/Volt) · Flux UI · Tailwind 4 · Fortify (auth) · Pest 5 · Larastan nível 7 · SQLite (dev/test).

## Convenções

- **Antes de começar qualquer tarefa, leia `docs/roadmap.md`** (o que fazer e em que ordem) e as regras de negócio citadas em `docs/diagnostico-fase0.md`.
- **Código em inglês, textos de UI em pt-BR.**
- `class` é palavra reservada: a entidade "Classe" é o model **`Group`** (tabela `groups`).
- Autorização **sempre** via Policies/Gates — nunca `if ($user->is_admin)` espalhado em controller/Blade.
- Validação de entrada via Form Request (ou `validate()` do Livewire com regras explícitas).
- Controllers e componentes Livewire **não** usam a facade `DB` (teste de arquitetura bloqueia). Consultas ficam em Models/scopes/serviços.
- `env()` só em `config/*.php`.
- Datas "só dia" (nascimento, data da chamada, entrada na classe) são colunas `DATE`.
- Integridade no banco além da validação: `unique`, FKs e `check` em migrations.
- Exclusão de membro = soft delete (histórico de chamadas é preservado).

## Domínio (resumo — detalhes em `docs/diagnostico-fase0.md`)

- Perfis com login: **admin** (tudo) e **secretária de classe** (escopo = classes dela). Membro comum não tem login.
- Visitante **sempre** pertence a uma classe: é um *tipo de vínculo* (`group_memberships.kind = visitante`), não atributo da pessoa.
- Chamada: 1 sessão por classe/data; presença binária; idempotente.
- Prazo: secretária edita até a próxima segunda 23:59 (America/Sao_Paulo); depois só admin, com auditoria.
- Regras RN-01…RN-10 no documento acima. Cada uma deve ter teste.

## Pendências conhecidas

- 2FA foi removido na instalação do starter kit; será reativado na Fase 2 (admins).
- Starter kit permite o usuário excluir a própria conta — contraria RN-02; revisar na Fase 2.

## Ambiente Windows do Luan

- Antivírus corporativo pode travar arquivos durante `composer install` — basta repetir o comando.
- Larastan precisa de `--memory-limit=1G` (já no script `types:check`).
