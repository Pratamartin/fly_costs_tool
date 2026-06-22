# Plano de Arquitetura — RFC 9457: Padronização de Erros e Validações Semânticas

---

## 1. O que é a RFC 9457?

A **RFC 9457 (Problem Details for HTTP APIs)** é um padrão da IETF que define um formato "machine-readable" (legível por máquina) para especificar erros em respostas HTTP. Em vez de retornar um simples `message` ou `error` como string, a RFC estipula uma estrutura robusta contendo:

- `type`: Uma URI (ou URN) única que identifica o problema (ex: `urn:sgda:domain:expense:invalid-state`).
- `title`: Um resumo curto e legível para humanos.
- `status`: O código HTTP correspondente.
- `detail`: Uma explicação detalhada e contextualizada.
- `instance`: Rota atingida ou id da requisição.
- `extensions`: Campos adicionais e arbitrários contendo metadados semânticos para consumo programático (ex: regras de negócio falhas, limites de tamanho).

### Como isso nos ajuda?
Ao adotar a RFC 9457, padronizamos toda a comunicação de falhas. O Frontend (e outros consumidores) não precisa mais fazer "parse" de strings (Regex) para saber o que deu errado. Eles podem inspecionar o `type` e acessar os metadados diretamente, permitindo UIs mais responsivas, internacionalizadas e precisas.

---

## 2. Rationale: Do "Silêncio Semântico" à "Arquitetura de Metadados"

Antes desta implementação, a API sofria de "Silêncio Semântico" e ambiguidades estruturais:
1. **Status Codes Inconsistentes**: Recursos inexistentes retornavam `422` (Zod validation) em vez de `404`, pois o sistema tentava validar o `null` retornado pelo banco de dados.
2. **Falta de Dados para UI**: Se um upload excedia 10MB, o frontend recebia apenas "File too large", impedindo a exibição de uma mensagem dinâmica baseada em configuração (ex: *"O limite é {maxSizeMB}MB"*).
3. **Ambiguidade em Domínios**: Um código de convite expirado retornava `400 Bad Request`, o mesmo código de uma requisição mal formatada, dificultando tratativas específicas.

### O Problema do "Erasing" (Overwrite) e a Solução "OneOf"

Um desafio crítico na geração do Swagger/OpenAPI ocorria devido a colisões de Status HTTP. 
Se um mesmo endpoint pudesse retornar dois erros 404 diferentes (ex: `USER_NOT_FOUND` e `PROJECT_NOT_FOUND`), a declaração no OpenAPI sofria um "Erasing" (sobreposição/spread overwrite): a última definição de erro registrada apagava as anteriores no contrato.

**A Solução (`OneOf` / `z.union`)**:
No novo `registryResponses`, agrupamos dinamicamente todas as definições de erro que compartilham o mesmo Status HTTP. Se houver colisão (ex: múltiplos `409` ou `404`), os schemas são unidos via `z.union`. 
No OpenAPI, isso é renderizado perfeitamente através de um **`oneOf`** com um `discriminator` (baseado no campo `type`). Isso resolve o problema do *erasing* e garante que o Frontend tenha *autocomplete* total para cada variante possível daquele Status HTTP.

---

## 3. Estratégia de Implementação (Roadmap)

### Etapa 1 — Registry Centralizado (`src/lib/problems.ts`)
Estabelecer a "Fonte da Verdade" para todos os erros da API.
- Criar o registry usando `hono-problem-details`.
- Definir URNs únicas e rigorosas para cada erro.
- Implementar **Padrão ServiceResult Estrito**: Serviços não retornam mais `null` ou `false`, mas sim uma união discriminada: `T | { error: ProblemCode, context?: object }`.

### Etapa 2 — Honestidade Semântica (Atualização de HTTP Status)
Revisar e alterar códigos de status para refletir a realidade arquitetural. As mudanças principais mapeadas:
- **Estados Terminais (410 Gone)**: Recursos que atingiram um estado terminal operacional (ex: convites usados/expirados ou projetos arquivados) agora retornam **`410 Gone`**. 
- **Cleanup & Purge**: Alguns recursos efêmeros em estado `410`  como tokens e convites são alvos do `CleanupJob`, que realiza o purge físico dos dados após o período de retenção configurado, consolidando a semântica de que o dado "se foi".
- **Files/Uploads**: Implementar **`415 Unsupported Media Type`** para formatos inválidos e **`413 Content Too Large`** para arquivos excedendo a cota.
- **Conflitos (409 Conflict)**: Mantido para falhas que *podem* ser resolvidas (ex: transições de status inválidas na máquina de estados ou email já cadastrado).
- **Resources**: Entidades não encontradas passam a retornar rigorosamente **`404 Not Found`** em todas as camadas.


### Etapa 3 — Equalização de Motores (Zod ↔ AJV)
Garantir que validações estáticas (TypeScript) e dinâmicas (JSON Schema) emitam o mesmo contrato:
- **Zod Middleware**: Capturar `ZodIssue` e converter em metadados programáticos no array `errors` (extensão da RFC).
- **AJV Bridge**: Mapear erros do AJV (ex: `minLength`) para códigos equivalentes do Zod (ex: `too_small`) e extrair o limite original para compor a resposta.

### Etapa 4 — Unificação "Plug Semântico" (Testes)
Refatorar testes para garantir a nova arquitetura:
- **Auth**: Validar `minAge` (18 anos) e Regex.
- **Projects**: Validar integridade e limites de `budget`.
- **Expenses**: Validar o campo estrito `resourceState` e transições inválidas.

---

## 4. Contratos e Exemplos Práticos

### Exemplo 1: Erro de Validação (Status 422)
**Cenário:** O sistema captura um erro de validação (ex: nome do evento muito curto).
**Expectativa:**
```json
{
  "type": "urn:sgda:validation:request:failed",
  "title": "Validation Error",
  "status": 422,
  "errors": [
    {
      "field": "event.name",
      "code": "too_small",
      "params": { "min": 3 },
      "message": "Too small: expected string to have at least 3 characters"
    }
  ]
}
```

### Exemplo 2: Erro de Máquina de Estados com "Extensions" (Status 409)
**Cenário:** O usuário tenta aprovar uma despesa que já foi REJEITADA.
**Expectativa:** O `409 Conflict` é utilizado para conflitos de estado de recurso, acompanhado dos metadados essenciais.
```json
{
  "type": "urn:sgda:domain:expense:invalid-transition",
  "title": "Invalid status transition",
  "status": 409,
  "detail": "The requested status change violates business rules.",
  "resourceState": {
    "current": "REJEITADO",
    "allowed": []
  }
}
```

### Exemplo 3: Falha de Upload de Arquivo (Status 413)
**Cenário:** Arquivo de 25MB enviado quando o limite é 10MB.
**Expectativa:** O HTTP Status adequado (`413`) é acompanhado dos limites dinâmicos para renderização de UI.
```json
{
  "type": "urn:sgda:infra:file:too-large",
  "title": "File too large",
  "status": 413,
  "detail": "The uploaded file exceeds the maximum allowed size.",
  "maxSizeMB": 10
}
```

---

## 5. Validação Pragmática de Dados Bancários

**Contexto**: Validar bancos e RGs via libs de terceiros gera manutenção pesada e falsos negativos frequentes na UI.
**Decisão**: Usar **Regex "Catch-Trash"** permissiva.
**Estratégia**: A API não tenta ser a "verdade absoluta", mas age como filtro de primeiro nível contra entradas absurdas.
**Metadado**: Enviamos o `pattern` esperado nos `params` do erro 422 para que o Frontend aplique a máscara ou a validação visual correspondente de forma reativa.

---

## 6. Critérios de Aceite (Métricas de Sucesso)

- [x] **Redundância Zero**: Deletado o arquivo de infraestrutura legada de testes.
- [x] **Cobertura**: Refatoração integração cobrindo novos contratos de erro.
- [x] **Propagação Total**: Handlers utilizam `extensions: result.context` em todos os erros de serviço.
- [x] **OpenAPI "OneOf"**: O contrato reflete as extensões via `registryResponses` resolvendo o "erasing" por colisões de HTTP status.

---

## 7. Catálogo Vivo de Extensões (Metadados Atuais)

Sempre que adicionarmos novos metadados semânticos a um erro, ele deve ser tipado em `src/schemas/shared.schema.ts`, atrelado no `AppProblemExtensions` usando `z.infer`, e **registrado nesta tabela** para servir como contrato humano de UX para a equipe de Frontend.

| Código de Erro (AppProblemExtensions) | Zod Schema / Tipagem | O que informa? (UX / Motivo) | Exemplo de Origem |
| :--- | :--- | :--- | :--- |
| `VALIDATION_ERROR` | `{ errors: ValidationErrorItem[] }` | Array de erros de validação Zod (field, code, message). Permite mapeamento de erros em formulários no front. | Zod Middleware |
| `INTERNAL_SERVER_ERROR` | `{ stack?: string }` | Stacktrace (se habilitado). Útil apenas para debug; mascarado em produção. | Error Handler Geral |
| `INVALID_SUBCATEGORIES` | `InvalidSubcategoriesSchema` | Informa quais strings de categoria falharam a validação no banco (`invalidNames`) e quais são as opções válidas. Permite ao Frontend pintar o campo exato de vermelho. | `project.service.ts` |
| `PROJECT_INSUFFICIENT_FUNDS` | `ProjectInsufficientFundsSchema` | Fornece o `availableBudget` em tempo real. Evita que o usuário precise "adivinhar" o limite ou que o Frontend tenha que refazer a conta. | `project.service.ts` |
| `INVITE_ALREADY_USED` | `InviteAlreadyUsedSchema` | Retorna `usedAt` informando quando o convite foi gasto. Útil para auditoria do admin. | `invite.service.ts` |
| `INVITE_ALREADY_EXPIRED` | `InviteAlreadyExpiredSchema` | Retorna `expiredAt` informando a data exata da revogação/expiração. | `invite.service.ts` |
| `PROJECT_PERIOD_EXPIRED` | `ProjectPeriodExpiredSchema` | Retorna `expiredAt` e `availableUntil` (data limite da vigência do projeto). | `project.service.ts` |
| `PROJECT_SHRINKAGE_CONFLICT` | `ProjectShrinkageConflictSchema` | Usado ao tentar diminuir vigência/budget de um projeto abaixo do já consumido. Retorna as restrições calculadas no momento da falha. | `project.service.ts` |
| `INVALID_TRANSITION` | `{ resourceState: { current, allowed } }` | Máquina de estados. Bloqueia avanço de status ilegal (ex: EM_PROCESSAMENTO para PAGO pulando APROVADO). | `expense.service.ts` |
| `UNSUPPORTED_MEDIA_TYPE` | `{ allowedMimeTypes: string[] }` | Informa extensões válidas dinamicamente baseadas no config para bloquear upload malicioso. | `attachment.service.ts` |
| `FILE_TOO_LARGE` | `{ maxSizeMB: number }` | Retorna o teto configurado de megabytes permitidos. Permite avisos na UI "Máximo X MB". | `attachment.service.ts` |
