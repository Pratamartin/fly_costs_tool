# Fly Costs API

- REST API.
- Documentação disponível em: `/reference`.

## 🛠 Stack

- **Framework:** [Hono](https://hono.dev/)
- **Validação:** [Zod](https://zod.dev/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **Testes:** [Vitest](https://vitest.dev/)
- **Linting:** [ESLint](https://eslint.org/)

## ⚙️ Setup

1. **Instale o Node Version Manager (NVM):** [nvm-sh](https://github.com/nvm-sh/nvm)

2. **No diretório do projeto, utilize:**
    ```bash
    nvm install
    nvm use
    npm install
    npx prisma generate
    ```

3. **Extensões VSCODE recomendadas:**
    * [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    * [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
    * [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)
    * [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)

4. **Variáveis de ambiente:**

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

## 🧪 Testes

Antes de iniciar, crie seu arquivo `.env.test.local` com base no `.env.test`.

| Comando | Descrição |
| :--- | :--- |
| `npm test` | Executa a suíte completa (CI) |
| `npm run test:watch` | Executa em modo watch (Desenvolvimento local) |
| `npx vitest caminho/do/arquivo.test.ts` | Executa um arquivo de teste específico |
| `npm run test:coverage` | Gera o relatório de cobertura de código |


## 📖 Observações
Listagem de comandos disponíveis em `scripts` no `package.json`.

### Banco de Dados

| Comando | Descrição |
| :--- | :--- |
| `npx prisma generate` | Gera as classes e tipagens |
| `npx prisma format` | Formata e identifica erros de modelagem no schema|
| `npm run db:ui` | Visualize o banco utilizando [Prisma Studio](https://www.prisma.io) |
| `npm run db:migrate` | Cria e aplica migrações |
| `npm run db:seed` | Popula o banco com dados pré-definidos |
| `npm run db:reset` | Limpa os dados e reaplica schema |
| `npm run db:sync` | Sincroniza o banco de dados local/remoto |
