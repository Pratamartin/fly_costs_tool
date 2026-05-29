# Guia Técnico: Relatórios Assíncronos (PDF)

Este módulo gerencia a exportação relatórios de despesas em formato PDF, utilizando processamento em segundo plano e monitoramento via Server-Sent Events (SSE).

## 💡 O Conceito
*   **Problema**:
    1.  **Bloqueio do Event Loop**: A geração de PDF é intensiva em CPU. Processá-la de forma síncrona na requisição HTTP tornaria a API indisponível para outros usuários.
    2.  **Esgotamento de Memória (OOM)**: Carregar milhares de registros simultaneamente para gerar um documento derrubaria o container por falta de RAM.
    3.  **Feedback Ineficiente**: Processos pesados geram incerteza sobre o tempo de conclusão. Fazer polling (consultas repetitivas) para checar o status sobrecarrega o banco de dados.

*   **Proposta**: 
    1.  **Background Jobs**: Desacoplamento via `pg-boss`, o pedido é delegado ao a um worker isolado, que processa a fila de acordo com a capacidade.
    2.  **Streaming & Limites**: Limite máximo de **2.000 registros** e upload via Stream ao storage R2, sem manter o arquivo completo na memória.
    3.  **Comunicação Unidirecional (SSE)**: O servidor envia atualizações de status e o link final para o frontend à medida que o worker avança, mantendo uma única conexão de texto contínua.

*   **Benefícios**:
    *   **Estabilidade**: O Event Loop do Node.js permanece livre.
    *   **Escalabilidade**: Uso previsível de memória RAM.
    *   **Previsibilidade**: O usuário recebe feedback sobre o andamento do processo.


## 🏗️ Guia de Desenvolvimento

### 1. Iniciar Geração
**GET** | `/expenses/reports` | Registra o pedido de relatório com filtros opcionais.

*   **Query Params**: `userId`, `projectId`, `status`, `from`, `to`.
*   **Retorno**: `{ "jobId": "uuid-do-job" }`

### 2. Monitorar via SSE
**GET** | `/expenses/reports/status/{jobId}` | Canal de texto para acompanhar o progresso.

Recomenda-se o uso de `addEventListener` para escutar os eventos específicos. Os dados chegam como texto e devem ser desserializados:

*   **`report-update`**: Atualizações de estado do job (`created`, `active`).
*   **`report-finished`**: Sucesso. Retorna os dados com o `downloadUrl`.
*   **`report-error`**: Falha. Retorna os dados com a `message` do erro.

```javascript
const sse = new EventSource(`/v1/expenses/reports/status/${jobId}`);

// Sucesso: Redireciona para o download
sse.addEventListener('report-finished', (e) => {
  const payload = JSON.parse(e.data); // Desserializa o texto para objeto
  window.location.href = payload.downloadUrl;
  sse.close();
});

// Erro: Notifica o usuário
sse.addEventListener('report-error', (e) => {
  const payload = JSON.parse(e.data);
  console.error("Falha no relatório:", payload.message);
  sse.close();
});
```

## 🎯 Detalhes Técnicos
*   **Namespacing**: Todos os eventos seguem o padrão `report-*` para evitar colisões globais no frontend.
*   **Documentação**: Uso do helper `sseContent` para garantir que o OpenAPI reflita a estrutura de texto `event` + `data` do protocolo real, evitando a confusão com respostas JSON tradicionais.
