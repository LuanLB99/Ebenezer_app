# Especificação Técnica — App IP Ebenézer Taubaté

> **Igreja Presbiteriana Ebenézer Taubaté**
> Versão 1.0 — Junho 2026

---

> **Addendum — Setembro 2026: mudança de arquitetura**
> Decidimos iniciar o projeto como **web app responsiva** (desktop-first, funcionando também no navegador do celular) em vez de app nativo React Native/Expo. O banco de dados, as regras de negócio e o RLS abaixo continuam exatamente os mesmos — só a camada de apresentação mudou, para **Next.js + TypeScript + TailwindCSS**, mantendo Supabase como backend. Detalhes da decisão e o código já implementado estão no projeto `ebenezer-app/` (ver `README.md` lá dentro). Push notification nativa fica como limitação conhecida (funciona bem em Android/desktop via Web Push; no iPhone só com "Adicionar à Tela de Início"); se isso virar crítico, o caminho é embrulhar esta mesma web app com Capacitor, sem reescrever o código.

---

## Identidade Visual

| Token | Valor |
|---|---|
| Verde Primário | `#1A6648` |
| Verde Escuro | `#0F3D2A` |
| Branco | `#FFFFFF` |
| Background | `#F7F7F5` |
| Cinza Texto | `#555555` |
| Cinza Claro | `#E8E8E6` |
| Tipografia Títulos | Playfair Display (serif) |
| Tipografia Corpo | Inter (sans-serif) |

---

## 1. Stack Tecnológica Recomendada

### Frontend Mobile
**React Native + Expo**

Justificativa:
- Único codebase para iOS e Android
- Expo simplifica build, OTA updates e assets (PDF, áudio, imagem)
- Grande ecossistema de libs (expo-av para áudio, expo-document-picker para PDF)
- Vibecoding com ferramentas como Cursor/Lovable é muito mais produtivo em JS/TS do que Flutter (Dart)
- Custo zero para publicar na Play Store (uma vez) e App Store ($99/ano)

### Backend / BaaS
**Supabase**

Justificativa:
- PostgreSQL gerenciado (relações reais, não NoSQL)
- Auth nativo (email/senha, magic link)
- Storage nativo para PDFs, imagens e áudios
- Row Level Security (RLS) para controle de permissões por cargo
- Plano free generoso: 500MB DB, 1GB storage, 50MB file upload
- Sem vendor lock-in (é open source e self-hostável)

### Extras
- **Expo Notifications** → push notifications para boletim e escalas
- **React Query (TanStack Query)** → cache e sync de dados
- **Zustand** → state management leve
- **React Native Paper** → componentes UI com Material Design 3

---

## 2. Arquitetura de Banco de Dados

### Diagrama de Entidades

```
members (1) ──< worship_team_roles (N)
members (1) ──< class_members (N) >── (1) ebd_classes
members (1) ──< attendance_records (N) >── (1) attendance_sessions
members (1) ──< worship_scale_slots (N) >── (1) worship_scales
worship_scales (N) >── (1) services
worship_scales (1) ──< scale_songs (N) >── (1) songs
```

---

### Tabelas

#### `members`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id  UUID REFERENCES auth.users(id) -- link com login
full_name     TEXT NOT NULL
birth_date    DATE
role          TEXT CHECK (role IN ('pastor','lider','membro','visitante'))
phone         TEXT
photo_url     TEXT  -- Supabase Storage
email         TEXT
active        BOOLEAN DEFAULT true
created_at    TIMESTAMPTZ DEFAULT now()
```

#### `ebd_classes`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
name          TEXT NOT NULL  -- ex: "Juniores", "Adultos"
teacher_id    UUID REFERENCES members(id)
description   TEXT
active        BOOLEAN DEFAULT true
created_at    TIMESTAMPTZ DEFAULT now()
```

#### `class_members`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
class_id      UUID REFERENCES ebd_classes(id) ON DELETE CASCADE
member_id     UUID REFERENCES members(id) ON DELETE CASCADE
UNIQUE(class_id, member_id)
```

#### `attendance_sessions`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
class_id      UUID REFERENCES ebd_classes(id)
session_date  DATE NOT NULL
notes         TEXT
created_by    UUID REFERENCES members(id)
created_at    TIMESTAMPTZ DEFAULT now()
UNIQUE(class_id, session_date)
```

#### `attendance_records`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id    UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE
member_id     UUID REFERENCES members(id)
present       BOOLEAN DEFAULT false
```

#### `bulletin_posts`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
title         TEXT NOT NULL
body          TEXT
image_url     TEXT  -- Supabase Storage
published_at  TIMESTAMPTZ DEFAULT now()
author_id     UUID REFERENCES members(id)
pinned        BOOLEAN DEFAULT false
```

#### `events`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
title         TEXT NOT NULL
description   TEXT
event_type    TEXT CHECK (event_type IN ('culto','congresso','reuniao','aniversario','outro'))
starts_at     TIMESTAMPTZ NOT NULL
ends_at       TIMESTAMPTZ
location      TEXT
created_by    UUID REFERENCES members(id)
```

#### `services` (Cultos)
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
name          TEXT NOT NULL  -- ex: "Culto de Domingo Manhã"
service_type  TEXT  -- ex: "domingo", "jovens", "midweek"
scheduled_at  TIMESTAMPTZ NOT NULL
theme         TEXT
preacher_id   UUID REFERENCES members(id)
notes         TEXT
created_at    TIMESTAMPTZ DEFAULT now()
```

#### `worship_scales`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
service_id    UUID REFERENCES services(id) ON DELETE CASCADE
name          TEXT NOT NULL  -- ex: "Escala Louvor - 22/06"
notes         TEXT
created_by    UUID REFERENCES members(id)
created_at    TIMESTAMPTZ DEFAULT now()
```

#### `worship_team_roles`
-- Define quais membros pertencem à equipe de louvor e qual função exercem
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
member_id     UUID REFERENCES members(id)
function      TEXT CHECK (function IN ('vocal','instrumentista','som','midia'))
instrument    TEXT  -- ex: "Violão", "Teclado", "Bateria"
active        BOOLEAN DEFAULT true
UNIQUE(member_id)
```

#### `worship_scale_slots`
-- Cada "vaga" de uma escala vinculada a um membro
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
scale_id      UUID REFERENCES worship_scales(id) ON DELETE CASCADE
member_id     UUID REFERENCES members(id)
function      TEXT CHECK (function IN ('vocal','instrumentista','som','midia'))
confirmed     BOOLEAN DEFAULT null  -- null=pendente, true=confirmado, false=recusado
```

#### `songs`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
title         TEXT NOT NULL
artist        TEXT
key           TEXT  -- tom musical: "C", "G", "Am"
lyrics_url    TEXT  -- Supabase Storage (PDF ou imagem)
chords_url    TEXT  -- Supabase Storage (PDF ou imagem)
audio_url     TEXT  -- Supabase Storage ou link externo (YouTube/Spotify)
notes         TEXT
created_by    UUID REFERENCES members(id)
created_at    TIMESTAMPTZ DEFAULT now()
```

#### `song_voice_parts`
-- Divisão de vozes por música
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
song_id       UUID REFERENCES songs(id) ON DELETE CASCADE
voice_type    TEXT CHECK (voice_type IN ('soprano','contralto','tenor','baixo','geral'))
audio_url     TEXT  -- Supabase Storage ou link externo
notes         TEXT
```

#### `scale_songs`
-- Músicas de uma escala (ordenadas)
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
scale_id      UUID REFERENCES worship_scales(id) ON DELETE CASCADE
song_id       UUID REFERENCES songs(id)
order_index   INT DEFAULT 0
notes         TEXT  -- ex: "Abrir com essa música"
```

---

## 3. Controle de Permissões (RLS)

| Ação | pastor | lider | membro | visitante |
|---|---|---|---|---|
| Ler boletim/calendário | ✅ | ✅ | ✅ | ✅ |
| Criar/editar posts | ✅ | ✅ | ❌ | ❌ |
| Gerenciar membros | ✅ | ✅ | ❌ | ❌ |
| Criar culto/escala | ✅ | ✅ | ❌ | ❌ |
| Ver própria escala | ✅ | ✅ | ✅ | ❌ |
| Gerenciar repertório | ✅ | ✅ | ✅* | ❌ |
| Fazer chamada EBD | ✅ | ✅ | ❌ | ❌ |

*membros da equipe de louvor podem adicionar músicas

---

## 4. User Flow — Líder Criando Escala de Louvor

```
[1] HOME
    └─> Aba "Cultos"

[2] LISTA DE CULTOS
    └─> Botão "+ Novo Culto"

[3] CRIAR CULTO
    ├─ Nome: "Culto de Domingo"
    ├─ Data/Hora: 22/06/2026 10:00
    ├─ Tema: "A Fé que Vence"
    ├─ Pregador: (selecionar membro)
    └─> "Salvar" → volta para Lista de Cultos

[4] CULTO CRIADO — Detalhe do Culto
    └─> Botão "+ Criar Escala de Louvor"

[5] NOVA ESCALA
    ├─ Nome: "Escala - Dom 22/06"
    └─> "Criar" → vai para Gerenciar Escala

[6] GERENCIAR ESCALA
    ├─ Seção "Equipe"
    │    └─> "+ Adicionar Membro"
    │         ├─ Buscar na lista da equipe de louvor
    │         ├─ Selecionar função (Vocal / Instrumentista / Som / Mídia)
    │         └─> Confirmar
    │
    └─ Seção "Repertório"
         └─> "+ Adicionar Música"
              ├─ [Opção A] Buscar no repertório cadastrado
              │    └─ Selecionar música → define ordem → OK
              └─ [Opção B] Cadastrar nova música
                   ├─ Título + Artista
                   ├─ Upload Letra (PDF/Imagem) 
                   ├─ Upload Cifra (PDF/Imagem)
                   ├─ Link/Upload Áudio (guia)
                   ├─ Divisão de Vozes (opcional)
                   └─> Salvar → música aparece na escala

[7] ESCALA FINALIZADA
    └─> Botão "Notificar Equipe" → push notification para escalados

[8] MEMBRO ESCALADO (perspectiva do músico)
    ├─ Recebe notificação: "Você foi escalado para Dom 22/06"
    ├─ Abre detalhe da escala
    ├─ Vê as músicas + links de letra/cifra/áudio
    └─> Confirma ou recusa presença
```

---

## 5. Estrutura de Telas (Navigation)

```
App
├── Auth
│   ├── Login
│   └── (Admin cria contas — sem auto-register público)
│
└── Main (Bottom Tab Navigator)
    ├── 🏠 Home
    │   ├── Próximos eventos
    │   ├── Boletim recente
    │   └── Minha próxima escala
    │
    ├── 📋 Membros (lider+)
    │   ├── Lista de Membros
    │   ├── Detalhe/Editar Membro
    │   └── EBD
    │       ├── Lista de Classes
    │       ├── Detalhe da Classe
    │       └── Chamada Digital
    │
    ├── 📅 Agenda
    │   ├── Calendário
    │   ├── Boletim (Feed)
    │   └── Detalhe do Evento/Post
    │
    ├── 🎵 Cultos
    │   ├── Lista de Cultos
    │   ├── Detalhe do Culto
    │   ├── Gerenciar Escala
    │   └── Repertório
    │       ├── Lista de Músicas
    │       ├── Detalhe da Música
    │       └── Adicionar Música
    │
    └── 👤 Perfil
        ├── Meus dados
        └── Minhas escalas
```

---

## 6. Estimativa de Esforço (Vibecoding)

| Módulo | Complexidade | Estimativa |
|---|---|---|
| Setup Expo + Supabase + Auth | Baixa | 1 dia |
| Módulo Membros + EBD | Média | 3-4 dias |
| Módulo Comunicação/Agenda | Baixa | 2 dias |
| Módulo Cultos + Escalas (core) | Alta | 5-6 dias |
| Módulo Repertório (upload/viewer) | Alta | 3-4 dias |
| Push Notifications | Média | 1-2 dias |
| Polimento UI + testes | Média | 3 dias |
| **Total estimado** | | **~18-20 dias** |

> Com Cursor AI + vibecoding, reduz em ~40%. Estimativa real: **10-12 dias de trabalho focado**.

---

## 7. Dependências NPM Principais

```json
{
  "expo": "~51.0.0",
  "expo-router": "~3.5.0",
  "@supabase/supabase-js": "^2.x",
  "react-native-paper": "^5.x",
  "react-query": "^5.x",
  "zustand": "^4.x",
  "expo-document-picker": "~11.x",
  "expo-image-picker": "~15.x",
  "expo-av": "~14.x",
  "expo-notifications": "~0.28.x",
  "react-native-pdf": "^6.x",
  "@react-native-community/datetimepicker": "^8.x"
}
```

---

*Gerado em 15/06/2026 — IP Ebenézer App v1.0*
