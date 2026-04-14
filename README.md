# Kärcher Analytics Platform

Plataforma de analytics desenvolvida pela **UC Technology** para a **Kärcher Brasil**, com o objetivo de coletar, visualizar e exportar dados de atendimento captados via **Typebot**.

O sistema coleta automaticamente as respostas do bot (nome, modelo, número de série, código de serviço, etc.), exibe métricas em tempo real e permite exportação de relatórios em PDF, Excel e CSV.

---

## Acesso

| Campo | Valor |
|-------|-------|
| **URL (Produção)** | EasyPanel — karcher-frontend |
| **Usuário master** | `admin` |
| **Senha master** | `UCT3chn0l0gy!@` |
| **Role** | `SUPER_ADMIN` (acesso irrestrito, não aparece na lista de usuários) |

---

## Funcionalidades

### Dashboard
- Métricas em tempo real: total de respostas, completados, incompletos, taxa de conclusão
- Gráfico de volume por dia
- Campos mais respondidos com barras de progresso
- Funil de conversão (iniciaram → completaram → abandonaram)
- Filtros de período: Hoje / 7 dias / 30 dias
- Botão de atualização manual

### Relatórios
- Relatório gerado automaticamente ao acessar a página
- Seletor de período: 7 dias / 30 dias / 90 dias / Personalizado (date picker)
- Visualização de KPIs, gráfico de barras, campos mais respondidos
- Tabela de detalhamento paginada (10 por página)
- Exportação em **PDF**, **Excel (XLSX)** e **CSV**

### Dados Coletados
- Listagem paginada (15 por página) dos registros captados pelo Typebot
- Cards expansíveis mostrando todos os campos da resposta
- Busca por valor de campo (nome, e-mail, etc.)
- Filtro por status (completado / incompleto)

### Usuários
- Cadastro de usuários com dois níveis de acesso: **Administrador** e **Leitura**
- Geração automática de senha com cópia para clipboard
- Ativar / desativar usuários
- Usuário master oculto da listagem

---

## Tipos de Conta

| Tipo | Acesso |
|------|--------|
| **Administrador** | Acesso total ao sistema, gerenciamento de usuários |
| **Leitura** | Somente visualização (dashboard, relatórios, dados coletados) |

> O tipo **SUPER_ADMIN** existe internamente para o usuário master e não pode ser criado via interface.

---

## Arquitetura

```
karcher_relatorios/
│
├── backend/                        # API em Go (Fiber)
│   ├── cmd/server/main.go          # Entry point, rotas e servidor
│   ├── internal/
│   │   ├── auth/                   # JWT, bcrypt, middleware de autenticação
│   │   ├── collector/              # Coleta periódica da API Typebot
│   │   ├── config/                 # Variáveis de ambiente
│   │   ├── export/                 # Geradores de PDF (maroto), XLSX (excelize), CSV
│   │   ├── models/                 # Modelos de dados (User, etc.)
│   │   ├── results/                # Queries de dashboard, relatório e listagem
│   │   ├── seed/                   # Criação/atualização do usuário master
│   │   ├── storage/                # Conexão PostgreSQL e migrations
│   │   └── users/                  # CRUD de usuários
│   ├── migrations/                 # Arquivos SQL de criação de tabelas
│   ├── Dockerfile
│   └── go.mod
│
├── frontend/                       # Interface em Next.js 14
│   └── src/
│       ├── app/
│       │   ├── login/              # Página de login
│       │   └── (protected)/        # Área autenticada
│       │       ├── layout.tsx      # Sidebar + topbar
│       │       ├── dashboard/      # Página de métricas
│       │       ├── reports/        # Relatório com exportação
│       │       ├── results/        # Dados coletados
│       │       └── settings/users/ # Gerenciamento de usuários
│       ├── lib/
│       │   ├── api.ts              # Axios com interceptor de token
│       │   ├── auth.ts             # Zustand store de autenticação
│       │   └── types.ts            # Interfaces e tipos compartilhados
│       └── middleware.ts           # Redirecionamento de rota raiz
│
└── docker-compose.yml
```

---

## Banco de Dados (PostgreSQL)

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema |
| `sessions` | Refresh tokens ativos |
| `results` | Resultados coletados do Typebot |
| `answers` | Campos/variáveis de cada resultado (nome, modelo, etc.) |
| `schema_migrations` | Controle de migrations já aplicadas |

---

## API — Principais Endpoints

### Públicos
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh` | Renovar token |

### Protegidos (requer `Authorization: Bearer <token>`)
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/auth/me` | Dados do usuário logado |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/dashboard/overview` | KPIs gerais |
| `GET` | `/api/analytics/summary?period=daily\|weekly\|monthly` | Dados do gráfico |
| `GET` | `/api/results?page=1&limit=15&search=&completed=` | Dados coletados paginados |
| `GET` | `/api/reports/summary?period=7d\|30d\|90d\|custom&from=&to=` | Relatório completo |
| `GET` | `/api/export/pdf?period=...` | Download PDF |
| `GET` | `/api/export/xlsx?period=...` | Download Excel |
| `GET` | `/api/export/csv?period=...` | Download CSV |
| `GET` | `/api/users` | Listar usuários (ADMIN+) |
| `POST` | `/api/users` | Criar usuário (ADMIN+) |
| `PUT` | `/api/users/:id` | Atualizar usuário (ADMIN+) |
| `DELETE` | `/api/users/:id` | Excluir usuário (SUPER_ADMIN) |

### Operacional
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/debug/recollect` | Apaga dados e recoleta tudo do Typebot |

---

## Coleta de Dados (Typebot)

O backend coleta dados automaticamente a cada **30 segundos** via `GET /api/v1/typebots/{id}/results`.

- Paginação automática com cursor
- Salva apenas registros novos (verifica por `result_id`)
- Persiste as **variáveis** do bot (campos com nome legível: `nome`, `codigo_servico`, etc.)
- Configurável via variável de ambiente `TYPEBOT_COLLECT_INTERVAL`

---

## Segurança

- **JWT:** Access token com expiração de 15 minutos + Refresh token de 7 dias
- **Bcrypt:** Custo 12 para hash de senhas
- **Rate limiting:** Máximo 5 tentativas de login em 15 minutos
- **Usuário master:** Imutável e indeletável via API, oculto na listagem
- **CORS:** Configurável via `API_CORS_ORIGINS`

---

## Desenvolvimento Local

### Pré-requisitos
- Go 1.26+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
cp .env.example .env   # ajustar variáveis
go mod download
go run cmd/server/main.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse em: `http://localhost:3000`

---

## Deploy (EasyPanel)

O projeto é implantado no **EasyPanel** com dois serviços Docker independentes:

| Serviço | Imagem base | Porta |
|---------|-------------|-------|
| `karcher-backend` | `golang:alpine` | 8080 |
| `karcher-frontend` | `node:18-alpine` | 3000 |

As variáveis de ambiente são injetadas via `--build-arg` no EasyPanel. O banco PostgreSQL e Redis são provisionados como serviços internos da plataforma.

Para forçar nova coleta após deploy: `GET /debug/recollect`

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Go 1.26, Fiber v2, lib/pq |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Banco | PostgreSQL 14 |
| Cache | Redis |
| PDF | maroto v2 |
| Excel | excelize v2 |
| Auth | JWT (golang-jwt/jwt v5) + bcrypt |
| Deploy | Docker, EasyPanel |

---

*Desenvolvido por UC Technology do Brasil · Exclusivo Kärcher Brasil*
