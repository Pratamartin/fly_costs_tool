# Sprint 5 — Relatório de Entrega
**Maturidade de Sessões, Automação de Infraestrutura, Melhorias de Usabilidade e Correções (R5)**
Data: 2026-06-14

---

## Escopo Proposto
> Elevação da robustez do ecossistema: Migração para sessões stateful, automação de manutenção de recursos (Cleanup Jobs), conformidade semântica de erros (RFC 9457) e correções essenciais em fluxos de acesso.

---

## O que foi entregue ✅

### 1. Gestão de Sessão e Segurança Stateful
*Transição para o modelo Stateful com proteção de integridade.*
- **JTI-based Active Revocation**: Implementação da tabela `UserSession` para rastreamento de tokens. Agora, o sistema permite a invalidação imediata de acessos comprometidos via `jti` (JWT ID) e campo `revokedAt`.
- **Fix Profile Bypass**: Correção crítica na validação de papéis (roles) após o login, impedindo que usuários acessem dashboards administrativos através de manipulação de estado local.
- **Sessão Estendida**: Implementação de lógica de renovação automática (`extendSession`) que prolonga a validade da sessão a cada interação bem-sucedida do usuário.

### 2. Resiliência de Infraestrutura e Higiene de Dados
*Manutenção automatizada e redução de custos operacionais.*
- **Orphan Cleanup Job**: Varredura cruzada entre Postgres e R2 para eliminar "objetos fantasmas" que não possuem referência no banco de dados.
- **Record Cleanup Job**: Implementação de rotinas para limpeza de **Convites Expirados**, **Tokens de Reset de Senha** e **Sessões Revogadas**.
    - **Estratégia de Batching**: Processamento em lotes de 1.000 registros para evitar travamentos no Postgres (Write-Ahead Log protection).
- **Rejected Purge Job**: Automação do ciclo de vida de conteúdos de despesas rejeitadas, limpando storage físico após 90 dias, mas preservando o log de auditoria via campo `purgedAt`.
- **Semântica 410 Gone**: Refatoração de exceções para conformidade com a RFC 9457. Recursos expirados (como convites antigos ou projetos arquivados) agora retornam explicitamente o status `410 Gone`.

### 3. RFC 9457: Arquitetura de Erros e Diagnóstico
*Resolução do "Silêncio Semântico" e centralização de contratos de API.*
- **Rationale & Design**: Implementação baseada no Plano de Arquitetura RFC 9457. Centralização de todos os erros em `problems.ts` (Single Source of Truth).
- **Advanced Problem Extensions**: O objeto de erro carrega metadados semânticos definidos em `lib/type.ts`:
    - `VALIDATION_ERROR`: Array `errors` detalhado para mapeamento direto em formulários.
    - `INVALID_TRANSITION`: Detalha estados `current` e `allowed` no objeto `resourceState`.
    - `FILE_TOO_LARGE`: Informa dinamicamente o `maxSizeMB` permitido para o upload.
- **OpenAPI Registry**: Uso do `registryResponses` com `z.union` para resolver colisões de Status HTTP no Swagger, permitindo que o frontend tenha autocomplete total para cada variante de erro.

### 4. Usabilidade, UI e UX
*Modernização da stack de frontend e reatividade de interface.*
- **Gestão de Estado com Zustand**: Implementação da `useAuthStore` para gerenciamento de tokens em memória, reduzindo a exposição de dados sensíveis e garantindo reatividade total em toda a aplicação.
- **Sincronização de Sessão**:
    - **Auth Interceptor**: Sincronização automática entre a store Zustand e o interceptor Axios após renovação silenciosa de tokens.
    - **Auto-login Sync**: Garante que o estado global seja atualizado instantaneamente após o registro de novos alunos.
- **Modernização de Formulários**: Migração para **React Hook Form + Zod**, unificando as validações semânticas entre frontend e backend.
- **Sistema de Feedback (Sonner)**: Centralização de notificações reativas integradas a Promises da API, fornecendo feedback de estado (Loading/Success/Error) em todos os dashboards.
- **Design System & Dark Mode**:
    - Implementação de `next-themes` integrada ao Tailwind CSS.
    - Suporte a temas dinâmicos em 100% das páginas de autenticação e dashboards administrativos/alunos.
- **Resiliência de UI**:
    - **ProtectedRoute**: Componente de guarda de rotas para prevenção de "content flickering" e proteção de acesso por role.
    - **SSE Timeout Handling**: Correção na exportação de relatórios PDF para lidar com quedas de conexão via Server-Sent Events, prevenindo falhas silenciosas durante a geração de PDFs pesados.

### 5. Qualidade e Observabilidade
- **Correção no Fluxo de Notificações Administrativas**: Resolução de falha crítica nos gatilhos de notificação para a equipe de staff, garantindo que novas solicitações em suas filas de trabalhos sejam comunicadas tanto in-app quanto através de seus e-mails.
- **Blindagem de Dados Sensíveis (PII)**: Implementação de máscaras dinâmicas no motor de logs. Informações como e-mails, senhas, CPFs e tokens de segurança são redigidos e censurados antes da persistência.
- **Coberturas de Teste**: Suite de validação dos fluxos de criação, extensão e revogação de sessões, além de testes de integração para os novos contratos de erro.

---

## Log de Integração Técnicas
| Branches Associadas | Descrição | Status |
|---------------------|-----------|--------|
| `feat/backend/sessions` | Sessões Stateful e Logout Global | ✅ Merged |
| `extra/refactor/gone-exception` | Semântica 410 Gone | ✅ Merged |
| `sprint5-expiracao-limpeza-arquivos-r2` | Cleanup R2 e Purge Logic | ✅ Merged |
| `sprint5/backend/error-handling`, `sprint5/test/error-handling` | RFC 9457 Registry & Tests | ✅ Merged |
| `extra/record-cleanup-job` | Cleanup de Convites e Tokens (Batch) | ✅ Merged |
| `extra/refactor/redact-plugin` | PII Masking e Redact Plugin | ✅ Merged |
| `sprint-5-frontend-part2` | Dark Mode e Tematização Global | ✅ Merged |
| `sprint-5-frontend-part1` | Zustand Store, Toasts (Sonner) e API Interceptor | ✅ Merged |
| `sprint5-backend-unit-tests` | Suite de Testes de Sessão e Auth | ✅ Merged |

---
