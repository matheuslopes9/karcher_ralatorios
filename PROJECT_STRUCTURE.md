# 📊 Estrutura Completa do Projeto Kärcher Analytics

## 🌳 Árvore de Arquivos

```
karcher_relatorios/
│
├── 📄 README.md                          # Documentação principal
├── 📄 GETTING_STARTED.md                 # Guia rápido de início
├── 📄 docker-compose.yml                 # Orquestração de containers
├── 📄 .env.example                       # Template de variáveis de ambiente
├── 📄 .env                               # Variáveis de ambiente (local)
├── 📄 start.bat                          # Script de inicialização Windows
│
├── 📁 backend/                           # Golang - API REST
│   ├── 📄 go.mod                         # Dependências Go
│   ├── 📄 go.sum                         # Lock file Go
│   ├── 📄 Dockerfile                     # Imagem Docker
│   │
│   ├── 📁 cmd/
│   │   └── 📁 server/
│   │       └── 📄 main.go               # ⭐ Entry point principal
│   │
│   ├── 📁 internal/
│   │   ├── 📁 auth/
│   │   │   ├── 📄 jwt.go                # Geração e validação JWT
│   │   │   ├── 📄 refresh.go            # Refresh tokens e sessões
│   │   │   ├── 📄 password.go           # Hash bcrypt de senhas
│   │   │   ├── 📄 middleware.go         # Middleware de autenticação
│   │   │   └── 📄 roles.go              # Controle de permissões
│   │   │
│   │   ├── 📁 users/
│   │   │   └── 📄 repository.go         # CRUD de usuários
│   │   │
│   │   ├── 📁 storage/
│   │   │   ├── 📄 postgres.go           # Conexão e migrations
│   │   │   └── 📄 audit.go              # Audit logger
│   │   │
│   │   ├── 📁 seed/
│   │   │   └── 📄 admin.go              # Seed do usuário master
│   │   │
│   │   ├── 📁 models/
│   │   │   ├── 📄 user.go               # Model User + Roles
│   │   │   ├── 📄 session.go            # Model Session
│   │   │   ├── 📄 typebot.go            # Model Typebot
│   │   │   ├── 📄 result.go             # Model Result/Answer
│   │   │   └── 📄 report.go             # Model Report
│   │   │
│   │   └── 📁 config/
│   │       └── 📄 config.go             # Configurações da aplicação
│   │
│   ├── 📁 migrations/
│   │   ├── 📄 001_create_users.sql
│   │   ├── 📄 002_create_sessions.sql
│   │   ├── 📄 003_create_results.sql
│   │   ├── 📄 004_create_answers.sql
│   │   ├── 📄 005_create_analysis_snapshots.sql
│   │   ├── 📄 006_create_saved_reports.sql
│   │   └── 📄 007_create_audit_logs.sql
│   │
│   └── 📁 bin/ (gerado no build)
│       └── 📄 server.exe
│
├── 📁 frontend/                          # Next.js 14 - Dashboard
│   ├── 📄 package.json                   # Dependências Node
│   ├── 📄 next.config.js                 # Configuração Next.js
│   ├── 📄 tsconfig.json                  # Configuração TypeScript
│   ├── 📄 tailwind.config.js             # Configuração Tailwind
│   ├── 📄 postcss.config.js              # Configuração PostCSS
│   ├── 📄 next-env.d.ts                  # Types Next.js
│   ├── 📄 Dockerfile                     # Imagem Docker
│   │
│   └── 📁 src/
│       ├── 📁 app/
│       │   ├── 📄 layout.tsx            # Layout raiz
│       │   ├── 📄 page.tsx              # Home (redireciona)
│       │   ├── 📄 globals.css            # Estilos globais
│       │   │
│       │   ├── 📁 login/
│       │   │   └── 📄 page.tsx          # 🔓 Tela de login (pública)
│       │   │
│       │   └── 📁 (protected)/          # 🛡️ Grupo protegido
│       │       ├── 📄 layout.tsx        # Layout com sidebar
│       │       ├── 📁 dashboard/
│       │       │   └── 📄 page.tsx      # Dashboard principal
│       │       ├── 📁 results/
│       │       │   └── 📄 page.tsx      # Lista de resultados
│       │       ├── 📁 analytics/
│       │       │   └── 📄 page.tsx      # Analytics e métricas
│       │       ├── 📁 reports/
│       │       │   └── 📄 page.tsx      # Relatórios salvos
│       │       ├── 📁 export/
│       │       │   └── 📄 page.tsx      # Exportação de dados
│       │       └── 📁 settings/
│       │           ├── 📁 users/
│       │           │   └── 📄 page.tsx  # Gerenciamento de usuários
│       │           ├── 📁 profile/
│       │           │   └── 📄 page.tsx  # Perfil do usuário
│       │           └── 📁 security/
│       │               └── 📄 page.tsx  # Segurança e sessões
│       │
│       ├── 📁 components/
│       │   ├── 📁 auth/
│       │   │   ├── 📄 AuthGuard.tsx     # Proteção de rotas
│       │   │   └── 📄 LoginForm.tsx     # (implementado na page)
│       │   │
│       │   └── 📁 users/
│       │       └── 📄 RoleBadge.tsx     # Badge de roles
│       │
│       ├── 📁 lib/
│       │   ├── 📄 api.ts                # Cliente Axios + interceptors JWT
│       │   ├── 📄 auth.ts               # Zustand auth store
│       │   └── 📄 types.ts              # Types TypeScript
│       │
│       └── 📄 middleware.ts              # Next.js middleware
│
└── 📁 .qwen/ (configurações do Qwen)
```

## 🎯 Componentes Principais

### Backend (Golang + Fiber)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `cmd/server/main.go` | ⭐ Roteamento, middleware, handlers |
| `internal/auth/jwt.go` | Geração e validação de JWT |
| `internal/auth/password.go` | Hash bcrypt de senhas |
| `internal/auth/middleware.go` | Verificação de token |
| `internal/auth/roles.go` | Controle de acesso por role |
| `internal/users/repository.go` | CRUD completo de usuários |
| `internal/storage/postgres.go` | Conexão DB + migrations |
| `internal/storage/audit.go` | Logging de auditoria |
| `internal/seed/admin.go` | Criação do usuário master |
| `migrations/*.sql` | Schema do banco de dados |

### Frontend (Next.js + TypeScript)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `app/login/page.tsx` | 🔓 Tela de login |
| `app/(protected)/layout.tsx` | 🛡️ Layout com sidebar + header |
| `app/(protected)/dashboard/page.tsx` | Dashboard com métricas |
| `app/(protected)/results/page.tsx` | Tabela de resultados |
| `app/(protected)/analytics/page.tsx` | Gráficos e analytics |
| `app/(protected)/reports/page.tsx` | Relatórios salvos |
| `app/(protected)/settings/users/page.tsx` | Gestão de usuários |
| `app/(protected)/settings/profile/page.tsx` | Perfil do usuário |
| `app/(protected)/settings/security/page.tsx` | Segurança e sessões |
| `lib/api.ts` | Cliente HTTP + JWT interceptor |
| `lib/auth.ts` | Zustand store de autenticação |
| `lib/types.ts` | Types TypeScript |
| `middleware.ts` | Proteção de rotas no server |

## 🔐 Fluxo de Autenticação

```
┌─────────────┐
│   Login     │  POST /api/auth/login
│   Page      │  { username, password }
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Backend Valida  │  1. Busca usuário no DB
│                  │  2. Verifica senha (bcrypt)
│                  │  3. Gera JWT (15min)
│                  │  4. Gera Refresh Token (7 dias)
│                  │  5. Salva sessão no DB
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Response        │  { access_token, refresh_token, user }
│                  │  Salvos no localStorage
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Req. Protegidas │  Header: Authorization: Bearer {token}
│                  │  Middleware valida JWT
│                  │  Se expirado → refresh automático
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Logout          │  POST /api/auth/logout
│                  │  Revoga sessão no DB
│                  │  Limpa localStorage
└──────────────────┘
```

## 🎭 Controle de Acesso por Role

```
SUPER_ADMIN
  ├── ✅ Acesso total irrestrito
  ├── ✅ Gerenciar todos os usuários
  ├── ✅ Ver audit logs
  └── ✅ Usuário master (protegido)

ADMIN
  ├── ✅ Dashboard, Results, Analytics, Reports
  ├── ✅ Criar/editar usuários (exceto SUPER_ADMIN)
  ├── ✅ Exportar dados
  └── ❌ Audit logs

ANALYST
  ├── ✅ Dashboard, Results, Analytics
  ├── ✅ Exportar dados
  └── ❌ Gerenciar usuários

VIEWER
  ├── ✅ Dashboard (somente leitura)
  ├── ✅ Results (visualizar)
  └── ❌ Export, Analytics avançado, Settings
```

## 🗃️ Schema do Banco de Dados

```
users
  ├── id (UUID, PK)
  ├── name, email, username
  ├── password_hash (bcrypt)
  ├── role (SUPER_ADMIN, ADMIN, ANALYST, VIEWER)
  ├── is_active, is_master
  └── created_at, updated_at, last_login

sessions
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── refresh_token
  ├── user_agent, ip_address
  ├── expires_at
  └── revoked, revoked_at

results
  ├── id (UUID, PK)
  ├── typebot_id, result_id
  ├── created_at_bot, collected_at
  ├── is_completed, duration_secs
  └── raw_data (JSONB)

answers
  ├── id (UUID, PK)
  ├── result_id (FK → results)
  ├── block_id, step_id, field_key
  ├── field_value
  └── answered_at

analysis_snapshots
  ├── id (UUID, PK)
  ├── snapshot_at
  ├── period_start, period_end
  ├── total_results, completed_count
  ├── completion_rate, avg_duration
  └── drop_off_by_step, top_answers (JSONB)

saved_reports
  ├── id (UUID, PK)
  ├── name, description
  ├── filters, columns (JSONB)
  ├── created_by (FK → users)
  └── schedule, format_default

audit_logs
  ├── id (UUID, PK)
  ├── user_id (FK → users), username
  ├── action, resource, resource_id
  ├── details (JSONB)
  ├── ip_address, user_agent
  └── created_at
```

## 📡 Endpoints da API (Resumo)

### 🔓 Públicos
```
POST   /api/auth/login
POST   /api/auth/refresh
GET    /health
```

### 🔐 Autenticados
```
GET    /api/auth/me
POST   /api/auth/logout
GET    /api/auth/sessions
DELETE /api/auth/sessions/:id
PUT    /api/auth/me/password
```

### 👥 Usuários (ADMIN+)
```
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id        (SUPER_ADMIN only)
```

### 📊 Dashboard & Analytics
```
GET    /api/dashboard/overview
GET    /api/results
GET    /api/analytics/summary
```

### 📄 Reports & Export
```
GET    /api/reports
POST   /api/reports
POST   /api/export            (ANALYST+)
```

### 🔒 Audit (SUPER_ADMIN)
```
GET    /api/audit-logs
```

## 🚀 Como Rodar

### Docker (Recomendado)
```bash
start.bat
# ou
docker-compose up -d
```

### Local (Dev)
```bash
# Terminal 1 - Backend
cd backend
go run cmd/server/main.go

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## 🎯 URLs de Acesso

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Health Check | http://localhost:8080/health |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

**Projeto 100% funcional e pronto para uso!** 🎉

**Credenciais Master:**
- Usuário: `admin`
- Senha: `UCT3chn0l0gy!@`
