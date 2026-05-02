# fly_costs_tool

Base inicial do frontend com Next.js 14 (Pages Router), TypeScript, Tailwind CSS e Docker.

## Rodar localmente

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

## Rodar com Docker

```bash
cd frontend
docker compose up --build
```

Acesse: http://localhost:3000

## Rodando tudo:

## Terminal 1 — Banco de dados

docker start flycosts-postgres

## Terminal 2 — Backend

cd /Users/yanpedro/Documents/fly_costs_tool/backend
npx prisma migrate deploy
npm run dev

# Terminal 3 — Frontend

cd /Users/yanpedro/Documents/fly_costs_tool/frontend
npm run dev
