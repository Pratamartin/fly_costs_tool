# Fix: Railway Pre-Deploy Falha ao Conectar no Banco de Dados

## Contexto

A partir de **23 de maio de 2025**, os deploys em produção passaram a falhar consistentemente durante a fase de **pre-deploy** do Railway. O erro era uma falha de conexão TCP ao banco PostgreSQL no endereço interno:

```
postgres-rv8y.railway.internal:5432
```

O deploy congelado de 16 de maio continuava funcionando normalmente, conectando ao mesmo banco, com o mesmo `DATABASE_URL`. Nenhuma alteração de código havia sido feita entre o último sucesso e as falhas.

---

## Por que o Railway quebrou

### Rede privada no pre-deploy

O Railway disponibiliza uma **rede privada interna** (`*.railway.internal`) para comunicação entre serviços do mesmo projeto e região. Essa rede é acessível nos containers em execução (os deployments "vivos").

O **pre-deploy** é uma fase separada: Railway provisiona um container efêmero, executa o comando configurado e, somente se bem-sucedido, inicia o container final. O problema é que **esse container efêmero não tem acesso garantido à rede privada** — ele está em um contexto de bootstrap diferente do runtime.

Até maio isso funcionava por comportamento implícito da plataforma. Uma mudança interna no Railway (sem aviso público) tornou esse acesso instável ou inexistente, quebrando qualquer pre-deploy que tentasse alcançar `*.railway.internal`.

### Por que o deploy de maio 16 ainda funciona

O container daquele deploy já estava em execução antes da mudança. Containers em execução continuam com acesso à rede privada normalmente. O problema só aparece em **novos deploys** que precisam passar pela fase de pre-deploy.

---

## O que estava configurado (antes)

No painel do Railway, o serviço de backend tinha o seguinte **pre-deploy command**:

```bash
npx prisma migrate deploy && npm run db:seed
```

Além disso, `prisma` estava listada como **devDependency** no `package.json`. O Dockerfile usava `npm prune --production` no builder, o que removia `prisma` do `node_modules` no container final — mas isso não era problema enquanto as migrações rodavam no pre-deploy (antes do prune).

---

## Solução aplicada

### 1. Mover `prisma` para `dependencies`

**Arquivo:** `backend/package.json`

`prisma` foi movida de `devDependencies` para `dependencies`. Isso garante que o CLI do Prisma esteja presente no `node_modules` após o `npm prune --production`, tornando-o disponível no container runner em produção.

```json
// antes
"devDependencies": {
  "prisma": "^7.5.0",
  ...
}

// depois
"dependencies": {
  "prisma": "^7.5.0",
  ...
}
```

### 2. Mover migração e seed para o CMD do container

**Arquivo:** `backend/Dockerfile`

O CMD foi alterado para executar a migração e o seed antes de iniciar a aplicação, dentro do próprio container runner — que tem acesso à rede privada do Railway:

```dockerfile
# antes
CMD ["node", "src/index.js"]

# depois
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node src/seed.js && node src/index.js"]
```

**Por que `node src/seed.js` e não `npm run db:seed`?**

O `prisma db seed` depende do `prisma.config.ts` para encontrar o comando de seed. Em produção, o `prisma.config.ts` está compilado como `prisma.config.js` (via `tsc`), e o Prisma consegue resolvê-lo. No entanto, chamar `node src/seed.js` diretamente é mais explícito, elimina uma camada de indireção e não depende da resolução de config em runtime.

### 3. Remover o pre-deploy command no Railway

No painel do Railway, o **pre-deploy command do serviço de backend deve ser removido**. As migrações agora fazem parte do ciclo de vida do container e não precisam mais de uma fase separada.

---

## Fluxo após a correção

```
Railway build (Dockerfile builder stage)
  ├── npm ci (instala todas as deps, incluindo prisma)
  ├── npm run build (tsc + tsc-alias → dist/)
  └── npm prune --production (mantém prisma, agora em dependencies)

Railway deploy (container runner)
  ├── node_modules/.bin/prisma migrate deploy  ← acesso à rede privada ✓
  ├── node src/seed.js                          ← acesso à rede privada ✓
  └── node src/index.js                         ← aplicação sobe
```

---

## Trade-offs

| Aspecto | Pre-deploy (antes) | CMD startup (agora) |
|---|---|---|
| Acesso à rede privada | Instável / quebrado | Garantido |
| Falha na migração | Bloqueia o deploy (Railway não sobe o container) | Derruba o container (Railway reinicia) |
| Tempo de startup | Migração separada, app sobe mais rápido | Startup inclui migração |
| Zero-downtime | Deploy só sobe após migração OK | App pode receber tráfego enquanto migra* |

*O Railway, por padrão, mantém o container anterior ativo até o novo ficar healthy. Se o novo container demorar (migração longa), o anterior continua servindo. Para migrações destrutivas ou longas, isso pode ser um problema — mas está fora do escopo do projeto atual.
