import type { FC } from 'hono/jsx'
import type { ExpenseRequestStatus } from '@/generated/prisma/client'
import { BaseEmail, EMAIL_THEME } from './base.layout'

type StatusChangeEmailProps = {
  studentName: string
  expenseDescription: string
  newStatus: ExpenseRequestStatus
  date: string
  detailPage: string
  reason?: string | null
  projectName?: string | null
  hasMemorandum?: boolean
}

type StatusConfig = {
  label: string
  color: string
  bgColor: string
  message: string
  actionLabel: string
}

const STATUS_CONFIG: Record<ExpenseRequestStatus, StatusConfig> = {
  PENDENTE: {
    label: 'Pendente',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    message: 'Sua solicitação foi recebida e está aguardando análise da coordenação.',
    actionLabel: 'Acompanhar Solicitação',
  },
  APROVADO: {
    label: 'Aprovado',
    color: '#059669',
    bgColor: '#ecfdf5',
    message: 'Excelente notícia! Sua solicitação foi aprovada pela coordenação com base no trabalho publicado e seguirá para os próximos trâmites financeiros.',
    actionLabel: 'Ver Detalhes',
  },
  REJEITADO: {
    label: 'Rejeitado',
    color: '#dc2626',
    bgColor: '#fef2f2',
    message: 'Sua solicitação foi rejeitada. Verifique o motivo abaixo para entender os critérios não atendidos.',
    actionLabel: 'Ver Motivo da Rejeição',
  },
  EM_EDICAO: {
    label: 'Necessita Correção',
    color: '#d97706',
    bgColor: '#fffbeb',
    message: 'Sua solicitação foi devolvida para ajustes. É necessário realizar as correções indicadas para prosseguir.',
    actionLabel: 'Corrigir Solicitação',
  },
  EM_PROCESSAMENTO: {
    label: 'Em Processamento',
    color: '#2563eb',
    bgColor: '#eff6ff',
    message: 'Sua solicitação foi vinculada a um projeto e está sendo processada pela administração.',
    actionLabel: 'Acompanhar Progresso',
  },
  CONCLUIDO: {
    label: 'Concluído',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    message: 'Tudo pronto! Sua solicitação foi concluída com sucesso. O dossiê consolidado de comprovantes já está disponível em seu painel.',
    actionLabel: 'Ver Dossiê e Detalhes',
  },
}

export const StatusChangeEmail: FC<StatusChangeEmailProps> = ({
  studentName,
  expenseDescription,
  newStatus,
  date,
  detailPage,
  reason,
  projectName,
  hasMemorandum,
}) => {
  const config = STATUS_CONFIG[newStatus]
  const isActionRequired = newStatus === 'EM_EDICAO'

  return (
    <BaseEmail title="Atualização de Solicitação">
      <p style="margin-top: 0;">
        Olá,
        {' '}
        <strong>{studentName}</strong>
        .
      </p>
      <p style="color: #4b5563; font-size: 16px;">
        Houve uma movimentação na sua solicitação de ajuda de custo:
      </p>

      {/* Main Status Banner */}
      <div style={`margin: 32px 0; padding: 24px; background-color: ${config.bgColor}; border-radius: 12px; text-align: center; border: 1px solid ${config.color}20;`}>
        <span style={`display: inline-block; padding: 6px 16px; background-color: ${config.color}; color: #ffffff; border-radius: 9999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;`}>
          {config.label}
        </span>
        <p style={`margin: 0; font-size: 16px; color: ${EMAIL_THEME.colors.text}; line-height: 1.5; font-weight: 500;`}>
          {config.message}
        </p>
      </div>

      {/* Details Card */}
      <div style={`margin-bottom: 32px; border: 1px solid ${EMAIL_THEME.colors.border}; border-radius: 12px; overflow: hidden;`}>
        <div style={`padding: 16px 20px; background-color: ${EMAIL_THEME.colors.footer}; border-bottom: 1px solid ${EMAIL_THEME.colors.border};`}>
          <h2 style="margin: 0; font-size: 14px; color: #374151; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em;">
            Resumo da Solicitação
          </h2>
        </div>
        <div style="padding: 20px;">
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td style="padding-bottom: 12px; width: 35%; color: #6b7280; font-size: 14px;">Descrição:</td>
              <td style="padding-bottom: 12px; color: #111827; font-size: 14px; font-weight: 600;">{expenseDescription}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; color: #6b7280; font-size: 14px;">Data da Atualização:</td>
              <td style="padding-bottom: 12px; color: #111827; font-size: 14px;">{date}</td>
            </tr>
            {projectName && (
              <tr>
                <td style="padding-bottom: 12px; color: #6b7280; font-size: 14px;">Projeto Financiador:</td>
                <td style="padding-bottom: 12px; color: #111827; font-size: 14px; font-weight: 600;">{projectName}</td>
              </tr>
            )}
            <tr>
              <td style="padding-bottom: 12px; color: #6b7280; font-size: 14px;">Trabalho Publicado:</td>
              <td style="padding-bottom: 12px; color: #111827; font-size: 14px;">
                {hasMemorandum ? '✅ Anexado' : '❌ Não enviado'}
              </td>
            </tr>
            {reason && (
              <tr>
                <td colSpan={2} style="padding-top: 12px; border-top: 1px dashed #e5e7eb;">
                  <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Motivo / Observações:</p>
                  <div style={`padding: 12px; background-color: ${isActionRequired ? '#fffbeb' : '#f9fafb'}; border-radius: 8px; color: #1f2937; font-size: 14px; border: 1px solid ${isActionRequired ? '#fde68a' : '#e5e7eb'}; line-height: 1.6;`}>
                    {reason}
                  </div>
                </td>
              </tr>
            )}
          </table>
        </div>
      </div>

      {/* Action Button */}
      <div style="text-align: center; margin: 40px 0;">
        <a
          href={detailPage}
          style={`display: inline-block; padding: 16px 36px; background-color: ${isActionRequired ? '#d97706' : EMAIL_THEME.colors.accent}; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.1);`}
        >
          {config.actionLabel}
        </a>
      </div>

      {/* Helpful Links/Footer info */}
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          Dúvidas sobre o processo? Acesse nossa
          {' '}
          <a href="#" style="color: #3b82f6; text-decoration: none;">Central de Ajuda</a>
          {' '}
          ou entre em contato com a coordenação.
        </p>
      </div>
    </BaseEmail>
  )
}
