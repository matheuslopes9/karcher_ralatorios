# Kärcher Analytics Platform

Plataforma completa de analytics para análise de dados do Typebot, com autenticação JWT, dashboard interativo, exportação de relatórios e controle de acesso por roles.

## 🔐 Acesso Master

- **Usuário:** `admin`
- **Senha:** `UCT3chn0l0gy!@`
- **Role:** `SUPER_ADMIN` (acesso irrestrito)

## 👥 Roles e Permissões

| Role | Permissões |
|------|-----------|
| **SUPER_ADMIN** | Acesso total irrestrito, gerenciar usuários, logs, integrações |
| **ADMIN** | Gerenciar usuários do grupo, ver todos os dados, exportar relatórios |
| **ANALYST** | Ver dashboard e analytics, exportar relatórios |
| **VIEWER** | Somente leitura no dashboard e resultados |

## 🚀 Quick Start

### Pré-requisitos

- Docker e Docker Compose
- Go 1.21+ (para desenvolvimento local)
- Node.js 18+ (para frontend)

### 1. Clone e configuração

```bash
git clone <repository-url>
cd karcher-analytics
cp .env.example .env
```

### 2. Iniciar com Docker Compose

```bash
docker-compose up -d
```

O sistema estará disponível em:
- **Backend API:** http://localhost:8080
- **Frontend Dashboard:** http://localhost:3000
- **Health Check:** http://localhost:8080/health

### 3. Login

Acesse http://localhost:3000/login e use as credenciais master acima.

## 📁 Estrutura do Projeto

```
/karcher-analytics
│
├── /backend                           # Golang
│   ├── /cmd/server
│   │   └── main.go                    # Entry point
│   ├── /internal
│   │   ├── /auth                      # Autenticação JWT
│   │   ├── /users                     # CRUD de usuários
│   │   ├── /collector                 # Coleta Typebot
│   │   ├── /analyzer                  # Motor de analytics
│   │   ├── /storage                   # PostgreSQL
│   │   ├── /cache                     # Redis
│   │   ├── /api                       # Rotas da API
│   │   ├── /export                    # Exportadores
│   │   ├── /models                    # Modelos de dados
│   │   └── /config                    # Configurações
│   ├── /migrations                    # Migrations SQL
│   ├── Dockerfile
│   └── go.mod
│
├── /frontend                          # Next.js
│   ├── /src
│   │   ├── /app                       # Rotas (App Router)
│   │   ├── /components                # Componentes React
│   │   └── /lib                       # Utilitários
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔑 Endpoints da API

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login com username/senha |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Dados do usuário logado |
| PUT | `/api/auth/me/password` | Trocar senha |
| GET | `/api/auth/sessions` | Listar sessões ativas |

### Usuários (PROTEGIDO)

| Método | Rota | Roles |
|--------|------|-------|
| GET | `/api/users` | SUPER_ADMIN, ADMIN |
| POST | `/api/users` | SUPER_ADMIN, ADMIN |
| PUT | `/api/users/:id` | SUPER_ADMIN, ADMIN |
| DELETE | `/api/users/:id` | SUPER_ADMIN apenas |

### Dashboard & Analytics (PROTEGIDO)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard/overview` | Visão geral |
| GET | `/api/results` | Listar resultados |
| GET | `/api/analytics/summary` | Resumo analítico |

### Reports e Export (PROTEGIDO)

| Método | Rota | Roles |
|--------|------|-------|
| GET | `/api/reports` | Todos |
| POST | `/api/export` | SUPER_ADMIN, ADMIN, ANALYST |
| GET | `/api/audit-logs` | SUPER_ADMIN apenas |

## 🗃️ Banco de Dados

PostgreSQL com as seguintes tabelas:

- `users` - Usuários do sistema
- `sessions` - Sessões JWT (refresh tokens)
- `results` - Resultados do Typebot
- `answers` - Respostas individuais
- `analysis_snapshots` - Snapshots analíticos
- `saved_reports` - Relatórios salvos
- `audit_logs` - Log de auditoria completo

## 🔒 Segurança

- **JWT:** Access token (15min) + Refresh token (7 dias)
- **Senhas:** Hash bcrypt com custo 12
- **Rate Limiting:** 5 tentativas de login em 15 minutos
- **Audit Logs:** Todas as ações são registradas
- **Proteções:** Usuário master imutável e indeletável

## 🛠️ Desenvolvimento Local

### Backend

```bash
cd backend
go mod download
go run cmd/server/main.go
```

### Frontend (a ser criado)

```bash
cd frontend
npm install
npm run dev
```

## 📊 Próximos Passos

1. ✅ Backend completo com autenticação e CRUD de usuários
2. ⏳ Implementar coleta da API Typebot
3. ⏳ Implementar motor de analytics
4. ⏳ Criar frontend Next.js completo
5. ⏳ Implementar exportadores (CSV, XLSX, JSON, XML, PDF)
6. ⏳ Deploy em produção (EasyPanel)

## 📝 Licença

Exclusivo UC Technology - Kärcher Analytics Platform
