# Sprint 4 — Relatório de Entrega
**Recuperação de Acesso, Central de Notificações, Relatórios Assíncronos e Dinâmicidade de Formulários e Metadados (R4)**
Data: 2026-05-30

---

## Escopo Proposto

> Foco em robustez arquitetural e experiência do usuário: Implementação de infraestrutura para tarefas assíncronas, centralização de comunicações via notificações in-app e e-mail (Gmail API), além de expandir a flexibilidade do formulário principal de solicitações com suporte a metadados dinâmicos e geolocalizados para Eventos e Artigos.

---

## O que foi entregue ✅

### 1. Emails Transacionais
- Integração com a **Gmail API via OAuth2**, configurada como o provedor global de e-mails do sistema.
- Disparo automático de e-mails para:
    - **Recuperação de Acesso**: Fluxo completo de "Esqueci minha senha" com tokens seguros (SHA-256).
    - **Notificações de Status**: Alunos recebem alertas em casos de Aprovação, Rejeição, Solicitação de Correção ou Conclusão de despesas.
- Interface de redefinição de senha com validação de complexidade de em tempo real.

### 2. Central de Notificações In-App
- Nova infraestrutura de persistência (tabela `Notification`) para registro histórico de eventos do sistema.
- Gatilhos automáticos integrados ao ciclo de vida da despesa (Aprovação, Rejeição, Processamento, Correção e Conclusão).
- Painel flutuante no sidebar com contagem dinâmica de não lidas e gestão de leitura em lote.

### 3. Exportação Assíncrona de Relatórios (PDF + SSE)
- Orquestração de tarefas em background via **pg-boss**, evitando travamentos da API durante gerações pesadas.
- Monitoramento de progresso via **Server-Sent Events (SSE)** com feedback visual imediato ao usuário.
- Geração via stream para o Cloudflare R2 com limite de 2.000 registros por relatório para otimização de memória.

### 4. Metadados e Formulários Dinâmicos
- Validação rigorosa via **JSON Schema (AJV)** para campos de Eventos e Artigos.
- **Melhorias de Usabilidade**:
    - Seletor dinâmico de QUALIS CAPES e integração de dados de geolocalização (capitais e cidades polo brasileiras).
    - Lógica de obrigatoriedade de anexos (Boleto/Invoice/Sugestão de Voo) vinculada à categoria selecionada.
- Motor de pesquisas de preferência armazenado em formato `JSONB` no Postgres.

---
## O que não foi entregue ❌

### Pendente da Sprint 4

| Item | Motivo |
|------|--------|
| **Refresh Token Automático** | A renovação silenciosa do access token via refresh token em background foi postergada para garantir a estabilidade do fluxo de recuperação de acesso. |

---

## Endpoints Integrados

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/auth/forgot-password` | Iniciar recuperação de senha via Gmail |
| `POST` | `/v1/auth/reset-password` | Redefinir senha com token seguro |
| `GET` | `/v1/notifications` | Listagem de notificações do usuário |
| `PATCH` | `/v1/notifications/{id}/read` | Marcar notificação como lida |
| `POST` | `/v1/notifications/mark-all-read` | Marcar todas as notificações como lidas |
| `GET` | `/v1/expenses/reports` | Enfileirar job de geração de PDF |
| `GET` | `/v1/expenses/reports/status/{jobId}` | Stream de progresso do relatório (SSE) |
| `GET` | `/v1/preference-surveys` | Obter esquemas dinâmicos de formulários |

---

## Miscellaneous
- Internacionalização de alguns erros de validação (Zod/AJV) para PT-BR.
- Setup do `pg-boss-dashboard` para observabilidade de filas.
- Suíte de testes de integração cobrindo isolamento de notificações e fluxos de segurança.
