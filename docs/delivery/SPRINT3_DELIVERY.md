# Sprint 3 — Relatório de Entrega
**Fluxos de Convite, Correção, Arquivos R2 e Encerramento de Despesas (R3)**
Data: 2026-05-15

---

## Escopo Proposto

> Foco em segurança e flexibilidade de fluxos: Geração de links de convite (substituindo mocks), fluxo de edição e correção de despesas aprovadas (com status intermediários), anexação de comprovantes pelo Admin armazenados em Cloudflare R2 e encerramento de dossiês. 

---

## O que foi entregue ✅

### 1. Cadastro do Aluno e Dados Bancários (US 3.1)
- Novo formulário de cadastro de alunos integrado à inserção de dados bancários (Banco, Agência, Conta).
- Estrutura de banco de dados (`Profile`) expandida para comportar CPF, RG, Endereço e Informações Bancárias.

### 2. Geração de Links de Convite (US 3.2)
- Funcionalidade completa no Dashboard Admin para geração de links de convite dinâmicos.
- Definição de permissões associadas ao convite (Coordenador ou Aluno) e expiração configurável (24h, 48h, 7 dias).
- Remoção do `mockInviteCode`, agora o registro valida e consome convites reais salvos no banco.

### 3. Upload de Comprovantes pelo Admin (US 3.3)
- Anexação de arquivos de passagens e recibos a um custo discriminado (Cost Breakdown) em uma despesa.
- Armazenamento em Cloudflare R2 utilizando URLs pré-assinadas para manter a segurança do download.
- Visualização e capacidade de remover comprovantes na interface do Administrador.

### 4. Fluxo de Correção: Status EM_EDIÇÃO (US 3.4)
- Possibilidade do Administrador solicitar correções em uma solicitação previamente **APROVADA**.
- Novo status `EM_EDICAO` que permite ao Aluno editar a solicitação de forma controlada.
- Adição do campo `correctionReason` na modelagem, possibilitando orientações claras do que deve ser arrumado.
- Transição automática da despesa de volta para visualização após re-submissão.

### 5. Dossiê de Comprovantes e Conclusão de Despesa (US 3.5 - Extra)
- Novo status finalizador de fluxo: `CONCLUIDO`.
- Lógica de transição condicional que exige que todos os custos discriminados possuam um arquivo em anexo no R2 para que a despesa possa ser encerrada.
- Liberação do Portfólio de Arquivos (Dossiê) no frontend do Aluno assim que a despesa atinge o status Concluído.

---

## O que não foi entregue ❌

### Pendente da Sprint 3

| Item | Motivo |
|------|--------|
| Edição de e-mail e senha no perfil (US 3.0 / RF 005) | A tela de perfil foi entregue para dados pessoais e bancários, no entanto, a lógica de atualização de e-mail e alteração de senha (exigindo confirmação da senha atual) não foi implementada no frontend nem nas rotas de backend. O e-mail atualmente é exibido como "Não editável". |

---

## Endpoints Integrados

| Método | Rota | Usado em |
|--------|------|----------|
| `GET` | `/v1/me` | Recuperar dados completos do perfil autenticado |
| `PATCH` | `/v1/me` | Atualização parcial de perfil e dados bancários |
| `POST` | `/v1/admin/invites` | Gerar convites com role e expiração |
| `GET` | `/v1/admin/invites` | Listar convites criados pelo Admin |
| `POST` | `/v1/expenses/{id}/cost-breakdowns/{breakdownId}/receipt` | Admin anexar comprovantes (Upload R2) |
| `GET` | `/v1/expenses/{id}/cost-breakdowns/{breakdownId}/receipt/download` | Geração de URL assinada para visualização de comprovante |
| `DELETE` | `/v1/expenses/{id}/cost-breakdowns/{breakdownId}/receipt` | Remoção do comprovante (R2) |
| `PATCH` | `/v1/expenses/{id}/status` | Transicionar para `EM_EDICAO` (Correção) |
| `POST` | `/v1/expenses/{id}/conclude` | Transição final de liquidação `CONCLUIDO` |