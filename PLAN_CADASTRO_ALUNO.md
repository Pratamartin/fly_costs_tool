# Plano: Tela de Cadastro do Aluno

**Sprint**: Sprint 3 — Frontend Part 1  
**Data**: 2026-05-11  
**Status**: Em andamento  
**Branch**: `sprint3-frontend-part1`

---

## Objetivo

Implementar a tela **Complete Your Student Registration** (`/register-student`) totalmente funcional, integrando com o backend via `POST /v1/auth/register`, com validação inline, estados de loading/erro e redirecionamento pós-cadastro.

---

## Referências de Design

As telas de referência mostram (UX Pilot, frames 1–2):

| Seção | Campos |
|-------|--------|
| **Account Information** | Email (pré-preenchido, somente leitura se vier via convite) |
| **Personal Information** | Full Name *, ID/Passport Number *, CPF *, Date of Birth *, Profession *, Address * |
| **Bank Details** | Bank Code *, Bank Name *, Agency + Digit *, Account Number + Digit * |
| **Security** | Password *, Confirm Password * |
| **Footer** | "Complete Registration" button + "Already have an account? Sign in here" |

---

## Rota

| Rota | Arquivo |
|------|---------|
| `/register-student` | `frontend/src/pages/register-student/index.tsx` |

---

## Contrato de API

### `POST /v1/auth/register`

**Campos aceitos pelo backend (v1):**

```ts
{
  name: string         // Nome completo
  email: string        // E-mail
  password: string     // Mín. 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial
  role: "ALUNO"        // Fixo para esta tela
  inviteCode: string   // Código de convite obrigatório
}
```

**Respostas:**
| Status | Significado |
|--------|-------------|
| 201 | Cadastro criado com sucesso |
| 400 | Código de convite inválido |
| 409 | E-mail já cadastrado |
| 422 | Erro de validação (campo inválido) |

### Campos extras (CPF, passaporte, dados bancários)

O backend **não aceita** esses campos no registro. Estratégia:
1. O formulário os coleta para UX completa (mockup fiel).
2. Após registro + auto-login, são enviados via `PATCH /v1/me`.
3. Enquanto `PATCH /v1/me` não está implementado no backend, os campos extras são **ignorados silenciosamente** — o aluno pode completá-los depois na tela de perfil.

---

## Fluxo de Submit

```
1. Validação client-side (campos obrigatórios + regras de senha + senhas iguais)
   └─ Se inválido → exibir erros inline, não enviar

2. POST /v1/auth/register { name, email, password, role: "ALUNO", inviteCode }
   ├─ 201 → auto-login (POST /v1/auth/login) → salvar token → redirect /dashboard/student
   ├─ 400 → exibir erro no campo "Código de Convite"
   ├─ 409 → exibir erro no campo "E-mail"
   └─ outro → exibir erro genérico no topo do formulário

3. Campos extras (CPF, banco etc.) → chamada futura PATCH /v1/me quando backend suportar
```

---

## Validações Client-Side

| Campo | Regra |
|-------|-------|
| E-mail | Formato válido |
| Nome Completo | Não vazio |
| CPF | Formato `000.000.000-00` (11 dígitos) |
| ID/Passaporte | Não vazio |
| Data de Nascimento | Data válida, não futura |
| Profissão | Não vazia |
| Endereço | Não vazio |
| Código do Banco | Somente números |
| Nome do Banco | Não vazio |
| Agência + Dígito | Não vazio |
| Conta + Dígito | Não vazio |
| Senha | Mín. 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial |
| Confirmar Senha | Igual à senha |
| Código de Convite | Não vazio |

---

## Estados do Componente

```ts
form: {
  email, nomeCompleto, rgPassaporte, cpf,
  dataNascimento, profissao, endereco,
  codigoBanco, nomeBanco, agenciaDigito, contaDigito,
  senha, confirmarSenha, codigoConvite
}

errors: Record<keyof form, string>   // erros por campo
globalError: string | null           // erro geral (acima do botão)
carregando: boolean                  // desabilita botão
mostrarSenha: boolean
mostrarConfirmarSenha: boolean
```

---

## Arquivos Alterados

| Arquivo | Tipo | O que muda |
|---------|------|------------|
| `frontend/src/pages/register-student/index.tsx` | Alterar | Integração API + validações + loading + erros |
| `frontend/src/services/auth/index.ts` | Alterar | Expandir `RegisterPayload` se necessário |

---

## Tasks de Implementação

- [x] Criar este plano
- [x] Atualizar `register-student/index.tsx` com integração à API `register()`
- [x] Adicionar validações inline por campo
- [x] Adicionar loading state no botão de submit
- [x] Adicionar tratamento de erros (409 email, 400 invite code, genérico)
- [x] Corrigir link "Já tem uma conta? Entre aqui" → `/login`
- [x] Auto-login após cadastro bem-sucedido e redirect para `/dashboard/student`
- [ ] Testar fluxo completo com backend rodando (manual)
- [ ] Testar erro de e-mail duplicado
- [ ] Testar erro de código de convite inválido
- [ ] Testar validações de senha (todas as regras)

---

## Notas para Integração Futura

Quando o backend implementar `PATCH /v1/me` com campos estendidos:

1. Após auto-login, chamar `updateProfile(token, { cpf, passport, dateOfBirth, profession, address, bankCode, bankName, bankAgency, bankAccount })`
2. Remover a nota de "campos ignorados" do fluxo acima
3. Atualizar este plano para refletir o fluxo completo

Referência: `frontend/src/services/user/index.ts` → função `updateProfile(token, data)`
