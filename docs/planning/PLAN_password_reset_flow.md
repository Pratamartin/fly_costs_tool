# Plano — Fluxo de Redefinição de Senha

## Contexto

A tela de login não possuía nenhum fluxo de recuperação de acesso. O link "Esqueceu a senha?" apontava para `#`. Este plano cobre a implementação completa do fluxo de redefinição de senha no frontend, com rotas mockadas enquanto o backend ainda não expõe os endpoints.

> **Backend pendente:** `POST /v1/auth/forgot-password` e `POST /v1/auth/reset-password` ainda não implementados. As funções em `services/auth` simulam as chamadas com um delay de 900ms e retornam `ok: true`. Quando o backend estiver pronto, basta remover o mock e descomentar o `fetch` real.

---

## Fluxo Completo

```
/login
  → clica "Esqueceu a senha?"
      → /forgot-password
          → digita e-mail → envia
              → tela de confirmação ("E-mail enviado!")
                  → usuário acessa link no e-mail
                      → /reset-password?token=<jwt>
                          → digita nova senha + confirma
                              → sucesso → redireciona para /login (3s)
```

### Fluxo de erro — token inválido/ausente

```
/reset-password  (sem ?token= ou token malformado)
  → exibe tela "Link inválido"
      → botão "Solicitar novo link" → /forgot-password
```

---

## Mudanças por Arquivo

### `pages/login/index.tsx`

- Link "Esqueceu a senha?" alterado de `href="#"` para `href="/forgot-password"`

---

### `services/auth/index.ts`

Dois novos tipos e duas novas funções adicionadas ao final do arquivo:

```ts
// Tipos
type ForgotPasswordResult = { ok: true } | { ok: false; error: "VALIDATION_ERROR" | "UNKNOWN" }
type ResetPasswordError   = "TOKEN_EXPIRED" | "TOKEN_INVALID" | "VALIDATION_ERROR" | "UNKNOWN"
type ResetPasswordResult  = { ok: true } | { ok: false; error: ResetPasswordError }

// Funções (mockadas — substituir pelo fetch real quando backend estiver pronto)
forgotPassword(email: string): Promise<ForgotPasswordResult>
resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult>
```

Endpoints futuros:
| Função | Método | Rota |
|---|---|---|
| `forgotPassword` | POST | `/v1/auth/forgot-password` |
| `resetPassword` | POST | `/v1/auth/reset-password` |

---

### `pages/forgot-password/index.tsx` — NOVO

**Rota:** `/forgot-password`

**Painel esquerdo:** padrão das outras telas de auth (fundo `#1e2d3d`, círculos decorativos, logo SGDA). Exibe os 3 passos do fluxo como cards numerados.

**Painel direito — dois estados:**

| Estado | Conteúdo |
|---|---|
| Formulário | Campo e-mail + botão "Enviar link de redefinição" |
| Confirmação | Ícone verde, e-mail exibido, botão "Voltar ao Login", link "Reenviar para outro e-mail" |

---

### `pages/reset-password/index.tsx` — NOVO

**Rota:** `/reset-password?token=<jwt>`

**Painel esquerdo:** mesma identidade visual. Lista os 3 requisitos de senha como bullets.

**Painel direito — três estados:**

| Estado | Trigger | Conteúdo |
|---|---|---|
| Carregando | `router.isReady = false` | — (aguarda hidratação do Next.js) |
| Link inválido | `token` ausente na URL | Ícone vermelho, botão "Solicitar novo link" → `/forgot-password` |
| Formulário | `token` presente | Nova senha + confirmar senha + botão "Redefinir senha" |
| Sucesso | `result.ok === true` | Ícone verde, redirect automático para `/login` em 3s + botão de atalho |

**Validação inline (campo nova senha):**

Exibida após o usuário tocar o campo (`onBlur`) ou ao tentar submeter. Três indicadores ✅/❌ em tempo real:

- Mínimo de 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 número

**Validação do campo confirmar senha:**

Mensagem de erro inline "As senhas não coincidem" exibida enquanto os dois campos divergem, com borda vermelha no input.

**Erros de API mapeados:**

| `result.error` | Mensagem exibida |
|---|---|
| `TOKEN_EXPIRED` | "Este link expirou. Solicite um novo link de redefinição." |
| `TOKEN_INVALID` | "Link inválido. Solicite um novo link de redefinição." |
| `VALIDATION_ERROR` / `UNKNOWN` | "Não foi possível redefinir sua senha. Tente novamente." |

---

## Integração com backend (quando disponível)

Substituir os mocks em `services/auth/index.ts`:

```ts
// forgotPassword
export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  const res = await fetch(`${API_URL}/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (res.status === 200 || res.status === 204) return { ok: true }
  if (res.status === 422) return { ok: false, error: "VALIDATION_ERROR" }
  return { ok: false, error: "UNKNOWN" }
}

// resetPassword
export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  const res = await fetch(`${API_URL}/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  })
  if (res.status === 200 || res.status === 204) return { ok: true }
  if (res.status === 401) return { ok: false, error: "TOKEN_EXPIRED" }
  if (res.status === 404) return { ok: false, error: "TOKEN_INVALID" }
  if (res.status === 422) return { ok: false, error: "VALIDATION_ERROR" }
  return { ok: false, error: "UNKNOWN" }
}
```

> Os status codes acima são uma sugestão. Ajustar conforme o contrato real do backend.

---

## O que NÃO foi feito neste PR

- Nenhuma chamada real ao backend (mock proposital)
- Sem envio de e-mail real
- Sem expiração de token no frontend (o backend é responsável por isso)
- A rota `/login/login-forgot` (arquivo vazio pré-existente) não foi usada nem removida

---

## Próximos passos

- [ ] Implementar `POST /v1/auth/forgot-password` no backend
- [ ] Implementar `POST /v1/auth/reset-password` no backend
- [ ] Substituir mocks por chamadas reais em `services/auth/index.ts`
- [ ] Ajustar status codes e payload conforme contrato do backend
- [X] Remover ou redirecionar `/login/login-forgot` (arquivo vazio)
