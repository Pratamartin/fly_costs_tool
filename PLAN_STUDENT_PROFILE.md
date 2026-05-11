# Plano: Tela de Perfil do Aluno

**Sprint**: Próxima  
**Data**: 2026-05-11  
**Status**: Em andamento

---

## Objetivo

Criar a página **Student Profile** no portal do aluno, permitindo que o estudante visualize e edite suas informações pessoais, dados bancários, contato de emergência e documentos — seguindo o design system do projeto (Tailwind CSS, inline SVGs, padrão de páginas existentes).

---

## Screens de Referência

As telas de referência mostram:
- **Header** de perfil com foto/avatar, nome, curso, ano, badges de status e ícones de redes sociais
- **Seção Personal Information** — grid 2 colunas com botão Edit
- **Seção Bank Details** — campos sensíveis mascarados com toggle Show/Hide e botão Edit
- **Seção Emergency Contact** — contato de emergência com botão Edit
- **Seção Documents** — lista de arquivos com ícone de download

---

## Estrutura de Arquivos

```
frontend/src/
├── pages/dashboard/student/
│   ├── index.tsx                          (existente — não alterar)
│   └── profile/
│       └── index.tsx                      (NOVO — página principal)
├── components/
│   ├── StudentSidebar.tsx                 (ALTERAR — adicionar link "My Profile")
│   ├── ModalEditarPerfil.tsx              (NOVO — editar informações pessoais)
│   ├── ModalEditarBanco.tsx               (NOVO — editar dados bancários)
│   └── ModalEditarContato.tsx             (NOVO — editar contato de emergência)
```

---

## Rota

| Rota | Arquivo |
|------|---------|
| `/dashboard/student/profile` | `pages/dashboard/student/profile/index.tsx` |

---

## Dados

### Dados reais (via API já existente)
| Campo | Fonte |
|-------|-------|
| `name` | `GET /v1/me` → `UserProfile.name` |
| `email` | `GET /v1/me` → `UserProfile.email` |
| `role` | `GET /v1/me` → `UserProfile.role` |

### Dados mockados (sem API por enquanto)
Serão inicializados como constante `MOCK_PROFILE` dentro da página e substituídos por chamadas reais quando o backend implementar `GET /v1/me/profile-extended` ou similar.

```ts
const MOCK_PROFILE = {
  fullName: "Sarah Elizabeth Smith",
  passport: "AB123456789",
  cpf: "123.456.789-00",
  dateOfBirth: "March 15, 2003",
  profession: "Student",
  address: "123 Oak Street, Apartment 4B, Boston, MA 02115",
  course: "Computer Science Major",
  graduationYear: "Class of 2025",
  badges: ["Active Student", "Good Standing", "Dean's List"],
  socialLinks: { linkedin: "#", github: "#", email: "" },
  bankDetails: {
    bankCode: "341",
    bankName: "Itaú Unibanco",
    agency: "1234-5",
    account: "123456-7",
  },
  emergencyContact: {
    name: "Robert Smith",
    relationship: "Father",
    phone: "+1 (555) 987-6543",
    email: "robert.smith@email.com",
  },
  documents: [
    { id: "1", name: "Transcript", subtitle: "Updated Dec 2023", type: "pdf" },
    { id: "2", name: "Enrollment Letter", subtitle: "Fall 2023", type: "doc" },
    { id: "3", name: "Student ID Card", subtitle: "Valid until 2025", type: "id" },
  ],
};
```

---

## Componentes a Criar

### 1. `pages/dashboard/student/profile/index.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  StudentSidebar (existente)                          │
├─────────────────────────────────────────────────────┤
│  Header: "Student Profile" + "Edit Profile" button  │
│  ┌─────────────────────────────────────────────┐    │
│  │  [Avatar] Nome  •  Curso  •  Ano  badges    │    │
│  │           🔗 LinkedIn  GitHub  Email        │    │
│  └─────────────────────────────────────────────┘    │
│  ┌───────────────────────────────────────────┐      │
│  │  Personal Information              [Edit] │      │
│  │  Full Name    |  ID/Passport              │      │
│  │  CPF          |  Date of Birth            │      │
│  │  Profession   |  Email Address            │      │
│  │  Address (full width)                     │      │
│  └───────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────┐      │
│  │  Bank Details                     [Show]  │      │
│  │  Bank Code    |  Bank Name                │      │
│  │  Agency+Digit |  Account+Digit            │      │
│  └───────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────┐      │
│  │  Emergency Contact                [Edit]  │      │
│  │  Contact Name  |  Relationship            │      │
│  │  Phone         |  Email                   │      │
│  └───────────────────────────────────────────┘      │
│  ┌───────────────────────────────────────────┐      │
│  │  Documents                                │      │
│  │  📄 Transcript         Updated Dec 2023 ⬇│      │
│  │  📋 Enrollment Letter  Fall 2023        ⬇│      │
│  │  🪪 Student ID Card    Valid until 2025 ⬇│      │
│  └───────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

**Estados**:
- `userProfile: UserProfile | null` — dados reais da API
- `profile` — dados mockados (pessoal, banco, contato, docs)
- `bankVisible: boolean` — toggle Show/Hide dados bancários
- `modalAberto: "perfil" | "banco" | "contato" | null`
- `carregando: boolean`

### 2. `components/StudentSidebar.tsx` (alteração)

Adicionar item de navegação "My Profile" com ícone de usuário, linkando para `/dashboard/student/profile`.

### 3. `components/ModalEditarPerfil.tsx`

Modal para editar:
- Full Name, CPF, Date of Birth, Passport/ID, Profession, Address

Campos: inputs controlados, botão Salvar (atualiza estado local).

### 4. `components/ModalEditarBanco.tsx`

Modal para editar:
- Bank Code, Bank Name, Agency + Digit, Account Number + Digit

### 5. `components/ModalEditarContato.tsx`

Modal para editar:
- Contact Name, Relationship, Phone Number, Email

---

## Padrões a Seguir

| Aspecto | Padrão |
|---------|--------|
| Cor primária | `#4F46E5` (indigo — student role) |
| Ícones | Inline SVG, 20×20, `fill="currentColor"` |
| Cards | `rounded-xl border border-gray-200 bg-white shadow-sm` |
| Labels | `text-xs font-semibold uppercase tracking-wider text-gray-400` |
| Valores | `text-sm text-gray-900` |
| Botão Edit | `text-sm text-[#4F46E5] hover:underline flex items-center gap-1` |
| Loading spinner | mesmo do student/index.tsx |
| Header de seção | `text-base font-semibold text-gray-800 flex items-center gap-2` |
| Avatar | Iniciais em círculo `bg-[#4F46E5] text-white` (fallback se sem foto) |

---

## Tasks de Implementação

- [x] Criar este plano
- [x] Adicionar "My Profile" no `StudentSidebar.tsx`
- [x] Criar `pages/dashboard/student/profile/index.tsx`
- [x] Criar `components/ModalEditarPerfil.tsx`
- [x] Criar `components/ModalEditarBanco.tsx`
- [x] Criar `components/ModalEditarContato.tsx`
- [ ] Testar navegação e edição dos dados (manual)

---

## Notas para Integração Futura

Quando o backend expor endpoint de perfil estendido, substituir `MOCK_PROFILE` por:
- `GET /v1/me/profile` → dados pessoais completos
- `PATCH /v1/me/profile` → atualizar dados pessoais
- `GET /v1/me/bank-details` → dados bancários
- `PATCH /v1/me/bank-details` → atualizar dados bancários

Atualizar também o tipo `UserProfile` em `services/user/index.ts` para incluir os campos estendidos.
