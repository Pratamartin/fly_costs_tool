# Guia Técnico: Pesquisas de Preferência (Formulários Dinâmicos)

Este módulo utiliza **JSON Schema (Draft 7)** para gerenciar o levantamento de informações específicas e obrigatórias para cada **Categoria de Despesa** (atualmente: **Passagem Aérea, Hospedagem e Inscrição**). Como as categorias são dinâmicas e possuem requisitos de dados distintos, o sistema utiliza formulários orientados a esquemas para garantir extensibilidade total sem necessidade de migrações de banco de dados a cada novo campo solicitado.

## 💡 O Conceito
*   **Problema**:
    1.  **Categorias Dinâmicas**: Novas categorias de despesa podem surgir a qualquer momento.
    2.  **Campos Variáveis**: Dentro de uma categoria, os campos necessários podem mudar ou ser distintos (ex: Passagem pede `trecho`, Inscrição pede `invoiceKey`).
*   **Proposta**: 
    1.  **Data Schema**: Define a estrutura, tipos, placeholders e validações.
    2.  **UI Schema**: Define o layout (colunas, grupos, visibilidade) e widgets.
    3.  **Persistência**: Respostas validadas via [AJV](https://ajv.js.org/) sendo salvas como objetos `JSONB` no `PostgreSQL`.

*   **Benefícios**:
    *   **Orientação a Configuração**: Interface, validações e obrigatoriedade via dados (JSON Schema).
    *   **Agilidade**: Novas categorias e layouts sem novos deploys ou recompilações.
    *   **Flexibilidade**: Respostas em JSONB evitam migrações constantes (`ALTER TABLE`).
    *   **Ação (Evolutiva)**: Cadastro de um novo registro em `ExpenseCategory` vinculado aos esquemas para o sistema aceitar a categoria imediatamente.

## 🚀 Evolução
*   **Gestão via API**: Disponibilizar endpoints para que novas categorias e esquemas possam ser cadastrados programaticamente (ex: `POST /admin/preference-surveys`).
*   **Interface Administrativa**: Implementar um "Form Builder" visual para que administradores editem o `Data Schema` e `UI Schema` sem manipular JSON manualmente.

## 🏗️ Guia de Desenvolvimento

### 1. Obter formulários ativos
**GET** | `/preference-surveys` | Retorna o array de schemas e layouts vinculados a categorias.

Recomenda-se o uso da biblioteca **JSONForms** para renderizar esses formulários. Ela consome tanto o `schema` quanto o `ui` (opcionalmente) retornados pela API.

*   **Documentação**: [JSONForms React Integration](https://jsonforms.io/docs/integrations/react)
*   **Vantagem**: O layout pode ser controlado programaticamente. Se você mudar um `HorizontalLayout` para `VerticalLayout` no banco, o frontend reflete sem novo deploy.

```json
[
  {
    "expenseCategoryId": "uuid-passagem",
    "expenseCategory": { "name": "Passagem Aérea", "normalizedName": "passagem-aerea" },
    "schema": {
      "title": "Solicitação de Auxílio Passagem Aérea",
      "type": "object",
      "properties": {
        "departureDate": { "type": "string", "format": "date", "title": "DATA IDA" },
        "departureRoute": { "type": "string", "title": "TRECHO IDA", "placeholder": "ex.: Manaus/AM" }
      }
    },
    "ui": {
      "type": "VerticalLayout",
      "elements": [
        { "type": "Control", "scope": "#/properties/departureDate" },
        { "type": "Control", "scope": "#/properties/departureRoute" }
      ]
    }
  }
]
```

### 2. Upload de Anexos
Se o `ui` indicar um widget de `file-upload`, o frontend deve primeiro fazer o upload para obter a `fileKey`.

*   **Endpoint**: `POST /preference-surveys/upload`
*   **Retorno**: `{ "fileKey": "formulario-preferencias/uuid.pdf" }`

### 3. Salvar Respostas
As respostas são enviadas no campo `surveyAnswers` ao criar a despesa.

*   **Endpoint**: `POST /expenses`
*   **Payload**:
```json
{
  "title": "Viagem para Conferência",
  "surveyAnswers": [
    {
      "expenseCategoryId": "uuid-passagem",
      "data": {
        "departureDate": "2026-06-01",
        "departureRoute": "Manaus/AM para São Paulo/SP"
      }
    }
  ]
}
```

## 🎯 Detalhes Técnicos
*   **Validação**: O backend compila o `schema` e valida o `data` via AJV no momento do `POST /expenses`.
*   **Persistência**: Tabela `PreferenceSurvey` guarda as definições (`schema`, `ui`) e `PreferenceSurveyAnswer` guarda os dados preenchidos.
