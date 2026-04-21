# Fly Costs API

- REST API.
- Documentação disponível em: `/reference`.

## 🛠 Stack

- **Framework:** [Hono](https://hono.dev/)
- **Validação:** [Zod](https://zod.dev/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **Testes:**
    - [Vitest](https://vitest.dev/)
    - [TestContainers](https://testcontainers.com/)
- **Linting:** [ESLint](https://eslint.org/)

## ⚙️ Setup

0. **Extensões VSCODE recomendadas:**
    * [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    * [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
    * [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)
    * [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)

1. **Instale o Node Version Manager (NVM):** [nvm-sh](https://github.com/nvm-sh/nvm)

2. **No diretório do projeto, utilize:**
    ```bash
    nvm install
    nvm use
    npm install
    ```

3. **Variáveis de ambiente:**
    ```bash
    cp .env.example .env
    ```

   **DATABASE_URL**:
    - **1ª Opção (Nuvem):** Obtenha um banco postgres para desenvolvimento em [console.prisma.io](https://console.prisma.io)
    - **2ª Opção (Local via Docker):** Suba o container do banco:
      ```bash
      docker compose up -d postgres
      ```
      Atribua o valor:
      ```env
      DATABASE_URL="postgresql://user:password@localhost:5432/flycostsdb"
      ```

   **JWT_SECRET**:
    - Chave mestra utilizada para assinar e validar os tokens de autenticação (JWT).
    - **Geração:** Gere uma chave segura executando o comando no terminal:
      ```bash
      node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
      ```
    - Atribua o valor gerado ao seu `.env`:
      ```env
      JWT_SECRET="seu_token_gerado_aqui"
      ```

   **JWT_EXPIRE_AT**:
    - Define o tempo de vida útil do token, em segundos, a partir do momento da emissão.
    - **Formato:** Valor numérico inteiro representando o total de segundos.
    - **Exemplos comuns:**
        - `3600` (1 hora)
        - `86400` (1 dia)
        - `604800` (1 semana)
    - Atribua o valor desejado (exemplo de 1 dia):
      ```env
      JWT_EXPIRE_AT=86400
      ```

4. **Iniciando a aplicação:**
    ```bash
    npx prisma generate
    npm run db:migrate
    npm run dev
    ```

## 🧪 Testes

Os testes de integração utilizam a tecnologia **Testcontainers** para provisionar um banco de dados PostgreSQL efêmero e isolado automaticamente.

> ⚠️ **Pré-requisito:** Certifique-se de que o **Docker** esteja instalado em sua máquina.

| Comando | Descrição |
| :--- | :--- |
| `npm test` | Executa a suíte completa (CI) |
| `npm run test:watch` | Executa em modo watch (Desenvolvimento local) |
| `npx vitest caminho/do/arquivo.test.ts` | Executa um arquivo de teste específico |
| `npm run test:coverage` | Gera o relatório de cobertura de código |


### 🛢️ Banco de Dados

| Comando | Descrição |
| :--- | :--- |
| `npx prisma generate` | Gera as classes e tipagens |
| `npx prisma format` | Formata e identifica erros de modelagem no schema|
| `npm run db:ui` | Visualize o banco utilizando [Prisma Studio](https://www.prisma.io) |
| `npm run db:migrate` | Cria e aplica migrações |
| `npm run db:seed` | Popula o banco com dados pré-definidos |
| `npm run db:reset` | Limpa os dados e reaplica schema |
| `npm run db:sync` | Sincroniza o banco de dados local/remoto |
