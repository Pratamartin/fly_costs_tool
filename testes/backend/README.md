# Testes Backend

Testes unitários para os serviços do backend.

## Instalar dependências

```bash
npm install --legacy-peer-deps
```

## Rodar testes

```bash
npm test
```

## Rodar em modo watch

```bash
npm run test:watch
```

## Gerar cobertura

```bash
npm run test:coverage
```

## Estrutura

- `auth.service.test.ts` - Testes de autenticação
- `user.service.test.ts` - Testes de usuário
- `expense.service.test.ts` - Testes de despesas
