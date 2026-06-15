# Backlog de User Stories (US) e Requisitos Funcionais (RF)

## Tabela Geral de Referência

Essas  descrições do github acabaram não seguido um padrão.

| Sprint | US  | RF         | Título                                       |           Status           |
| :----: | :-: | :--------- | :------------------------------------------- | :------------------------: |
|   1    | 1.1 | RF01, RF02 | Cadastro de Usuário (ALUNO)                  |           `Done`           |
|   1    | 1.2 | RF03       | Login com Papéis (Aluno/Coordenador)         |           `Done`           |
|   1    | 1.3 | RF06       | Solicitar Despesa (Aluno)                    |           `Done`           |
|   1    | 1.4 | RF08       | Acompanhar Solicitação (Aluno)               |           `Done`           |
|   1    | 1.5 | RF09       | Listar Pendentes (Coordenador)               |           `Done`           |
|   1    | 1.6 | RF09, RF12 | Aprovar/Reprovar (Coordenador)               |           `Done`           |
|   1    | 1.7 | RF07       | Dashboard Mínimo (Coordenador)               |           `Done`           |
|   2    | 2.1 | RF06       | Memorando Obrigatório                        |           `Done`           |
|   2    | 2.2 | RF06       | Informações de Viagem (Localização/Datas)    |           `Done`           |
|   2    | 2.3 | RF09       | Rejeição Definitiva com Motivo               |           `Done`           |
|   2    | 2.4 | RF10, RF14 | Atribuição de Projeto                        |           `Done`           |
|   2    | 2.5 | RF10       | Gestão de Projetos com Subcategorias         |           `Done`           |
|   2    | 2.6 | RF14       | Discriminação de Custos                      |           `Done`           |
|   2    | 2.7 | RF15       | Status EM_EDIÇÃO (Solicitar Correção)        |           `Done`           |
|   2    | 2.8 | RF16       | Admin Anexa Arquivos (Passagens)             |           `Done`           |
|   2    | 2.9 | RF13       | Dashboard Admin (Métricas)                   |           `Done`           |
|   3    | 3.0 | RF05       | Editar Perfil do Usuário                     |           `Done`           |
|   3    | 3.1 | RF02       | Cadastro do Aluno com Dados Bancários        |           `Done`           |
|   3    | 3.2 | RF01       | Invite Link Gerado pelo Admin                |           `Done`           |
|   3    | 3.3 | RF16       | Admin Anexa Arquivos (Cloudflare R2)         |           `Done`           |
|   3    | 3.4 | RF15       | Fluxo de Correção (Status EM_EDIÇÃO)         |           `Done`           |
|   3    | 3.5 | RF17       | Aluno Visualiza Dossiê de Comprovantes       |           `Done`           |
|   4    | 4.0 | RF11       | Notificação de Mudança de Status             |           `Done`           |
|   4    | 4.1 | RF04       | Recuperação de Senha                         |           `Done`           |
|   4    | 4.2 | RF20       | Proteção de Rotas e Refresh Token            |           `Done`           |
|   4    | 4.3 | RF23       | Relatório / Exportação de Despesas (PDF)     |           `Done`           |
|   4    | 4.4 | RF24       | Central de Notificações In-App               |           `Done`           |
|   5    | 4.5 | RF25       | Feedback visual de erros e sucesso (Toast)   |           `Done`           |
|   5    | 4.6 | RF26       | Validação de campos em formulários           |           `Done`           |
|   5    | 4.2 | RF20       | Proteção de rotas e refresh token automático |           `Done`           |
|   6    | 6.1 | RF27       | Remoção de invoice na solicitação inicial    |        🔴 Pendente         |
|   6    | 6.2 | RF28       | Ajuste de visualização para coordenador      |        🔴 Pendente         |
|   6    | 6.3 | RF29       | Inclusão de datas de viagem                  |        🔴 Pendente         |
|   6    | 6.4 | RF30       | Alteração de "Hospedagem" para "Diárias"     |        🔴 Pendente         |
|   6    | 6.5 | RF31       | Simplificação do campo "Diárias"             |        🔴 Pendente         |
|   6    | 6.6 | RF32       | Padronização de nomenclaturas                |        🔴 Pendente         |
|   6    | 6.7 | RF33       | Melhorias no cadastro de projeto             |        🔴 Pendente         |
|   6    | 6.8 | RF34       | Ajuda de custo com fonte de recurso por item |        🔴 Pendente         |

---



## Lista Sequencial de Requisitos (1.0 -> n.n)

Essas descrições deveriam ser o padrão dos us e rfs. 

| Sprint | US  | RF         | Título                                       |           Status           |
| :----: | :-: | :--------- | :------------------------------------------- | :------------------------: |
|   1    | 1.0 | RF01, RF02 | Cadastro de Usuário (ALUNO)                  |           `Done`           |
|   1    | 1.1 | RF03       | Login com Papéis (Aluno/Coordenador)         |           `Done`           |
|   1    | 1.2 | RF06       | Solicitar Despesa (Aluno)                    |           `Done`           |
|   1    | 1.3 | RF08       | Acompanhar Solicitação (Aluno)               |           `Done`           |
|   1    | 1.4 | RF09       | Listar Pendentes (Coordenador)               |           `Done`           |
|   1    | 1.5 | RF09, RF12 | Aprovar/Reprovar (Coordenador)               |           `Done`           |
|   1    | 1.6 | RF07       | Dashboard Mínimo (Coordenador)               |           `Done`           |
|   2    | 1.7 | RF06       | Memorando Obrigatório                        |           `Done`           |
|   2    | 1.8 | RF06       | Informações de Viagem (Localização/Datas)    |           `Done`           |
|   2    | 1.9 | RF09       | Rejeição Definitiva com Motivo               |           `Done`           |
|   2    | 2.0 | RF10, RF14 | Atribuição de Projeto                        |           `Done`           |
|   2    | 2.1 | RF10       | Gestão de Projetos com Subcategorias         |           `Done`           |
|   2    | 2.2 | RF14       | Discriminação de Custos                      |           `Done`           |
|   2    | 2.3 | RF15       | Status EM_EDIÇÃO (Solicitar Correção)        |           `Done`           |
|   2    | 2.4 | RF16       | Admin Anexa Arquivos (Passagens)             |           `Done`           |
|   2    | 2.5 | RF13       | Dashboard Admin (Métricas)                   |           `Done`           |
|   3    | 2.6 | RF05       | Editar Perfil do Usuário                     |           `Done`           |
|   3    | 2.7 | RF02       | Cadastro do Aluno com Dados Bancários        |           `Done`           |
|   3    | 2.8 | RF01       | Invite Link Gerado pelo Admin                |           `Done`           |
|   3    | 2.9 | RF16       | Admin Anexa Arquivos (Cloudflare R2)         |           `Done`           |
|   3    | 3.0 | RF15       | Fluxo de Correção (Status EM_EDIÇÃO)         |           `Done`           |
|   3    | 3.1 | RF17       | Aluno Visualiza Dossiê de Comprovantes       |           `Done`           |
|   4    | 3.2 | RF11       | Notificação de Mudança de Status             |           `Done`           |
|   4    | 3.3 | RF04       | Recuperação de Senha                         |           `Done`           |
|   4    | 3.4 | RF20       | Proteção de Rotas e Refresh Token            |           `Done`           |
|   4    | 3.5 | RF23       | Relatório / Exportação de Despesas (PDF)     |           `Done`           |
|   4    | 3.6 | RF24       | Central de Notificações In-App               |           `Done`           |
|   5    | 3.7 | RF25       | Feedback visual de erros e sucesso (Toast)   |           `Done`           |
|   5    | 3.8 | RF26       | Validação de campos em formulários           |           `Done`           |
|  4\|5  | 3.9 | RF20       | Proteção de rotas e refresh token automático |           `Done`           |
|   6    | 4.0 | RF27       | Remoção de invoice na solicitação inicial    |        🔴 Pendente         |
|   6    | 4.1 | RF28       | Ajuste de visualização para coordenador      |        🔴 Pendente         |
|   6    | 4.2 | RF29       | Inclusão de datas de viagem                  |        🔴 Pendente         |
|   6    | 4.3 | RF30       | Alteração de "Hospedagem" para "Diárias"     |        🔴 Pendente         |
|   6    | 4.4 | RF31       | Simplificação do campo "Diárias"             |        🔴 Pendente         |
|   6    | 4.5 | RF32       | Padronização de nomenclaturas                |        🔴 Pendente         |
|   6    | 4.6 | RF33       | Melhorias no cadastro de projeto             |        🔴 Pendente         |
|   6    | 4.7 | RF34       | Ajuda de custo com fonte de recurso por item |        🔴 Pendente         |

LINKS:

Sprint-1
https://github.com/Pratamartin/fly_costs_tool/issues/30

Sprint-2

https://github.com/Pratamartin/fly_costs_tool/issues/90


Sprint-3

https://github.com/Pratamartin/fly_costs_tool/issues/161

Sprint-4

https://github.com/Pratamartin/fly_costs_tool/issues/194

Sprint-5
https://github.com/Pratamartin/fly_costs_tool/issues/225

Sprint-6
https://github.com/Pratamartin/fly_costs_tool/issues/260
