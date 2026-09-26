# Fase 1 — Setup do ambiente (Windows) e criação do projeto

> Você executa todos os comandos e **todos os commits**. Eu entro no passo 5 para adicionar os arquivos de configuração dos gates, e você revisa e commita.

## 0. Pré-requisitos (verifique no PowerShell)

```powershell
git --version     # se faltar: https://git-scm.com/download/win (já traz o Git Credential Manager)
node -v           # se faltar: Node LTS em https://nodejs.org (o Vite precisa dele)
```

Se for seu primeiro uso do Git nesta máquina:

```powershell
git config --global user.name  "Luan Leal"
git config --global user.email "seu-email-do-github"
```

## 1. PHP + Composer + instalador do Laravel (script oficial php.new)

Abra um PowerShell **comum (não como administrador)** e rode:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

Feche e abra o terminal de novo, depois confira:

```powershell
php -v          # 8.5.x
composer -V
laravel -v
```

> Alternativa com interface gráfica: [Laravel Herd](https://herd.laravel.com/windows) (grátis). Instala o mesmo conjunto e ainda serve o site em `ebenezer.test`.

## 2. Criar o projeto

```powershell
cd "C:\Users\TGID\Claude\Projects\Ebenezer App"
laravel new ebenezer
```

Respostas no assistente:

| Pergunta | Resposta | Por quê |
|---|---|---|
| Starter kit | **Livewire** | Front e back em PHP, renderizado no servidor |
| Authentication | **Laravel's built-in** | Sem serviço externo (WorkOS) = sem custo nem dependência |
| Volt / single-file components (se perguntar) | **Não** | Componentes em classe separada da view: mais explícito, mais próximo do que você conhece do Java |
| Testing framework | **Pest** | Datasets para a matriz de permissões |
| Database | **SQLite** | Zero infraestrutura no dev |
| Run npm install / build? | **Sim** | — |
| Initialize a Git repository? (se perguntar) | **Não** | Vamos fazer o Git na mão, para você ver cada passo |

> O starter kit vem com **cadastro público** (`/register`). Pela decisão D8, ele será removido na Fase 2, com um teste garantindo que a rota não existe.

## 3. Rodar e validar

```powershell
cd ebenezer
composer run dev        # sobe servidor + Vite + fila → http://localhost:8000
php artisan test        # tudo verde
```

Abra http://localhost:8000/up: tem que retornar 200. É o health check que vamos monitorar em produção.

## 4. Primeiro commit e push (você)

```powershell
git init -b main
git status              # CONFIRA: .env, vendor/, node_modules/ e database/database.sqlite NÃO podem aparecer
git add .
git commit -m "chore: scaffold Laravel (Livewire + Pest + SQLite)"
git remote add origin https://github.com/LuanLB99/Ebenezer_app.git
git push -u origin main
```

- **Por que HTTPS e não o `git@github.com:...` sugerido pelo GitHub?** A URL SSH exige uma chave SSH cadastrada. Com HTTPS, o Git Credential Manager abre o navegador para o login na primeira vez e pronto.
- **Por que conferir o `.env`?** Ele guarda o `APP_KEY`, a chave que criptografa sessões e cookies. Se vazar, alguém consegue forjar sessões. O `.gitignore` do Laravel já exclui esse arquivo; o `git status` é só a conferência.

## 5. Me avise: próxima entrega (numa branch, via PR)

Quando o push estiver feito, eu adiciono na pasta `ebenezer/` (sem commitar):

- `docs/`: diagnóstico, spec, wireframes
- `legacy/nextjs-prototype/`: cópia do protótipo para referência (o original fica intacto)
- `pint.json`, `phpstan.neon` (Larastan), `tests/ArchTest.php`
- `.github/workflows/ci.yml` com os gates de Build, Functional, Code Quality e Security
- `CLAUDE.md` com convenções e comandos
- tokens de cor/fonte da marca no CSS

Aí você cria a branch `chore/quality-gates`, revisa, commita e abre o PR. **Critério de pronto da Fase 1:** o CI fica verde no PR, e fica vermelho quando você colocar de propósito um erro de estilo, um teste quebrado ou um `dd()`.

Depois do primeiro PR verde, ative em GitHub → Settings → Branches uma **regra de proteção na `main`**: exigir PR + CI verde. É isso que transforma os gates de "informativos" em "bloqueantes".
