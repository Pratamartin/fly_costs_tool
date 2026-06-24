import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import { performLogout } from "@/lib/logout";
import StudentSidebar from "@/components/StudentSidebar";
import CoordinatorSidebar from "@/components/CoordinatorSidebar";
import AdminSidebar from "@/components/AdminSidebar";
import { getMe, updateProfile, type UserProfile, type UpdateProfileData } from "@/services/user";
import { toast } from "@/lib/toast";
import { profilePersonalSchema } from "@/lib/schemas";
import ThemeToggle from "@/components/ThemeToggle";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonalForm {
  name: string;
  email: string;
  cpf: string;
  rgPassaporte: string;
  birthDate: string;
  profession: string;
  address: string;
}

interface BankForm {
  bankCode: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  pixKey: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roleLabel(role: UserProfile["role"]) {
  if (role === "ALUNO") return "Aluno";
  if (role === "COORDENADOR") return "Coordenador";
  return "Administrador";
}

function roleBadgeClass(role: UserProfile["role"]) {
  if (role === "ALUNO") return "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/30";
  if (role === "COORDENADOR") return "bg-[#1a5c38]/10 text-[#1a5c38] border-[#1a5c38]/30";
  return "bg-[#1e2d3d]/10 text-[#1e2d3d] border-[#1e2d3d]/30";
}

function roleGradient(role: UserProfile["role"]) {
  if (role === "ALUNO") return "from-[#4F46E5] to-[#7C3AED]";
  if (role === "COORDENADOR") return "from-[#1a5c38] to-[#2d8a5e]";
  return "from-[#1e2d3d] to-[#2c4a6e]";
}

function roleAvatarClass(role: UserProfile["role"]) {
  if (role === "ALUNO") return "bg-[#4F46E5]";
  if (role === "COORDENADOR") return "bg-[#1a5c38]";
  return "bg-[#1e2d3d]";
}

function profileToPersonalForm(p: UserProfile): PersonalForm {
  return {
    name: p.name ?? "",
    email: p.email ?? "",
    cpf: p.cpf ?? "",
    rgPassaporte: p.rgPassaporte ?? "",
    birthDate: p.birthDate ?? "",
    profession: p.profession ?? "",
    address: p.address ?? "",
  };
}

function profileToBankForm(p: UserProfile): BankForm {
  return {
    bankCode: p.bankCode ?? "",
    bankName: p.bankName ?? "",
    bankAgency: p.bankAgency ?? "",
    bankAccount: p.bankAccount ?? "",
    pixKey: p.pixKey ?? "",
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || "—"}</p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:ring-1 dark:placeholder-gray-500 ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-400 bg-white dark:bg-gray-800"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-[#4F46E5] focus:ring-[#4F46E5]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">{children}</div>;
}

function SectionHeader({
  icon,
  title,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
}: {
  icon: React.ReactNode;
  title: string;
  editing: boolean;
  saving?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        {icon}
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] disabled:opacity-60"
          >
            {saving && (
              <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Salvar
          </button>
        </div>
      ) : (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm font-medium text-[#4F46E5] hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
          Editar
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Personal section
  const [personalForm, setPersonalForm] = useState<PersonalForm>({ name: "", email: "", cpf: "", rgPassaporte: "", birthDate: "", profession: "", address: "" });
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalErrors, setPersonalErrors] = useState<Partial<Record<keyof PersonalForm, string>>>({});

  // Bank section
  const [bankForm, setBankForm] = useState<BankForm>({ bankCode: "", bankName: "", bankAgency: "", bankAccount: "", pixKey: "" });
  const [editingBank, setEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankErrors, setBankErrors] = useState<Partial<Record<keyof BankForm, string>>>({});
  const [bankVisible, setBankVisible] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    getMe(token).then((result) => {
      if (result.ok) {
        setUserProfile(result.data);
        setPersonalForm(profileToPersonalForm(result.data));
        setBankForm(profileToBankForm(result.data));
      } else {
        useAuthStore.getState().clearToken();
        localStorage.removeItem("accessToken");
        router.push("/login");
      }
    }).finally(() => setCarregando(false));
  }, [router]);

  async function handleLogout() {
    await performLogout(router);
  }

  // Personal edit
  function startEditPersonal() {
    if (userProfile) setPersonalForm(profileToPersonalForm(userProfile));
    setPersonalErrors({});
    setEditingPersonal(true);
  }

  function cancelEditPersonal() {
    if (userProfile) setPersonalForm(profileToPersonalForm(userProfile));
    setPersonalErrors({});
    setEditingPersonal(false);
  }

  async function savePersonal() {
    const parsed = profilePersonalSchema.safeParse({
      name: personalForm.name,
      cpf: personalForm.cpf || undefined,
      rgPassaporte: personalForm.rgPassaporte || undefined,
    });

    if (!parsed.success) {
      const errors: Partial<Record<keyof PersonalForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof PersonalForm;
        if (field) errors[field] = issue.message;
      }
      setPersonalErrors(errors);
      return;
    }

    const token = getToken();
    if (!token) return;

    setSavingPersonal(true);
    const isAluno = userProfile?.role === "ALUNO";
    const data: UpdateProfileData = {
      name: personalForm.name,
      email: personalForm.email || undefined,
      ...(isAluno && {
        cpf: personalForm.cpf || undefined,
        rgPassaporte: personalForm.rgPassaporte || undefined,
        birthDate: personalForm.birthDate || undefined,
        profession: personalForm.profession || undefined,
        address: personalForm.address || undefined,
      }),
    };

    const result = await updateProfile(token, data);
    setSavingPersonal(false);

    if (result.ok) {
      setUserProfile(result.data);
      setPersonalForm(profileToPersonalForm(result.data));
      setEditingPersonal(false);
      toast.success("Informações pessoais salvas!");
    } else if (result.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else if (result.error === "FORBIDDEN") {
      toast.error("Sem permissão para editar dados de perfil.");
      setEditingPersonal(false);
    } else if (result.error === "CPF_CONFLICT") {
      setPersonalErrors({ cpf: "Este CPF já está cadastrado por outro usuário." });
      toast.error("CPF já cadastrado.");
    } else if (result.error === "EMAIL_CONFLICT") {
      setPersonalErrors({ email: "Este e-mail já está cadastrado por outro usuário." });
      toast.error("E-mail já cadastrado.");
    } else if (result.error === "VALIDATION_ERROR" && result.fieldErrors) {
      setPersonalErrors(result.fieldErrors as Partial<Record<keyof PersonalForm, string>>);
      toast.error("Corrija os campos destacados");
    } else {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  }

  // Bank edit
  function startEditBank() {
    if (userProfile) setBankForm(profileToBankForm(userProfile));
    setBankErrors({});
    setEditingBank(true);
  }

  function cancelEditBank() {
    if (userProfile) setBankForm(profileToBankForm(userProfile));
    setBankErrors({});
    setEditingBank(false);
  }

  async function saveBank() {
    const token = getToken();
    if (!token) return;

    setSavingBank(true);
    const data: UpdateProfileData = {
      bankCode: bankForm.bankCode || undefined,
      bankName: bankForm.bankName || undefined,
      bankAgency: bankForm.bankAgency || undefined,
      bankAccount: bankForm.bankAccount || undefined,
      pixKey: bankForm.pixKey || undefined,
    };

    const result = await updateProfile(token, data);
    setSavingBank(false);

    if (result.ok) {
      setUserProfile(result.data);
      setBankForm(profileToBankForm(result.data));
      setEditingBank(false);
      toast.success("Dados bancários salvos!");
    } else if (result.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else if (result.error === "VALIDATION_ERROR" && result.fieldErrors) {
      setBankErrors(result.fieldErrors as Partial<Record<keyof BankForm, string>>);
      toast.error("Corrija os campos destacados");
    } else {
      toast.error("Erro ao salvar dados bancários. Tente novamente.");
    }
  }

  function setPersonalField<K extends keyof PersonalForm>(field: K, value: string) {
    setPersonalForm((prev) => ({ ...prev, [field]: value }));
    if (personalErrors[field]) setPersonalErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function setBankField<K extends keyof BankForm>(field: K, value: string) {
    setBankForm((prev) => ({ ...prev, [field]: value }));
    if (bankErrors[field]) setBankErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function maskValue(v: string) {
    return v ? "•".repeat(Math.min(v.length, 12)) : "—";
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (carregando || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-8 w-8 animate-spin text-[#4F46E5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Sidebar per role
  // ---------------------------------------------------------------------------

  const sidebar =
    userProfile.role === "ADMIN" ? (
      <AdminSidebar active="profile" userName={userProfile.name} />
    ) : userProfile.role === "COORDENADOR" ? (
      <CoordinatorSidebar
        active={null}
        onTabChange={() => router.push("/dashboard/coordinator")}
        counts={{ PENDENTE: 0, APROVADO: 0, REJEITADO: 0 }}
        userName={userProfile.name}
        onLogout={handleLogout}
      />
    ) : (
      <StudentSidebar userName={userProfile.name} onLogout={handleLogout} />
    );

  const isAluno = userProfile.role === "ALUNO";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {sidebar}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:px-8 sm:py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">Meu Perfil</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">Visualize e gerencie suas informações</p>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-3xl space-y-5">

            {/* Hero card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
              <div className={`h-24 bg-gradient-to-r ${roleGradient(userProfile.role)}`} />
              <div className="relative px-6 pb-6">
                <div className={`absolute -top-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white dark:border-gray-900 ${roleAvatarClass(userProfile.role)} text-xl font-bold text-white shadow-md`}>
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-20 pt-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">{userProfile.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(userProfile.role)}`}>
                      {roleLabel(userProfile.role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <SectionCard>
              <SectionHeader
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-500">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                }
                title="Dados Pessoais"
                editing={editingPersonal}
                saving={savingPersonal}
                onEdit={startEditPersonal}
                onSave={savePersonal}
                onCancel={cancelEditPersonal}
              />

              {editingPersonal ? (
                <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
                  <div className="col-span-1 sm:col-span-2">
                    <FormField label="Nome Completo *" value={personalForm.name} onChange={(v) => setPersonalField("name", v)} error={personalErrors.name} />
                  </div>
                  <FormField label="E-mail Principal" value={personalForm.email} onChange={(v) => setPersonalField("email", v)} type="email" error={personalErrors.email} />
                  {isAluno && (
                    <>
                      <FormField label="CPF" value={personalForm.cpf} onChange={(v) => setPersonalField("cpf", v)} placeholder="000.000.000-00" error={personalErrors.cpf} />
                      <FormField label="RG / Passaporte" value={personalForm.rgPassaporte} onChange={(v) => setPersonalField("rgPassaporte", v)} error={personalErrors.rgPassaporte} />
                      <FormField label="Data de Nascimento" value={personalForm.birthDate} onChange={(v) => setPersonalField("birthDate", v)} type="date" error={personalErrors.birthDate} />
                      <FormField label="Profissão" value={personalForm.profession} onChange={(v) => setPersonalField("profession", v)} error={personalErrors.profession} />
                      <div className="col-span-1 sm:col-span-2">
                        <FormField label="Endereço Completo" value={personalForm.address} onChange={(v) => setPersonalField("address", v)} error={personalErrors.address} />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 py-5 sm:grid-cols-2">
                  <InfoField label="Nome Completo" value={userProfile.name} />
                  <InfoField label="E-mail Principal" value={userProfile.email} />
                  {isAluno && (
                    <>
                      <InfoField label="CPF" value={userProfile.cpf ?? ""} />
                      <InfoField label="RG / Passaporte" value={userProfile.rgPassaporte ?? ""} />
                      <InfoField label="Data de Nascimento" value={userProfile.birthDate ?? ""} />
                      <InfoField label="Profissão" value={userProfile.profession ?? ""} />
                      <div className="col-span-1 sm:col-span-2">
                        <InfoField label="Endereço" value={userProfile.address ?? ""} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Bank Details — students only */}
            {isAluno && (
              <SectionCard>
                <SectionHeader
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-500">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  }
                  title="Dados Bancários"
                  editing={editingBank}
                  saving={savingBank}
                  onEdit={startEditBank}
                  onSave={saveBank}
                  onCancel={cancelEditBank}
                />

                {editingBank ? (
                  <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
                    <FormField label="Código do Banco" value={bankForm.bankCode} onChange={(v) => setBankField("bankCode", v)} placeholder="341" error={bankErrors.bankCode} />
                    <FormField label="Nome do Banco" value={bankForm.bankName} onChange={(v) => setBankField("bankName", v)} error={bankErrors.bankName} />
                    <FormField label="Agência + Dígito" value={bankForm.bankAgency} onChange={(v) => setBankField("bankAgency", v)} placeholder="0000-0" error={bankErrors.bankAgency} />
                    <FormField label="Conta + Dígito" value={bankForm.bankAccount} onChange={(v) => setBankField("bankAccount", v)} placeholder="000000-0" error={bankErrors.bankAccount} />
                    <div className="col-span-1 sm:col-span-2">
                      <FormField label="Chave PIX" value={bankForm.pixKey} onChange={(v) => setBankField("pixKey", v)} placeholder="CPF, e-mail, telefone ou chave aleatória" error={bankErrors.pixKey as string | undefined} />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Atenção: esses dados serão usados para reembolso de despesas aprovadas.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-end border-b border-gray-50 dark:border-gray-800 px-6 py-2">
                      <button
                        onClick={() => setBankVisible((v) => !v)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        {bankVisible ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                              <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                            </svg>
                            Ocultar
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                            </svg>
                            Exibir dados
                          </>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 py-5 sm:grid-cols-2">
                      <InfoField label="Código do Banco" value={bankVisible ? (userProfile.bankCode ?? "") : maskValue(userProfile.bankCode ?? "")} />
                      <InfoField label="Nome do Banco" value={bankVisible ? (userProfile.bankName ?? "") : maskValue(userProfile.bankName ?? "")} />
                      <InfoField label="Agência + Dígito" value={bankVisible ? (userProfile.bankAgency ?? "") : maskValue(userProfile.bankAgency ?? "")} />
                      <InfoField label="Conta + Dígito" value={bankVisible ? (userProfile.bankAccount ?? "") : maskValue(userProfile.bankAccount ?? "")} />
                      <div className="col-span-1 sm:col-span-2">
                        <InfoField label="Chave PIX" value={bankVisible ? (userProfile.pixKey ?? "") : maskValue(userProfile.pixKey ?? "")} />
                      </div>
                    </div>
                  </>
                )}
              </SectionCard>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
