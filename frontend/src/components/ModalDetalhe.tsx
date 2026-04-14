import { Expense } from "@/services/expenses";

interface ModalDetalheProps {
  despesa: Expense | null;
  onClose: () => void;
}

function topicLabel(topic: string): string {
  switch (topic) {
    case "INSCRICAO":
      return "Inscrição";
    case "PASSAGEM":
      return "Passagem";
    case "HOSPEDAGEM":
      return "Hospedagem";
    default:
      return topic;
  }
}

function statusBadgeColor(status: string): string {
  switch (status) {
    case "PENDENTE":
      return "bg-yellow-100 text-yellow-800";
    case "APROVADO":
      return "bg-green-100 text-green-800";
    case "REJEITADO":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function ModalDetalhe({ despesa, onClose }: ModalDetalheProps) {
  if (!despesa) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Detalhes da Solicitação</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Título e Status */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{despesa.title}</h3>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColor(despesa.status)}`}>
                {despesa.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{despesa.id}</p>
          </div>

          {/* Principais Informações */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                R$ {parseFloat(despesa.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{topicLabel(despesa.topic)}</p>
            </div>
          </div>

          {/* Descrição */}
          {despesa.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4">
                {despesa.description}
              </p>
            </div>
          )}

          {/* Informações do Aluno */}
          {despesa.student && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Aluno Solicitante</h4>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a5c38] text-sm font-bold text-white">
                  {despesa.student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{despesa.student.name}</p>
                  <p className="text-xs text-gray-500">ID: {despesa.student.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Projeto */}
          {despesa.project && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Projeto Associado</h4>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">{despesa.project.name}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {despesa.project.id}</p>
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {new Date(despesa.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Atualizado em</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {new Date(despesa.updatedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
