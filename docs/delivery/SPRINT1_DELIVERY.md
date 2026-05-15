# Sprint 1 — Relatório de Entrega
**Integração Backend × Frontend**
Data: 2026-04-18

---

## Escopo Proposto

> Demo completo: cadastro → login → aluno cria despesa → coordenador aprova/reprova → aluno acompanha status

---

## O que foi entregue ✅

### 1. Cadastro do Coordenador com CONVITE2026
- Formulário em `/register-coordinator` integrado com `POST /v1/auth/register`
- Validação local de senha (mínimo 8 chars, maiúscula, número, especial)
- Backend valida o código `CONVITE2026` antes de criar o usuário
- Redireciona para `/login` após sucesso
- Link de navegação adicionado na tela de login

### 2. Login (Coordenador e Aluno)
- Tela de login integrada com `POST /v1/auth/login`
- Token JWT salvo em `localStorage`
- Redirecionamento por perfil: coordenador → `/dashboard/coordinator`, aluno → `/dashboard/student`
- Tratamento de erros (credenciais inválidas, servidor indisponível)

### 3. Aluno Cria Despesa → status Pendente
- Dashboard do aluno integrado com `GET /v1/me` e `GET /v1/expenses`
- Modal "Nova Solicitação" integrado com `POST /v1/expenses`
- Despesa criada aparece imediatamente na lista com badge **Pendente**
- Mapeamento de categoria → topic (INSCRICAO / PASSAGEM / HOSPEDAGEM)

### 4. Coordenador Aprova / Reprova
- Dashboard do coordenador carrega despesas por aba via `GET /v1/expenses?status=...`
- Botão **Aprovar** → `PATCH /v1/expenses/{id}/status` com `APROVADO`
- Botão **Rejeitar** → `PATCH /v1/expenses/{id}/status` com `REJEITADO`
- Despesa move de aba em tempo real após a decisão
- Fix de CORS aplicado: método `PATCH` adicionado ao middleware do backend

### 5. Aluno Acompanha Status Atualizado
- Lista exibe badge colorido por status (Pendente / Aprovado / Rejeitado)
- Filtros por status funcionais
- Botão "Atualizar" recarrega a lista via API sem recarregar a página

---

## O que não foi entregue ❌

### Fora do escopo da Sprint 1

| Item | Motivo |
|------|--------|
| Cadastro de aluno via frontend | Formulário `/register-student` tem TODO, não chama a API — aluno entra via seed/banco |
| Motivo de rejeição salvo | Campo coletado no modal mas descartado — backend não tem o campo no modelo |
| Projetos carregados via API | Lista hardcoded no modal — backend tem modelo `Project` mas sem endpoint `GET /v1/projects` |
| Atualização de status em tempo real | Requer reload manual ou clique no botão atualizar — sem WebSocket ou polling automático |
| Refresh token | Sessão expira em 24h sem renovação automática |

---

## Credenciais para o Demo

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Aluno | aluno@test.com | Test@1234 |
| Coordenador | cadastrar via `/register-coordinator` com `CONVITE2026` | — |

---

## Endpoints Integrados

| Método | Rota | Usado em |
|--------|------|----------|
| `POST` | `/v1/auth/register` | Cadastro coordenador |
| `POST` | `/v1/auth/login` | Login |
| `GET` | `/v1/me` | Carregar perfil (ambos dashboards) |
| `GET` | `/v1/expenses` | Listar despesas (ambos dashboards) |
| `GET` | `/v1/expenses?status=` | Filtrar por aba (coordenador) |
| `POST` | `/v1/expenses` | Criar despesa (aluno) |
| `GET` | `/v1/expenses/{id}` | Modal de detalhe (coordenador) |
| `PATCH` | `/v1/expenses/{id}/status` | Aprovar / Rejeitar (coordenador) |
