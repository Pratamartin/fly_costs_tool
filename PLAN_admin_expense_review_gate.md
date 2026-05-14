# Plano — Admin Expense Detail: Review Gate antes de Vincular Projeto

## Fluxo Correto de Negócio

```
Aluno cria despesa
  → Coordenador revisa e APROVA
      → Admin analisa dados do aluno (destino, datas, memorando, dados bancários)
          → Admin vincula projeto + cria discriminação de custos + anexa arquivos
```

> **Bug conhecido (futuro):** atualmente a solicitação chega tanto para o Admin quanto para o
> Coordenador ao mesmo tempo. O correto é: só chegar para o Admin após o Coordenador aprovar.
> Correção agendada para sprint futura.

## Contexto

Quando uma despesa chega ao admin com status `APROVADO` (aprovada pelo coordenador), o admin
precisa **validar os dados antes de vincular o projeto**. Hoje a tela vai direto para o formulário
de vinculação sem nenhuma etapa de revisão.

O novo fluxo insere um **portão de revisão (review gate)** entre a aprovação do coordenador e a
vinculação de projeto pelo admin.

---

## Fluxo Atual (APROVADO)

```
Status: APROVADO
→ Seção "Vincular Projeto" visível diretamente
```

## Fluxo Proposto (APROVADO)

```
Status: APROVADO
→ Seção "Memorando" (se houver anexo) — badge "Memorando Recebido"
→ Card "Revisão de Dados" (NOVO — review gate)
    ├─ Exibe resumo dos dados: destino, período, solicitante, dados bancários (futuro)
    ├─ Botão "Solicitar Correção" → abre ModalSolicitarCorrecao → EM_EDICAO
    └─ Botão "Confirmar Dados ✓" → desbloqueia seção "Vincular Projeto"
→ Seção "Vincular Projeto" (bloqueada até confirmação)
```

---

## Mudanças por Arquivo

### `admin/expenses/detail/index.tsx`

#### 1. Estado novo
```ts
const [dadosConfirmados, setDadosConfirmados] = useState(false)
```

#### 2. Seção "Memorando Recebido" (refatoração do bloco atual)
- Atualmente o memorando aparece dentro de "Visão Geral da Despesa"
- Mover para card próprio quando `status === "APROVADO"`, com badge verde "Memorando Recebido"
- Manter o botão "Baixar PDF"

#### 3. Card "Revisão de Dados" — NOVO (só quando APROVADO)

Posicionado entre a "Visão Geral" e o "Vincular Projeto". Exibe:

| Campo | Fonte |
|---|---|
| Título | `expense.title` |
| Descrição | `expense.description` |
| Destino | `expense.city`, `expense.state`, `expense.country` |
| Período | `expense.departureDate` → `expense.returnDate` |
| Solicitante | `expense.student.name` |
| Memorando | badge se `expense.attachmentKey` presente |
| Dados Bancários | — (futuro, placeholder por enquanto) |

**Rodapé do card com dois botões:**
- `"Solicitar Correção"` (âmbar) → abre `ModalSolicitarCorrecao`
- `"Confirmar Dados ✓"` (verde) → `setDadosConfirmados(true)`

Quando `dadosConfirmados = true`:
- O card muda para um banner compacto verde: _"Dados confirmados — prossiga para vincular o projeto."_
- A seção "Vincular Projeto" se torna visível

#### 4. Seção "Vincular Projeto"
- Renderiza `{dadosConfirmados && <VincularProjetoSection />}` em vez de render direto

#### 5. Dados bancários (placeholder)
- No card de revisão, exibir linha com ícone de banco + texto _"Dados bancários: consultar perfil do aluno"_
- A refatoração completa dos dados bancários fica para o próximo PR

---

## Comportamento por Estado

| Status | Novo comportamento |
|---|---|
| `PENDENTE` | Sem alteração — botões Solicitar Correção / Aprovar / Rejeitar |
| `APROVADO` | Review gate visível, Vincular Projeto bloqueado até confirmação |
| `EM_EDICAO` | Sem alteração — banner âmbar com correctionNote |
| `EM_PROCESSAMENTO` | Sem alteração — discriminação de custos |
| `REJEITADO` | Sem alteração — banner vermelho |

---

## Opções de UX para o Review Gate

### Opção A — Card inline com dois botões (recomendada)
- Review gate sempre visível na página
- Admin vê os dados e clica em um dos botões sem abrir modal extra
- Mais rápido, menos cliques

```
┌──────────────────────────────────────────────────────┐
│  📋  Revisão de Dados pelo Admin                      │
│  Confirme se os dados estão corretos antes de         │
│  vincular o projeto.                                  │
│                                                       │
│  Título        dfdfdfdfd                              │
│  Destino       São Paulo, BR-SP                       │
│  Período       12/05 → 14/05/2026                     │
│  Solicitante   Codibentinho                           │
│  Memorando     ✅ PDF recebido                        │
│  Dados banc.   — (verificar perfil do aluno)          │
│                                                       │
│  [Solicitar Correção]          [Confirmar Dados ✓]   │
└──────────────────────────────────────────────────────┘
```

### Opção B — Modal de confirmação
- Botão "Revisar e Continuar" no header
- Abre modal com os dados + opção de confirmar ou pedir correção
- Mais cliques, mas separa a revisão da leitura da página

---

## O que NÃO muda neste PR

- Lógica de backend (nenhuma nova chamada de API)
- `ModalSolicitarCorrecao` (já existente)
- Dados bancários completos (próximo PR)
- Estados `EM_PROCESSAMENTO`, `REJEITADO`, `PENDENTE`, `EM_EDICAO`

---

## Próximos passos (fora deste PR)

- [ ] Refatorar dados bancários: exibir `bankCode`, `bankName`, `agency`, `account` do aluno no review gate
- [ ] Buscar dados bancários via `GET /v1/users/:id` ou ampliar `GET /v1/expenses/:id` com dados do aluno
- [ ] Decidir se coordenador também precisa de um review gate na sua tela de aprovação
