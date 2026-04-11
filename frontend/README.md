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
/                            → Página inicial (placeholder)
/login                       → Login (Admin, Coordenador e Aluno)
/register-coordinator        → Cadastro do Coordenador
/register-student            → Cadastro do Aluno
/dashboard/student           → Dashboard do Aluno
/dashboard/coordinator       → Dashboard do Coordenador — Pendentes de Aprovação
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
    ├── pages/
    │   ├── index.tsx                        # Página inicial
    │   ├── login/
    │   │   └── index.tsx                    # Login
    │   ├── register-coordinator/
    │   │   └── index.tsx                    # Cadastro do Coordenador
    │   ├── register-student/
    │   │   └── index.tsx                    # Cadastro do Aluno
    │   └── dashboard/
    │       ├── student/
    │       │   └── index.tsx                # Dashboard do Aluno
    │       └── coordinator/
    │           └── index.tsx                # Dashboard do Coordenador
    └── components/
        ├── ModalNovaDespesa.tsx             # Modal de nova solicitação (aluno)
        └── ModalRejeitar.tsx                # Modal de rejeição com motivo (coordenador)
```

---

### Dashboard do Coordenador (`/dashboard/coordinator`)

Tela principal do coordenador para revisar e processar solicitações de despesa dos alunos.

> Cor tema: verde `#1a5c38`

**Cards de resumo**
- Total de solicitações pendentes (contagem)
- Valor total em análise (soma dos valores pendentes)
- Maior solicitação (valor mais alto entre os pendentes)

**Tabela de pendentes**

Colunas: Solicitação (ícone + nome + REQ-ID) · Projeto · Aluno · Valor · Sugestão de Compra · Data de Submissão · Ações

**Ações disponíveis**

| Ação | Comportamento |
|------|---------------|
| **Aprovar** | Remove a solicitação da fila imediatamente |
| **Rejeitar** | Abre o `ModalRejeitar` para registrar o motivo; remove após confirmação |

**`ModalRejeitar`**
- Exibe nome, REQ-ID e valor da solicitação
- Campo de motivo obrigatório
- Botões: Cancelar / Confirmar Rejeição

**Estado vazio**
- Quando todas as solicitações forem processadas, exibe ícone de confirmação e mensagem
- Quando a busca não retorna resultados, exibe mensagem específica

**Integração futura com backend**

```ts
// Aprovar → substituir por:
await api.patch(`/solicitacoes/${id}`, { status: "Aprovado" });

// Rejeitar → substituir por:
await api.patch(`/solicitacoes/${id}`, { status: "Rejeitado", motivo });

// Lista inicial → adicionar:
useEffect(() => {
  api.get("/solicitacoes?status=Pendente").then(setPendentes);
}, []);
```

---

## Scripts disponíveis

| Comando         | Descrição                        |
|-----------------|----------------------------------|
| `npm run dev`   | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção         |
| `npm run start` | Inicia o servidor em produção    |
| `npm run lint`  | Executa o linter (ESLint)        |
