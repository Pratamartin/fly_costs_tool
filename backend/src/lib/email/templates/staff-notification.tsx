import type { FC } from 'hono/jsx'
import type { ExpenseRequestStatus } from '@/generated/prisma/client'
import { ExpenseRequestStatus as Status } from '@/generated/prisma/client'
import { BaseEmail, EMAIL_THEME } from './base.layout'

export type StaffNotificationEmailProps = {
  staffName: string
  eventDetails: string[]
  expenseTitle: string
  status: ExpenseRequestStatus
  date: string
  actionUrl: string
  projectName?: string | null
  categories?: string[]
  articleClassification?: string
}

const CONFIG = {
  [Status.PENDENTE]: {
    subjectPrefix: 'Solicitação Pendente',
    message: 'Uma nova solicitação foi submetida e foi adicionada à fila da coordenação. Requer sua avaliação para prosseguir.',
    actionLabel: 'Analisar Solicitação',
    color: '#6b7280',
    bgColor: '#f3f4f6',
  },
  [Status.APROVADO]: {
    subjectPrefix: 'Aprovado pela Coordenação',
    message: 'A solicitação foi aprovada pela coordenação. Faça a revisão dos dados e vincule o projeto para iniciar a cotação.',
    actionLabel: 'Iniciar Processamento',
    color: '#059669',
    bgColor: '#ecfdf5',
  },
}

export const StaffNotificationEmail: FC<StaffNotificationEmailProps> = ({
  staffName,
  eventDetails,
  expenseTitle,
  status,
  date,
  actionUrl,
  projectName,
  categories,
  articleClassification,
}) => {
  const config = CONFIG[status as keyof typeof CONFIG] || CONFIG[Status.PENDENTE]

  return (
    <BaseEmail title={config.subjectPrefix}>
      <p style="margin-top: 0;">
        Olá,
        {' '}
        <strong>{staffName}</strong>
        .
      </p>
      <p style="color: #4b5563; font-size: 16px;">
        Há uma nova tarefa na sua fila de trabalho referente ao sistema de ajuda de custo:
      </p>

      {/* Main Context Banner */}
      <div style={`margin: 32px 0; padding: 24px; background-color: ${config.bgColor}; border-radius: 12px; text-align: center; border: 1px solid ${config.color}20;`}>
        <p style={`margin: 0; font-size: 16px; color: ${EMAIL_THEME.colors.text}; line-height: 1.5; font-weight: 500;`}>
          {config.message}
        </p>
      </div>

      {/* Summary Card */}
      <div style={`margin-bottom: 32px; border: 1px solid ${EMAIL_THEME.colors.border}; border-radius: 12px; overflow: hidden;`}>
        {/* Header do Card */}
        <div style={`padding: 16px 20px; background-color: ${EMAIL_THEME.colors.footer}; border-bottom: 1px solid ${EMAIL_THEME.colors.border};`}>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
            Resumo da Solicitação
          </p>
          <h2 style="margin: 0; font-size: 15px; color: #111827; font-weight: 700; line-height: 1.4;">
            {expenseTitle}
          </h2>
        </div>

        <div style="padding: 24px;">
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            {/* Seção do Evento */}
            {eventDetails && eventDetails.length > 0 && (
              <tr>
                <td style="padding-bottom: 16px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; vertical-align: top; width: 38%;">
                  Dados do Evento:
                </td>
                <td style="padding-bottom: 16px; vertical-align: top;">
                  <ul style="margin: 0; padding-left: 14px; color: #111827; font-size: 14px;">
                    {(eventDetails || []).map((detail, index) => (
                      <li key={index} style="margin-bottom: 4px; font-weight: 600;">{detail}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            )}

            {/* Preferências (Categorias) */}
            {categories && categories.length > 0 && (
              <tr>
                <td style="padding-bottom: 16px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; vertical-align: top;">
                  Preferências:
                </td>
                <td style="padding-bottom: 16px; vertical-align: top;">
                  <ul style="margin: 0; padding-left: 14px; color: #111827; font-size: 14px;">
                    {categories.map(category => (
                      <li key={category} style="margin-bottom: 4px;">{category}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            )}

            {/* Qualis (Substituindo Memorando) */}
            <tr>
              <td style="padding-bottom: 16px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; vertical-align: middle;">
                Classificação QUALIS:
              </td>
              <td style="padding-bottom: 16px; vertical-align: middle;">
                <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; border: 1px solid #dbeafe;">
                  {articleClassification}
                </span>
              </td>
            </tr>

            {/* Projeto (se houver) */}
            {projectName && (
              <tr>
                <td style="padding-bottom: 16px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; vertical-align: top;">
                  Projeto:
                </td>
                <td style="padding-bottom: 16px; color: #111827; font-size: 14px; font-weight: 500;">
                  {projectName}
                </td>
              </tr>
            )}

            {/* Data */}
            <tr>
              <td style="padding-top: 8px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase; vertical-align: top;">
                Submetido em:
              </td>
              <td style="padding-top: 8px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 11px; vertical-align: top;">
                {date}
              </td>
            </tr>
          </table>
        </div>
      </div>

      {/* Action Button */}
      <div style="text-align: center; margin: 40px 0;">
        <a
          href={actionUrl}
          style={`display: inline-block; padding: 16px 36px; background-color: ${EMAIL_THEME.colors.accent}; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.1);`}
        >
          {config.actionLabel}
        </a>
      </div>

      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          Esta é uma notificação automática do sistema SGDA.
        </p>
      </div>
    </BaseEmail>
  )
}
