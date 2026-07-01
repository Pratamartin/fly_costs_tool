# Sprint 6 — Relatório de Entrega
**Arquitetura de Discriminações de Custo 1:N, Prevenção Temporal, Proteção Anti-Enumeração e Refatoração de UX (R6)**
Data: 2026-07-01

---

## Escopo Proposto
> Elevação da robustez financeira do ecossistema: Transição para discriminação de custo 1:N em despesas, adequação de taxonomia, aumento de visibilidade operacional para coordenadores e blindagem de segurança no fluxo de convites.

---

## O que foi entregue ✅

### 1. Desacoplamento Arquitetural (Discriminações de Custo 1:N)
*A mudança de paradigma mais profunda: a transição orçamentária do modelo 1:1 para o modelo 1:N, resolvendo o problema crônico de financiamento cruzado (múltiplas fontes pagadoras para a mesma requisição).*
- **Isolamento de Discriminações de Custo**: A tabela `CostBreakdown` passou a orquestrar as finanças. A métrica orçamentária (Analytics e Dashboards) deixou de somar o valor da "despesa-mãe" de forma cega. O cálculo agora considera o orçamento já executado (`usedBudget`) somado puramente às discriminações granulares pendentes no status `EM_PROCESSAMENTO`, impedindo relatórios estatísticos inflados em cenários de múltiplas fontes pagadoras.
- **Transferência Cross-Project**: A mecânica de edição (`PATCH`) de discriminações de custo passou a validar de forma estrita o saldo disponível no *projeto de destino*, barrando proativamente transferências que resultariam em saldo negativo ou associação a projetos já arquivados.
- **Integração Nativa de Discriminações de Custo**: A UI agora consome as Discriminações de Custo nativamente e reflete essas métricas reais (agregadas por projeto) no Dashboard Administrativo.

### 2. Segurança e Integridade Temporal
*Proteção avançada contra vazamento de dados e quebras temporais em orçamentos.*
- **Temporal Shrinkage Protection (Prevenção de Encolhimento)**: Implementação de proteção robusta no nível transacional do banco. O sistema detecta e proíbe a retroação da data final (`endDate`) de um projeto caso já existam transações orçamentárias (CostBreakdowns) lançadas para períodos posteriores a essa nova data-limite. Essa trava evita a ocorrência de "alocações órfãs", mantendo a integridade na auditoria de fomento.
- **Validação de Borda e Semântica (Convites)**: A amarração estrutural dos convites (`InviteCodeStringSchema`) bloqueia formatos inválidos antes mesmo de tocarem no banco (Zod). Códigos "Expirados" ou "Usados" respeitam o padrão de erro da RFC 9457 e retornam explicitamente `410 Gone`, clarificando o ciclo de vida do recurso.
- **Safe State Transitions (`EM_EDICAO`)**: Correção cirúrgica da mescla de faturas tardias, atualizando chaves no S3/R2 sem sobrescrever destrutivamente o resto da árvore JSON submetida pelo usuário. Isolamento completo de upload via renomeação de arquivo por UUID do breakdown.

### 3. Usabilidade, UI e Evolução Dinâmica
*Revisão de taxonomia, expansão de metadados, métricas financeiras granulares e fluxos de correção.*
- **Taxonomia e Avisos Contextuais**: Migração rigorosa do termo "Despesas" para "Receitas" e de "Hospedagem" para "Diárias". Inclusão de um *callout âmbar* com lembrete de agradecimento obrigatório para Trabalhos Publicados e adição da classificação QUALIS "Jornal Acadêmico".
- **Gestão de Projetos Avançada**: O cadastro e visualização de Projetos foram ampliados, agora exibindo `Sigla`, `Fonte de Recurso` e vigência (`Data de Início/Fim`). No detalhe do projeto, o gráfico abstrato deu lugar a uma precisa Tabela Analítica de "Discriminação por Categoria".
- **Dashboards de Saldo Financeiro**: Introdução do card dinâmico de "Saldo" (Total de Receitas − Custos Discriminados) tanto no painel global de Administração quanto no painel isolado por Projeto.
- **Fluxo de Correção Resiliente (`EM_EDICAO`)**: Alunos agora possuem um formulário altamente granular ao corrigir uma solicitação. Campos de roteiro (Cidade, Estado, País, Datas de Ida/Volta) e reenvio de comprovantes/memorandos estão desbloqueados, enquanto metadados base (Título/Descrição) permanecem congelados em leitura.
- **Visibilidade Operacional (Coordenação)**: Exposição ativa de metadados críticos (`departureDate`, `returnDate`) e, principalmente, integração ponta-a-ponta da Chave PIX e Dados Bancários do aluno (desde o perfil até o dashboard do coordenador), acelerando o fluxo de liquidação. A obrigatoriedade de comprovantes também foi extinta para Diárias, reduzindo o atrito.
- **Exportação Institucional (PDF)**: O relatório exportável foi enriquecido estruturalmente, acrescentando as colunas de contexto acadêmico "Evento" e "Qualis" à tabela impressa.

### 4. Padronização e API Design
*Infraestrutura para suporte a paginação global e validações na borda.*
- **Engine Global de Paginação**: Adoção de um novo padrão estrutural (`PaginationHeadersSchema` e `OrderSchema`) que padroniza cabeçalhos `x-total-count` em toda a API, inaugurado na rota paginável de `GET /projects/:id/cost-breakdowns`.
- **Pre-flight Checks (Fail-Fast)**: Novo endpoint validatório pré-cadastro (`GET /auth/verify-invite/{code}`) e amarração criptográfica das constantes de chaves de convite na borda (Zod), poupando processamento inútil no banco.
- **Formatação de Relatórios (PDF)**: Resolução adequada de UUIDs de Projetos/Alunos para nomes inteligíveis e formatação ISO garantida na exportação oficial de faturas consolidadas.

### 5. Qualidade e Observabilidade
*Garantia de estabilidade através de cobertura abrangente e correções estáticas.*
- **Cobertura de Testes**: 226 testes unitários no total, com 100% de aprovação nos fluxos refatorados (Convites, Máquinas de Estado de Discriminações de Custo e Lógica de Vigência).
- **TypeScript & Qualidade**: Correção de 20 erros de tipagem pré-existentes na base, mantendo o frontend com build `tsc --noEmit` apresentando 0 erros.
- **Adaptação de Integração**: Refatoração completa das suítes de testes E2E (`integration-test`) para suportarem a nova arquitetura 1:N de isolamento financeiro.

---

## Endpoints Integrados

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/v1/projects/:id/cost-breakdowns` | Listagem paginada e filtrável de discriminações de custo por projeto |
| `POST` | `/v1/expenses/:id/cost-breakdowns` | Criação e alocação de uma nova discriminação de custo na requisição |
| `PATCH` | `/v1/expenses/:id/cost-breakdowns/:breakdownId` | Edição e transferência inter-projetos de discriminação de custos |
| `DELETE` | `/v1/expenses/:id/cost-breakdowns/:breakdownId` | Remoção de uma discriminação de custo e desvinculação orçamentária |
| `POST` | `/v1/expenses/:id/cost-breakdowns/:breakdownId/receipt` | Upload de comprovante específico da discriminação (S3/R2) |
| `DELETE` | `/v1/expenses/:id/cost-breakdowns/:breakdownId/receipt` | Exclusão física do comprovante (S3/R2) |
| `GET` | `/v1/expenses/:id/cost-breakdowns/:breakdownId/receipt/download` | Geração de URL assinada para visualização segura do comprovante |
| `GET` | `/v1/auth/verify-invite/{code}` | Verificação de integridade (Pre-flight) do código de convite |

---

## Pequenas melhorias
- **Créditos da Plataforma**: Lançamento da página oficial de Contribuidores reconhecendo o trabalho da equipe técnica no frontend.
- **Remoção de Código Morto**: Exclusão de botões e contextos órfãos de "Vincular Projeto", já que o fluxo migrou inteiramente para as discriminações de custo.

---

## Log de Integração Técnica
| Branches Associadas | Descrição | Status |
|---------------------|-----------|--------|
| `sprint-6-backend-part1` | Isolamento 1:N, Prevenção Temporal (Shrinkage) e Renomeações de Domínio (Taxonomia) | ✅ Merged |
| `sprint-6-backend-part2` | Paginação Global, Endpoints de Cost Breakdown, Anti-Enumeração (Convites), Restrição de Comprovantes e Fixes no PDF | ✅ Merged |
| `sprint-6-test-part1` e `part2` | Cobertura Estrita de Testes e Adaptação de Suítes para Isolamento 1:N | ✅ Merged |
| `sprint-6-frontend-part1` | Integração Real de Discriminações de Custo na UI, Novo Dashboard, UX, PIX e Contribuidores | ✅ Merged |

---
