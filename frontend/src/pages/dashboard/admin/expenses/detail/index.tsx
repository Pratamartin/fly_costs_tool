import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/authStore";
import { getToken } from "@/lib/getToken";
import AdminSidebar from "@/components/AdminSidebar";
import ModalRejeitar from "@/components/ModalRejeitar";
import ModalSolicitarCorrecao from "@/components/ModalSolicitarCorrecao";
import {
  getExpenseById,
  updateExpenseStatus,
  createCostBreakdown,
  uploadCostBreakdownReceipt,
  getCostBreakdownReceiptDownloadUrl,
  getMemorandumDownloadUrl,
  concludeExpense,
  type Expense,
} from "@/services/expenses";
import { listCategories, type ExpenseCategory } from "@/services/categories";
import { listProjects, type Project } from "@/services/projects";
import { toast } from "@/lib/toast";
import ThemeToggle from "@/components/ThemeToggle";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatusBanner({ expense }: { expense: Expense }) {
  const date = fmtDate(expense.createdAt);

  if (expense.status === "PENDENTE") {
    return (
      <div className="flex items-center justify-between rounded-xl border-l-4 border-orange-400 bg-orange-50 px-6 py-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-orange-700">Aguardando Revisão</p>
            <p className="text-sm text-orange-600">Esta despesa está aguardando sua decisão de aprovação</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-orange-500">Enviado em</p>
          <p className="text-sm font-bold text-orange-800">{date}</p>
        </div>
      </div>
    );
  }

  if (expense.status === "APROVADO") {
    return (
      <div className="rounded-xl border-l-4 border-green-500 bg-green-50 px-6 py-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-green-700">Aprovado pelo Coordenador</p>
              <p className="text-sm text-green-600">Trabalho publicado recebido e aprovado. Analise os dados do aluno e prossiga com a vinculação de projeto.</p>
            </div>
          </div>
          <div className="text-right hidden sm:block shrink-0 ml-4">
            <p className="text-xs font-semibold text-green-500">Enviado em</p>
            <p className="text-sm font-bold text-green-800">{date}</p>
          </div>
        </div>
        {expense.attachmentKey && (
          <div className="mt-3 ml-15 pl-[60px] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-600 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-green-700">Trabalho publicado PDF anexado</span>
          </div>
        )}
      </div>
    );
  }

  if (expense.status === "EM_PROCESSAMENTO") {
    return (
      <div className="flex items-center justify-between rounded-xl border-l-4 border-blue-500 bg-blue-50 px-6 py-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-blue-700">Em Processamento</p>
            <p className="text-sm text-blue-600">Projeto vinculado. Adicione a discriminação de custos.</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-blue-500">Enviado em</p>
          <p className="text-sm font-bold text-blue-800">{date}</p>
        </div>
      </div>
    );
  }

  if (expense.status === "CONCLUIDO") {
    return (
      <div className="flex items-center justify-between rounded-xl border-l-4 border-violet-500 bg-violet-50 px-6 py-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-violet-700">Solicitação Concluída</p>
            <p className="text-sm text-violet-600">Fluxo encerrado — todos os documentos foram processados.</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-violet-500">Enviado em</p>
          <p className="text-sm font-bold text-violet-800">{date}</p>
        </div>
      </div>
    );
  }

  if (expense.status === "EM_EDICAO") {
    return (
      <div className="flex items-start justify-between rounded-xl border-l-4 border-amber-400 bg-amber-50 px-6 py-4 mb-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-amber-700">Aguardando Correção do Aluno</p>
            {expense.correctionNote ? (
              <p className="text-sm text-amber-600 mt-0.5 max-w-prose">
                <span className="font-semibold">Instrução: </span>{expense.correctionNote}
              </p>
            ) : (
              <p className="text-sm text-amber-600">Correção solicitada. Aguardando o aluno editar a despesa.</p>
            )}
          </div>
        </div>
        <div className="text-right hidden sm:block shrink-0 ml-4">
          <p className="text-xs font-semibold text-amber-500">Enviado em</p>
          <p className="text-sm font-bold text-amber-800">{date}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between rounded-xl border-l-4 border-red-500 bg-red-50 px-6 py-4 mb-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-red-700">Rejeitado</p>
          {expense.rejectionReason ? (
            <p className="text-sm text-red-600 mt-0.5 max-w-prose">
              <span className="font-semibold">Motivo: </span>{expense.rejectionReason}
            </p>
          ) : (
            <p className="text-sm text-red-600">Esta despesa foi rejeitada</p>
          )}
        </div>
      </div>
      <div className="text-right hidden sm:block shrink-0 ml-4">
        <p className="text-xs font-semibold text-red-500">Enviado em</p>
        <p className="text-sm font-bold text-red-800">{date}</p>
      </div>
    </div>
  );
}

function ModalConcluir({ nomeAluno, totalCustos, numCustos, onClose, onConfirmar, concluindo }: {
  nomeAluno?: string;
  totalCustos: number;
  numCustos: number;
  onClose: () => void;
  onConfirmar: () => void;
  concluindo: boolean;
}) {
  const [enviarParaAluno, setEnviarParaAluno] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-violet-600">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Concluir esta despesa?</h2>
              <p className="text-xs text-gray-500 mt-0.5">Esta ação é irreversível</p>
            </div>
          </div>
          <button onClick={onClose} disabled={concluindo} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Aluno</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800">{nomeAluno ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Custos</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800">{numCustos} item{numCustos !== 1 ? "s" : ""}</p>
            </div>
            <div className="col-span-2 rounded-lg bg-violet-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Total</p>
              <p className="mt-0.5 text-lg font-bold text-violet-800">
                {totalCustos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>

          {/* Enviar para o aluno */}
          <div className="rounded-lg border border-gray-200 px-4 py-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enviarParaAluno}
                onChange={(e) => setEnviarParaAluno(e.target.checked)}
                disabled={concluindo}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">Enviar passagem / documentos ao aluno</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Notifica {nomeAluno ?? "o aluno"} com os documentos do processo.
                </p>
              </div>
            </label>
          </div>

          <p className="text-xs text-gray-400">
            Ao confirmar, a despesa passa para <strong>Concluída</strong> e não poderá mais ser editada.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            disabled={concluindo}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={concluindo}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition disabled:opacity-50"
          >
            {concluindo ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Concluindo...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Concluir Despesa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseDetalhe() {
  const router = useRouter();
  const { id } = router.query;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [showModalRejeitar, setShowModalRejeitar] = useState(false);
  const [showModalCorrecao, setShowModalCorrecao] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [rejeitando, setRejeitando] = useState(false);
  const [solicitandoCorrecao, setSolicitandoCorrecao] = useState(false);
  const [dadosConfirmados, setDadosConfirmados] = useState(false);

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const [cbSubcategoria, setCbSubcategoria] = useState("");
  const [cbValor, setCbValor] = useState("");
  const [cbProjeto, setCbProjeto] = useState("");
  const [cbAnexo, setCbAnexo] = useState<File | null>(null);
  const [adicionandoCusto, setAdicionandoCusto] = useState(false);
  const [erroCusto, setErroCusto] = useState<string | null>(null);
  const [baixandoComprovante, setBaixandoComprovante] = useState<string | null>(null);
  const [baixandoMemorandum, setBaixandoMemorandum] = useState(false);
  const [erroMemorandum, setErroMemorandum] = useState<string | null>(null);

  const [showModalConcluir, setShowModalConcluir] = useState(false);
  const [concluindo, setConcluindo] = useState(false);

  async function handleDownloadMemorandum() {
    const token = getToken();
    if (!token || !expense) return;
    setBaixandoMemorandum(true);
    setErroMemorandum(null);
    try {
      const result = await getMemorandumDownloadUrl(token, expense.id);
      if (result.ok) {
        window.open(result.downloadUrl, "_blank");
      } else {
        setErroMemorandum("Não foi possível obter o link de download.");
      }
    } catch {
      setErroMemorandum("Erro de conexão.");
    } finally {
      setBaixandoMemorandum(false);
    }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    if (!id || typeof id !== "string") return;
    carregarDados(token, id);
  }, [router, id]);

  async function carregarDados(token: string, expId: string) {
    setCarregando(true);
    const result = await getExpenseById(token, expId);
    if (result.ok) {
      setExpense(result.data);
      if (result.data.status === "EM_PROCESSAMENTO") {
        setCarregandoCategorias(true);
        const [catResult, projResult] = await Promise.all([
          listCategories(undefined, token),
          listProjects(token),
        ]);
        if (catResult.ok) setCategories(catResult.data);
        if (projResult.ok) setProjects(projResult.data);
        setCarregandoCategorias(false);
      }
    } else if (result.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else if (result.error === "NOT_FOUND") {
      setErro("Despesa não encontrada.");
    } else {
      setErro("Erro ao carregar despesa.");
    }
    setCarregando(false);
  }

  async function handleAprovar() {
    const token = getToken();
    if (!token || !expense) return;
    setAprovando(true);
    setErro(null);
    const result = await updateExpenseStatus(token, expense.id, "APROVADO");
    setAprovando(false);
    if (result.ok) {
      setExpense(result.data);
      toast.success("Despesa aprovada com sucesso!");
    } else {
      toast.error("Erro ao aprovar despesa.");
    }
  }

  async function handleSolicitarCorrecao(note: string) {
    const token = getToken();
    if (!token || !expense) return;
    setSolicitandoCorrecao(true);
    const result = await updateExpenseStatus(token, expense.id, "EM_EDICAO", note);
    setSolicitandoCorrecao(false);
    if (result.ok) {
      setExpense(result.data);
      setShowModalCorrecao(false);
      toast.success("Correção solicitada ao aluno.");
    } else {
      toast.error("Erro ao solicitar correção.");
    }
  }

  async function handleRejeitar(motivo: string) {
    const token = getToken();
    if (!token || !expense) return;
    setRejeitando(true);
    const result = await updateExpenseStatus(token, expense.id, "REJEITADO", motivo);
    setRejeitando(false);
    if (result.ok) {
      setExpense(result.data);
      setShowModalRejeitar(false);
      toast.success("Despesa rejeitada.");
    } else {
      toast.error("Erro ao rejeitar despesa.");
    }
  }

  async function handleAdicionarCusto(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !expense) return;
    const amount = parseFloat(cbValor);
    if (!cbSubcategoria.trim() || isNaN(amount) || amount <= 0 || !cbAnexo) return;
    setAdicionandoCusto(true);
    setErroCusto(null);
    const result = await createCostBreakdown(token, expense.id, {
      subcategoryName: cbSubcategoria.trim(),
      amount,
      projectId: cbProjeto || undefined,
    });
    if (!result.ok) {
      setAdicionandoCusto(false);
      if (result.error === "BAD_REQUEST") setErroCusto("Categoria inválida para este projeto.");
      else if (result.error === "CONFLICT") setErroCusto("Este tipo de custo já foi adicionado.");
      else setErroCusto("Erro ao adicionar custo.");
      return;
    }
    if (cbAnexo) {
      const receiptResult = await uploadCostBreakdownReceipt(token, expense.id, result.data.id, cbAnexo);
      if (!receiptResult.ok) {
        setErroCusto("Custo adicionado, mas falha ao enviar comprovante. Tente fazer o upload novamente.");
      }
    }
    const updated = await getExpenseById(token, expense.id);
    if (updated.ok) setExpense(updated.data);
    setCbSubcategoria("");
    setCbValor("");
    setCbProjeto("");
    setCbAnexo(null);
    setAdicionandoCusto(false);
  }

  async function handleConcluir() {
    const token = getToken();
    if (!token || !expense) return;
    setConcluindo(true);
    setErro(null);
    const result = await concludeExpense(token, expense.id);
    setConcluindo(false);
    if (result.ok) {
      setExpense(result.data);
      setShowModalConcluir(false);
    } else if (result.error === "UNAUTHORIZED") {
      useAuthStore.getState().clearToken();
      localStorage.removeItem("accessToken");
      router.push("/login");
    } else if (result.error === "UNPROCESSABLE") {
      setErro("Verifique se todos os custos possuem comprovantes anexados.");
      setShowModalConcluir(false);
    } else {
      setErro("Erro ao concluir despesa.");
      setShowModalConcluir(false);
    }
  }

  async function handleBaixarComprovante(breakdownId: string) {
    const token = getToken();
    if (!token || !expense) return;
    setBaixandoComprovante(breakdownId);
    const result = await getCostBreakdownReceiptDownloadUrl(token, expense.id, breakdownId);
    setBaixandoComprovante(null);
    if (result.ok) {
      window.open(result.url, "_blank");
    }
  }

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando despesa...</p>
        </div>
      </div>
    );
  }

  if (erro && !expense) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-600 font-medium">{erro}</p>
          <button
            onClick={() => router.push("/dashboard/admin/expenses")}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  if (!expense) return null;

  const displayId = `REQ-${expense.id.slice(0, 8).toUpperCase()}`;
  const totalCusto = (expense.costBreakdowns ?? []).reduce((sum, cb) => sum + cb.amount, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <AdminSidebar active="expenses" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/admin/expenses")}
              className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-50 sm:text-xl">Detalhes da Despesa</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                {displayId} • {expense.title}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                <p className="text-xs text-red-700">{erro}</p>
              </div>
            )}
            {expense.status === "PENDENTE" && (
              <>
                <button
                  onClick={() => setShowModalCorrecao(true)}
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition sm:px-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                  Solicitar Correção
                </button>
                <button
                  onClick={handleAprovar}
                  disabled={aprovando}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60 sm:px-4"
                >
                  {aprovando ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                  Aprovar
                </button>
                <button
                  onClick={() => setShowModalRejeitar(true)}
                  disabled={rejeitando}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60 sm:px-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                  Rejeitar
                </button>
              </>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <StatusBanner expense={expense} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left column */}
            <div className="col-span-1 space-y-5 lg:col-span-2">

              {/* Expense Overview */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Visão Geral da Despesa</h2>
                </div>

                <div className="grid grid-cols-1 gap-5 mb-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ID da Despesa</p>
                    <p className="text-sm font-bold text-blue-600">{displayId}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Título</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.title}</p>
                  </div>
                </div>

                {expense.description && (
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Descrição</p>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{expense.description}</p>
                  </div>
                )}

                {/* Trabalho publicado */}
                {expense.attachmentKey && (
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Trabalho publicado</p>
                    <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-600">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">PDF anexado</p>
                        <p className="text-xs text-gray-500 truncate">{expense.attachmentKey.split("/").pop()}</p>
                      </div>
                      <button
                        onClick={handleDownloadMemorandum}
                        disabled={baixandoMemorandum}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {baixandoMemorandum ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Abrindo...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                            </svg>
                            Baixar PDF
                          </>
                        )}
                      </button>
                    </div>
                    {erroMemorandum && (
                      <p className="mt-1.5 text-xs text-red-600">{erroMemorandum}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Evento</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.event?.name}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Local · QUALIS</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.event?.location}</p>
                    <span className="mt-1 inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                      {expense.article?.classification}
                    </span>
                  </div>
                </div>

                {totalCusto > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total de Custos Registrados</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{fmtCurrency(totalCusto)}</p>
                  </div>
                )}
              </div>

              {/* Review Gate — only when APROVADO */}
              {expense.status === "APROVADO" && (
                dadosConfirmados ? (
                  <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-3 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-green-600">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-semibold text-green-800">Dados confirmados — aguarde a discriminação de custos (B4).</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v4.25H7a.75.75 0 000 1.5h3.25v4.25a.75.75 0 001.5 0v-4.25H15a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                      </svg>
                      <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Revisão de Dados pelo Admin</h2>
                      <span className="ml-auto text-xs font-semibold text-orange-500 bg-orange-50 rounded-full px-2 py-0.5 ring-1 ring-orange-200">Ação necessária</span>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                      Confirme se os dados da solicitação estão corretos. Caso algum dado esteja incorreto, solicite correção ao aluno.
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Despesa</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.title}</p>
                          {expense.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{expense.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">
                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.452-.23.773-.417.635-.374 1.52-.965 2.396-1.763C15.281 15.523 17 13.687 17 11a7 7 0 10-14 0c0 2.687 1.719 4.523 3.216 5.855a19.032 19.032 0 002.396 1.763 11.46 11.46 0 00.773.417 5.75 5.75 0 00.281.14l.018.008.006.003zM10 13a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Evento & Local</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {expense.event?.name ?? "—"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {expense.event?.location ?? "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">
                          <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Solicitante</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.student?.name ?? "—"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Aluno</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Trabalho publicado</p>
                          {expense.attachmentKey ? (
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-green-600">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-semibold text-green-700">PDF recebido</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-orange-400">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-semibold text-orange-600">Sem trabalho publicado</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* <div className="flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3 opacity-60">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400 mt-0.5 shrink-0">
                          <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Dados Bancários</p>
                          <p className="text-sm text-gray-400 italic">Disponível na próxima versão — consultar perfil do aluno</p>
                        </div>
                      </div> */}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-5">
                      <button
                        onClick={() => setShowModalCorrecao(true)}
                        className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                        </svg>
                        Solicitar Correção
                      </button>
                      <button
                        onClick={() => setDadosConfirmados(true)}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        Confirmar Dados
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* TODO: vinculação de projeto agora ocorre via seletor por linha na discriminação de custos (B4) */}

              {/* Discriminação de Custos — only when EM_PROCESSAMENTO */}
              {expense.status === "EM_PROCESSAMENTO" && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                      <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Discriminação de Custos</h2>
                    {(expense.costBreakdowns ?? []).length > 0 && (
                      <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {expense.costBreakdowns!.length} custo{expense.costBreakdowns!.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Existing breakdowns */}
                  {(expense.costBreakdowns ?? []).length > 0 ? (
                    <div className="mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">Tipo de Custo</th>
                            <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">Projeto</th>
                            <th className="text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">Valor</th>
                            <th className="text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pb-2">Comprovante</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {expense.costBreakdowns!.map((cb) => (
                            <tr key={cb.id}>
                              <td className="py-2.5 font-medium text-gray-700 dark:text-gray-300">{cb.subcategory.name}</td>
                              <td className="py-2.5 text-left">
                                {cb.project ? (
                                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                                    {cb.project.code}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                                )}
                              </td>
                              <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-gray-50">{fmtCurrency(cb.amount)}</td>
                              <td className="py-2.5 text-right">
                                {cb.attachmentKey ? (
                                  <button
                                    onClick={() => handleBaixarComprovante(cb.id)}
                                    disabled={baixandoComprovante === cb.id}
                                    className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition"
                                  >
                                    {baixandoComprovante === cb.id ? (
                                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                      </svg>
                                    )}
                                    Baixar
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                            <td className="pt-3 text-sm font-bold text-gray-700 dark:text-gray-300">Total</td>
                            <td />
                            <td className="pt-3 text-right text-sm font-bold text-gray-900 dark:text-gray-50">{fmtCurrency(totalCusto)}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Nenhum custo adicionado ainda.</p>
                  )}

                  {/* Add new breakdown */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Adicionar Custo</p>
                    <form onSubmit={handleAdicionarCusto} className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <select
                            value={cbSubcategoria}
                            onChange={(e) => { setCbSubcategoria(e.target.value); setErroCusto(null); }}
                            disabled={adicionandoCusto || carregandoCategorias}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition"
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
                        </div>
                        <div className="flex-1">
                          <select
                            value={cbProjeto}
                            onChange={(e) => { setCbProjeto(e.target.value); setErroCusto(null); }}
                            disabled={adicionandoCusto}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition"
                          >
                            <option value="">Projeto (opcional)</option>
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.code} — {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-36">
                          <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400 dark:text-gray-500">R$</span>
                            <input
                              type="number"
                              placeholder="0,00"
                              min="0.01"
                              step="0.01"
                              value={cbValor}
                              onChange={(e) => { setCbValor(e.target.value); setErroCusto(null); }}
                              disabled={adicionandoCusto}
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 py-2.5 pl-9 pr-3 text-sm text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          Anexo <span className="text-red-500">*</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 hover:border-blue-400 hover:bg-blue-50 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500">
                            <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                          </svg>
                          <span className="flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
                            {cbAnexo ? cbAnexo.name : "Selecionar arquivo..."}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            disabled={adicionandoCusto}
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              if (f && f.size > 10 * 1024 * 1024) {
                                setErroCusto("Arquivo muito grande. Tamanho máximo: 10MB.");
                                e.target.value = "";
                                return;
                              }
                              setCbAnexo(f);
                            }}
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
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">PDF, JPG ou PNG · máx. 10MB.</p>
                      </div>

                      {erroCusto && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <p className="text-sm text-red-700">{erroCusto}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={adicionandoCusto || !cbSubcategoria.trim() || !cbValor || !cbAnexo}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        {adicionandoCusto ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                            Adicionar Custo
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

              {/* Portfólio de Arquivos — only when CONCLUIDO */}
              {expense.status === "CONCLUIDO" && (
                <div className="rounded-xl border border-violet-200 bg-white dark:bg-gray-900 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-violet-500">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Portfólio de Arquivos</h2>
                    <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                      Concluído
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Trabalho publicado */}
                    {expense.attachmentKey && (
                      <div className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-600">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Trabalho publicado</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{expense.attachmentKey.split("/").pop()}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleDownloadMemorandum}
                          disabled={baixandoMemorandum}
                          className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          {baixandoMemorandum ? (
                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                            </svg>
                          )}
                          Baixar
                        </button>
                      </div>
                    )}

                    {/* Cost breakdowns */}
                    {(expense.costBreakdowns ?? []).map((cb) => (
                      <div key={cb.id} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-600">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{cb.subcategory.name}</p>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {cb.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                          </div>
                        </div>
                        {cb.attachmentKey ? (
                          <button
                            onClick={() => handleBaixarComprovante(cb.id)}
                            disabled={baixandoComprovante === cb.id}
                            className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                          >
                            {baixandoComprovante === cb.id ? (
                              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                              </svg>
                            )}
                            Baixar
                          </button>
                        ) : (
                          <span className="ml-3 text-xs text-gray-300 shrink-0">Sem comprovante</span>
                        )}
                      </div>
                    ))}

                    {/* Total */}
                    <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
                      <p className="text-sm font-bold text-violet-700">Total</p>
                      <p className="text-lg font-bold text-violet-800">
                        {totalCusto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Right sidebar */}
            <div className="space-y-5">

              {/* Submitted By */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Solicitante</h3>
                </div>

                {expense.student ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-base font-bold text-white">
                      {expense.student.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-50">{expense.student.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Aluno</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
                )}
              </div>

              {/* Travel Details */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.452-.23.773-.417.635-.374 1.52-.965 2.396-1.763C15.281 15.523 17 13.687 17 11a7 7 0 10-14 0c0 2.687 1.719 4.523 3.216 5.855a19.032 19.032 0 002.396 1.763 11.46 11.46 0 00.773.417 5.75 5.75 0 00.281.14l.018.008.006.003zM10 13a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Detalhes do Evento</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Evento</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.event?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Local</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.event?.location ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">QUALIS</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.article?.classification ?? "—"}</p>
                  </div>
                  {expense.departureDate && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data de ida</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {new Date(expense.departureDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                  {expense.returnDate && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data de volta</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {new Date(expense.returnDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Criado em</p>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{fmtDate(expense.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Assigned Project */}
              {expense.project && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-500">
                      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Projeto Vinculado</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Nome</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{expense.project.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Código</p>
                      <span className="mt-0.5 inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
                        {expense.project.code}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push({ pathname: "/dashboard/admin/projects/detail", query: { id: expense.project!.id } })}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                    Ver Projeto
                  </button>
                </div>
              )}
            </div>

              {/* Concluir Despesa — only when EM_PROCESSAMENTO */}
              {expense.status === "EM_PROCESSAMENTO" && (() => {
                const breakdowns = expense.costBreakdowns ?? [];
                const semComprovante = breakdowns.filter((cb) => !cb.attachmentKey);
                const podeConcluir = breakdowns.length > 0 && semComprovante.length === 0;
                return (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-violet-500">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Concluir Despesa</h2>
                    </div>

                    <ul className="mb-4 space-y-1.5">
                      <li className="flex items-center gap-2 text-sm">
                        {breakdowns.length > 0 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-green-500">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-red-400">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={breakdowns.length > 0 ? "text-gray-700 dark:text-gray-300" : "text-red-600"}>
                          {breakdowns.length > 0 ? `${breakdowns.length} custo${breakdowns.length !== 1 ? "s" : ""} registrado${breakdowns.length !== 1 ? "s" : ""}` : "Nenhum custo registrado"}
                        </span>
                      </li>
                      {breakdowns.length > 0 && semComprovante.length === 0 && (
                        <li className="flex items-center gap-2 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-green-500">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300">Todos os comprovantes anexados</span>
                        </li>
                      )}
                      {semComprovante.map((cb) => (
                        <li key={cb.id} className="flex items-center gap-2 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-amber-400">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          <span className="text-amber-700">{cb.subcategory.name} — sem comprovante</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => setShowModalConcluir(true)}
                      disabled={!podeConcluir}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Concluir Despesa
                    </button>
                  </div>
                );
              })()}

          </div>
        </main>
      </div>

      {showModalConcluir && (
        <ModalConcluir
          nomeAluno={expense.student?.name}
          totalCustos={totalCusto}
          numCustos={(expense.costBreakdowns ?? []).length}
          onClose={() => setShowModalConcluir(false)}
          onConfirmar={handleConcluir}
          concluindo={concluindo}
        />
      )}

      {showModalRejeitar && (
        <ModalRejeitar
          solicitacao={{
            reqId: displayId,
            descricao: expense.title,
            aluno: expense.student?.name,
          }}
          onClose={() => setShowModalRejeitar(false)}
          onConfirmar={handleRejeitar}
        />
      )}

      {showModalCorrecao && (
        <ModalSolicitarCorrecao
          solicitacao={{
            reqId: displayId,
            descricao: expense.title,
            aluno: expense.student?.name,
          }}
          onClose={() => setShowModalCorrecao(false)}
          onConfirmar={handleSolicitarCorrecao}
          confirmando={solicitandoCorrecao}
        />
      )}
    </div>
  );
}
