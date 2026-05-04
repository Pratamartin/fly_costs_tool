# Sprint 2 — Relatório de Entrega
**Gestão Administrativa, Orçamentos e Armazenamento (R2)**
Data: 2026-05-03

---

## Escopo Proposto

> Foco em funcionalidades administrativas: Dashboard do Administrador, controle de orçamento de projetos, detalhamento de custos (discriminação) e upload de memorandos.

---

## O que foi entregue ✅

### 1. Dashboard do Administrador
- Visão geral com métricas de gastos totais e projetos financiadores mais ativos através de gráficos.
- Listagem e gerenciamento completo de todos os projetos.
- Listagem e auditoria de todas as despesas do sistema.
- Navegação centralizada via `AdminSidebar` com controle de logout.

### 2. Gestão de Projetos e Orçamentos
- CRUD completo de projetos integrado com endpoints dedicados.
- Definição de orçamento por projeto com validação de saldo disponível.
- Atribuição de despesas a projetos específicos (Status: **Em Processamento**).
- Discriminação de custos (Cost Breakdown) por subcategorias (Passagem, Hospedagem, Inscrição).
- Bloqueio de novas operações de custo em projetos arquivados.

### 3. Upload de Memorandos (Cloudflare R2)
- Integração com Cloudflare R2 para armazenamento persistente de arquivos PDF.
- Middleware de upload no backend para validação de tamanho e tipo de arquivo.
- Upload de memorando na criação da despesa pelo aluno.
- Visualização e download de memorandos via URLs assinadas visando maior segurança

### 4. Refinamento do Fluxo de Despesas
- Novos campos detalhados: Cidade, Estado, País, Data de Ida e Data de Volta.
- Motivo de rejeição obrigatório ao negar uma despesa, com inserção rápida de motivos comuns.
- Validação rigorosa de datas e status na camada de serviço.
- Novo status: `EM_PROCESSAMENTO` (etapa entre aprovação e liquidação final).

### 5. Analytics e Responsividade Mobile
- Endpoint de Analytics para identificar projetos com maior consumo de verba (`top-projects`).
- Gráficos no frontend (Dashboard Admin) integrados em tempo real com a API.
- **Melhorias Críticas em Mobile:**
  - Implementação de novos componentes de Sidebar (`AdminSidebar`, `CoordinatorSidebar`, `StudentSidebar`) otimizados para telas menores.
  - Navegação lateral colapsável para maximizar o espaço útil em dispositivos móveis.
  - Refatoração completa dos dashboards para garantir que tabelas de despesas e cards de métricas sejam legíveis e funcionais em smartphones.
  - Ajustes de padding e tipografia para consistência visual entre web e mobile.

### 6. Testes de Integração e Unidade
- Cobertura de testes aumentada: unitários para serviços de orçamento, analytics e projetos.
- Novo suite de testes de integração para o fluxo completo da Sprint 2 (#92).
- Mock de storage (R2) configurado para garantir sucesso nos testes de CI.

---

## O que não foi entregue ❌

### Fora do escopo da Sprint 2

| Item | Motivo |
|------|--------|
| Edição de despesas após criação | Funcionalidade repriorizada em favor da discriminação de custos por categoria |
| Refresh token | Sessão expira em 24h sem renovação automática (mesmo status da Sprint 1) |
| Notificações por e-mail | Requer serviço de SMTP externo ainda não configurado no ambiente |
| Exportação de relatórios (CSV/PDF) | Interface administrativa exibe dados, mas exportação física ainda não foi cogitada como uma demanda real |


---

## Credenciais para o Demo

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@test.com | Test@1234 |
| Coordenador | coordenador@test.com | Test@1234 |
| Aluno | aluno@test.com | Test@1234 |

---

## Endpoints Integrados

| Método | Rota | Usado em |
|--------|------|----------|
| `GET` | `/v1/analytics/admin-dashboard` | Métricas gerais Admin |
| `GET` | `/v1/analytics/top-projects` | Gráfico de projetos Admin |
| `GET` | `/v1/projects` | Listar projetos |
| `POST` | `/v1/projects` | Criar projeto |
| `PATCH` | `/v1/expenses/{id}/assign-project` | Vincular despesa a projeto |
| `POST` | `/v1/expenses/{id}/cost-breakdown` | Discriminar custos (Subcategorias) |
| `POST` | `/v1/expenses/{id}/memorandum` | Upload de PDF do memorando |
| `GET` | `/v1/expenses/{id}/memorandum/download` | Obter link seguro com expiração de 1h do memorando |
