# Plano — Dropdown de Categoria na Discriminação de Custos

## Contexto

Na tela de detalhe da despesa (`/dashboard/admin/expenses/detail`), quando o status é `EM_PROCESSAMENTO`, o admin pode adicionar itens de custo. Hoje o campo "nome da rubrica" é um `<input type="text">` livre. O objetivo é substituí-lo por um `<select>` populado via `GET /v1/expenses/categories`, renomeando o conceito de "rubrica" para "tipo de custo" em toda a seção.

O service `listCategories` já existe em `frontend/src/services/categories/index.ts` e não precisa de alterações. O payload de `createCostBreakdown` já espera `subcategoryName: string`, que bate exatamente com o campo `name` retornado pela API.

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `frontend/src/pages/dashboard/admin/expenses/detail/index.tsx` | Estado + fetch + UI |

Nenhum service, nenhum backend.

---

## Passos de implementação

### 1. Importar `listCategories` e o tipo

```ts
import { listCategories, type ExpenseCategory } from "@/services/categories";
```

### 2. Adicionar estado de categorias

```ts
const [categories, setCategories] = useState<ExpenseCategory[]>([]);
const [carregandoCategorias, setCarregandoCategorias] = useState(false);
```

### 3. Buscar categorias ao carregar a despesa

Dentro de `carregarDados`, após confirmar `result.data.status === "EM_PROCESSAMENTO"`:

```ts
setCarregandoCategorias(true);
const catResult = await listCategories(undefined, token);
if (catResult.ok) setCategories(catResult.data);
setCarregandoCategorias(false);
```

### 4. Buscar categorias ao vincular projeto

Dentro de `handleVincularProjeto`, após `result.ok` atualizar o expense (status vira `EM_PROCESSAMENTO`):

```ts
const catResult = await listCategories(undefined, token);
if (catResult.ok) setCategories(catResult.data);
```

### 5. Substituir `<input>` por `<select>` no formulário e adicionar campo de anexo

**Antes (linha ~583):**
```tsx
<input
  type="text"
  placeholder="Nome da rubrica"
  value={cbSubcategoria}
  onChange={(e) => { setCbSubcategoria(e.target.value); setErroCusto(null); }}
  disabled={adicionandoCusto}
  className="..."
/>
```

**Depois:**
```tsx
<select
  value={cbSubcategoria}
  onChange={(e) => { setCbSubcategoria(e.target.value); setErroCusto(null); }}
  disabled={adicionandoCusto || carregandoCategorias}
  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition"
>
  <option value="">
    {carregandoCategorias ? "Carregando categorias..." : "Selecionar tipo de custo..."}
  </option>
  {categories.map((cat) => (
    <option key={cat.id} value={cat.name}>
      {cat.name}
    </option>
  ))}
</select>
```

> O `value` do `<option>` é `cat.name` porque o payload da API espera `subcategoryName: string`.

### 5b. Campo de anexo (mockado — integração backend futura)

Adicionar estado para o arquivo selecionado:

```ts
const [cbAnexo, setCbAnexo] = useState<File | null>(null);
```

Adicionar campo de upload abaixo do par select+valor, antes do botão de submit:

```tsx
<div>
  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
    Anexo (opcional)
  </label>
  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 hover:border-blue-400 hover:bg-blue-50 transition">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 shrink-0">
      <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
    </svg>
    <span className="flex-1 truncate text-sm text-gray-500">
      {cbAnexo ? cbAnexo.name : "Selecionar arquivo..."}
    </span>
    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      className="sr-only"
      disabled={adicionandoCusto}
      onChange={(e) => setCbAnexo(e.target.files?.[0] ?? null)}
    />
  </label>
  {cbAnexo && (
    <button
      type="button"
      onClick={() => setCbAnexo(null)}
      className="mt-1 text-xs text-red-500 hover:underline"
    >
      Remover anexo
    </button>
  )}
  <p className="mt-1 text-xs text-gray-400">PDF, JPG ou PNG. Integração com backend em sprint futura.</p>
</div>
```

O `cbAnexo` é mantido em estado mas **não é enviado** no payload do `createCostBreakdown` por enquanto. Ao submeter com sucesso, limpar também com `setCbAnexo(null)`.

---

### 6. Renomear textos de "Rubrica" → "Tipo de Custo"

| Localização | De | Para |
|---|---|---|
| Cabeçalho da tabela (`<th>`) | `Rubrica` | `Tipo de Custo` |
| Contador badge | `rubrica(s)` | `custo(s)` |
| Texto quando tabela vazia | `Nenhuma rubrica adicionada ainda.` | `Nenhum custo adicionado ainda.` |
| Label acima do formulário | `Adicionar Rubrica` | `Adicionar Custo` |
| Botão de submit | `Adicionar Rubrica` | `Adicionar Custo` |
| Mensagem de erro `BAD_REQUEST` | `Rubrica inválida para este projeto.` | `Categoria inválida para este projeto.` |
| Mensagem de erro `CONFLICT` | `Esta rubrica já foi adicionada.` | `Este tipo de custo já foi adicionado.` |

---

## Fora do escopo desta sprint

Conforme o documento de referência (`planideia-sprint3-anexoadmin.md`), os itens abaixo ficam para uma próxima sprint:

- Selecionar todos os custos
- Deletar todos os custos de uma vez
- Deletar custo individual da tabela
- Envio real do anexo ao backend (rota existe, integração pendente)
