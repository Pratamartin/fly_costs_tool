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
- **Invites**: Mudar de `400` para **`409 Conflict`** quando o convite já foi usado ou expirou (conflito de estado de negócio).
- **Files/Uploads**: Implementar **`415 Unsupported Media Type`** para formatos inválidos e **`413 Content Too Large`** para arquivos excedendo a cota.
- **State Machine (Expenses)**: Transições de status inválidas mudam de falhas genéricas para **`409 Conflict`**.
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
