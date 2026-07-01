# fly_costs_tool

**SGDA — Sistema de Gestão de Despesas Acadêmicas**

API REST + Frontend integrados para gerenciamento de solicitações e aprovações de despesas acadêmicas.

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | Next.js 14 (Pages Router), TypeScript, Tailwind CSS |
| **Backend** | Hono, Zod, Prisma, PostgreSQL, Gmail API, Cloudflare R2 |
| **Testes** | Vitest, TestContainers |
| **Infra** | Docker, Docker Compose |

---

## Pré-requisitos

- [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm)
- [Docker](https://www.docker.com/)

---

## Rodando tudo localmente

### Terminal 1 — Banco de dados

```bash
docker compose up -d postgres
```

### Terminal 2 — Backend

```bash
cd backend
nvm install && nvm use
npm install
cp .env.example .env   # configure as variáveis (veja seção Backend)
npx prisma generate
npm run db:migrate
npm run dev
```

API disponível em: `http://localhost:3001`  
Documentação: `http://localhost:3001/reference`

### Terminal 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: `http://localhost:3000`

---

## Backend

### Variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Descrição | Como obter |
|----------|-----------|------------|
| `DATABASE_URL` | URL de conexão com o PostgreSQL | Docker local: `postgresql://user:password@localhost:5432/flycostsdb` · Nuvem: [console.prisma.io](https://console.prisma.io) |
| `JWT_SECRET` | Chave para assinar tokens JWT | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRE_AT` | Tempo de vida do token (segundos) | Ex: `86400` (1 dia), `604800` (1 semana) |
| `JWT_REFRESH_SECRET` | Chave p/ Refresh Token | Gere uma chave diferente (mesmo comando) |
| `JWT_EXPIRES_IN` | Duração do Access Token (segundos) | Ex: `1800` (30m) |
| `REFRESH_TOKEN_EXPIRES_DAYS`| Duração do Refresh Token (dias) | Ex: `14` |
| `R2_ACCESS_KEY_ID` | Chave de acesso do Cloudflare R2 | Painel do Cloudflare (R2) |
| `R2_SECRET_ACCESS_KEY`| Chave secreta do Cloudflare R2 | Painel do Cloudflare (R2) |
| `R2_ENDPOINT` | Endpoint S3-compatible | `https://<account_id>.r2.cloudflarestorage.com` |
| `R2_BUCKET_NAME` | Nome do bucket R2 | Ex: `fly-costs-bucket` |
| `CLEANUP_*` | 5 vars p/ limpeza automática de banco em background | Padrões inseridos na base |
| `GOOGLE_*` | 5 vars de disparo de email (Opcional dev, Obrigatório Prod) | Console do Google Cloud (Ref: PR #214) |

### Scripts do banco de dados

| Comando | Descrição |
|---------|-----------|
| `npx prisma generate` | Gera classes e tipagens |
| `npx prisma format` | Formata e valida o schema |
| `npm run db:migrate` | Cria e aplica migrações (desenvolvimento) |
| `npm run db:deploy` | Aplica migrações pendentes (produção) |
| `npm run db:seed` | Popula o banco com dados pré-definidos |
| `npm run db:reset` | Limpa os dados e reaplica o schema |
| `npm run db:ui` | Abre o Prisma Studio na porta 5555 |

### Testes

Os testes de integração provisionam um banco PostgreSQL efêmero via **Testcontainers** — Docker é obrigatório.

| Comando | Descrição |
|---------|-----------|
| `npm test` | Executa a suíte completa (CI) |
| `npm run test:watch` | Modo watch (desenvolvimento) |
| `npx vitest <arquivo.test.ts>` | Executa um arquivo específico |
| `npm run test:coverage` | Gera relatório de cobertura |

### Observabilidade

Suba as ferramentas de monitoramento via Docker:

```bash
docker compose up prisma-studio pgboss-dashboard -d
```

| Ferramenta | URL | Descrição |
|------------|-----|-----------|
| Prisma Studio | `http://localhost:5555` | Visualizador e editor do banco |
| pg-boss Dashboard | `http://localhost:5001` | Monitoramento de filas e background jobs |

Ou rode o dashboard de jobs localmente:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/flycostsdb" npm run jobs:ui
```

---

## Frontend

### Fluxo de telas

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/login` | Login (Admin, Coordenador e Aluno) |
| `/register-coordinator` | Cadastro do Coordenador |
| `/register-student` | Cadastro do Aluno |
| `/dashboard/student` | Dashboard do Aluno |
| `/dashboard/coordinator` | Dashboard do Coordenador |
| `/dashboard/admin` | Dashboard do Admin |
| `/dashboard/profile` | Perfil unificado (todos os roles) |

### Estrutura de pastas

```
frontend/src/
├── pages/
│   ├── index.tsx
│   ├── login/
│   ├── register-coordinator/
│   ├── register-student/
│   └── dashboard/
│       ├── student/
│       ├── coordinator/
│       ├── admin/
│       │   ├── expenses/
│       │   └── projects/
│       └── profile/
├── components/
│   ├── ModalNovaDespesa.tsx
│   ├── ModalRejeitar.tsx
│   └── ModalCriarProjeto.tsx
└── services/
    ├── expenses/
    ├── projects/
    ├── analytics/
    ├── categories/
    └── user/
```

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor em produção |
| `npm run lint` | Executa o ESLint |

---

## Docker (Frontend isolado)

```bash
cd frontend
docker compose up --build
```

Acesse: `http://localhost:3000`

---

## Extensões VSCode recomendadas

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
- [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)
- [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)
