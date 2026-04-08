# SGDA — Frontend

Sistema de Gestão de Despesas Acadêmicas  
Construído com **Next.js 14**, **TypeScript** e **Tailwind CSS**.

---

## Como rodar

### Localmente

```bash
cd frontend
npm install
npm run dev
```

### Com Docker

```bash
cd frontend
docker compose up --build
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Fluxo de telas

```
/                        → Página inicial (placeholder)
/login                   → Login (Admin, Coordenador e Aluno)
/register-coordinator    → Cadastro do Coordenador
/register-student        → Cadastro do Aluno
```

### Cadastro do Coordenador (`/register-coordinator`)

Tela de registro para coordenadores. Campos obrigatórios:

- Nome Completo
- E-mail
- Senha
- Confirmar Senha
- Código de Convite

> Cor tema: verde `#1a5c38`

---

### Cadastro do Aluno (`/register-student`)

Tela de registro completa para alunos, dividida em seções:

**Informações da Conta**
- E-mail

**Informações Pessoais**
- Nome Completo
- RG ou Passaporte
- CPF
- Data de Nascimento
- Curso / Profissão
- Endereço

**Dados Bancários**
- Código do Banco
- Nome do Banco
- Agência + Dígito
- Conta + Dígito

**Segurança**
- Senha
- Confirmar Senha
- Código de Convite

> Cor tema: índigo `#4F46E5`

---

## Estrutura de pastas relevante

```
frontend/
└── src/
    └── pages/
        ├── index.tsx                        # Página inicial
        ├── register-coordinator/
        │   └── index.tsx                    # Cadastro do Coordenador
        └── register-student/
            └── index.tsx                    # Cadastro do Aluno
```

---

## Scripts disponíveis

| Comando         | Descrição                        |
|-----------------|----------------------------------|
| `npm run dev`   | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção         |
| `npm run start` | Inicia o servidor em produção    |
| `npm run lint`  | Executa o linter (ESLint)        |
