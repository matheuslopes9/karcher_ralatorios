# 🚀 Kärcher Analytics Platform - Guia Rápido

## ✅ Status Atual

### Backend (Golang) - ✅ PRONTO
- ✅ Autenticação JWT completa (login, refresh, logout)
- ✅ CRUD de usuários com controle de roles
- ✅ Seed do usuário master (admin / UCT3chn0l0gy!@)
- ✅ Middleware de autenticação e autorização por role
- ✅ Migrations do banco de dados (7 tabelas)
- ✅ Audit logs
- ✅ Build compilado com sucesso

### Frontend (Next.js) - ✅ PRONTO
- ✅ Tela de login
- ✅ Dashboard com métricas
- ✅ Página de resultados
- ✅ Página de analytics
- ✅ Página de relatórios
- ✅ Gerenciamento de usuários
- ✅ Perfil e segurança
- ✅ Proteção de rotas com middleware

### Infraestrutura - ✅ PRONTO
- ✅ Docker Compose configurado
- ✅ PostgreSQL configurado
- ✅ Redis configurado
- ✅ Scripts de inicialização

## 🎯 Como Iniciar

### Opção 1: Docker Compose (Recomendado)
```bash
# Windows - duplo clique ou:
start.bat

# Ou manualmente:
docker-compose up -d
```

### Opção 2: Desenvolvimento Local

#### Backend
```bash
cd backend
go mod download
go run cmd/server/main.go
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Credenciais Master

```
Usuário: admin
Senha:   UCT3chn0l0gy!@
Role:    SUPER_ADMIN
```

## 📊 Acessos

- **Backend API:** http://localhost:8080
- **Frontend:** http://localhost:3000
- **Health Check:** http://localhost:8080/health

## 📁 Estrutura Completa

```
karcher_relatorios/
├── backend/                          # Golang
│   ├── cmd/server/main.go           # Entry point
│   ├── internal/
│   │   ├── auth/                    # JWT, bcrypt, middleware, roles
│   │   ├── users/                   # CRUD de usuários
│   │   ├── storage/                 # PostgreSQL + Audit
│   │   ├── seed/                    # Seed do admin master
│   │   ├── models/                  # User, Session, Result, etc
│   │   └── config/                  # Configurações
│   ├── migrations/                  # 7 migrations SQL
│   ├── Dockerfile
│   └── go.mod
│
├── frontend/                         # Next.js 14
│   ├── src/
│   │   ├── app/                     # App Router
│   │   │   ├── login/               # Tela de login
│   │   │   ├── (protected)/         # Rotas protegidas
│   │   │   │   ├── dashboard/
│   │   │   │   ├── results/
│   │   │   │   ├── analytics/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   ├── components/              # AuthGuard, RoleBadge
│   │   └── lib/                     # API, Auth, Types, Store
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml               # PostgreSQL + Redis + Backend + Frontend
├── .env                             # Variáveis de ambiente
├── start.bat                        # Script de inicialização
└── README.md                        # Documentação completa
```

## 🔑 Endpoints da API

### Públicos
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Protegidos (requer JWT)
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/logout` - Logout
- `GET /api/auth/sessions` - Listar sessões
- `PUT /api/auth/me/password` - Trocar senha

#### Usuários (SUPER_ADMIN, ADMIN)
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar (só SUPER_ADMIN)

#### Dashboard & Analytics
- `GET /api/dashboard/overview` - Visão geral
- `GET /api/results` - Listar resultados
- `GET /api/analytics/summary` - Resumo

#### Reports e Export
- `GET /api/reports` - Listar relatórios
- `POST /api/export` - Exportar dados

#### Audit Logs (SUPER_ADMIN)
- `GET /api/audit-logs` - Logs de auditoria

## 👥 Roles e Permissões

| Role | Dashboard | Results | Analytics | Reports | Users | Export | Audit |
|------|-----------|---------|-----------|---------|-------|--------|-------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| ANALYST | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| VIEWER | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🗃️ Banco de Dados

### Tabelas Criadas
1. **users** - Usuários do sistema com roles
2. **sessions** - Refresh tokens e sessões
3. **results** - Resultados do Typebot
4. **answers** - Respostas individuais
5. **analysis_snapshots** - Snapshots de analytics
6. **saved_reports** - Relatórios salvos
7. **audit_logs** - Log completo de auditoria

## 🔒 Segurança

- JWT Access Token: 15 minutos
- JWT Refresh Token: 7 dias
- Senhas: bcrypt com custo 12
- Rate limiting no login (5 tentativas / 15 min)
- Usuário master protegido (não pode ser deletado/desativado)
- Todas as ações registradas em audit logs

## 📝 Próximos Passos (Implementações Futuras)

1. ⏳ Coletor de dados da API Typebot
2. ⏳ Motor de analytics com snapshots automáticos
3. ⏳ Exportadores (CSV, XLSX, JSON, XML, PDF)
4. ⏳ Gráficos com Recharts no frontend
5. ⏳ Server-Sent Events para dados em tempo real
6. ⏳ Deploy em produção (EasyPanel)
7. ⏳ CI/CD com GitHub Actions

## 🐛 Troubleshooting

### Backend não inicia
```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

### Frontend não inicia
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Docker Compose com erro
```bash
docker-compose down -v
docker-compose up -d
```

### Ver logs
```bash
docker-compose logs -f
# ou específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

**Desenvolvido para UC Technology - Kärcher Analytics Platform**
**Acesso restrito e protegido**
