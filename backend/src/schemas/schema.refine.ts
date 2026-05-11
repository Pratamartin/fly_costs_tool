import type { InviteStatus } from '@/constants/invite.constant'
import type { ExpenseRequestStatus } from '@/generated/prisma/enums'
import { z } from '@hono/zod-openapi'
import countries from 'i18n-iso-countries'
import iso31662 from 'iso-3166-2'
import { STATUSES_WHERE_REASON_REQUIRED } from '@/constants/expense.constant'
import { INVITE_STATUS } from '@/constants/invite.constant'
import { dayjs } from '@/lib/date'
import { validatePDF } from '@/lib/storage'
import { getInviteMinExpiry } from '@/services/invite.service'

export const validStateCheck = z.refine<{ state: string }>(
  value => iso31662.subdivision(value.state) !== null,
  { message: 'Código de estado/província inexistente. Utilize um código válido (ex: \'BR-SP\').' },
)

export const validCountryCheck = z.refine<{ country: string }>(
  value => countries.isValid(value.country),
  { message: 'Código de país inexistente. Utilize uma sigla ISO válida (ex: \'BR\').' },
)

export const stateBelongsToCountryCheck = z.refine<{ state: string, country: string }>(
  value => value.state.startsWith(`${value.country}-`),
  {
    message: 'O estado informado não pertence ao país selecionado.',
    path: ['state'],
  },
)

export const returnDateAfterDepartureDateCheck = z.refine<{ returnDate: Date, departureDate: Date }>(
  value => value.returnDate >= value.departureDate,
  {
    message: 'A data de retorno não pode ser anterior à data de partida',
    path: ['returnDate'],
  },
)

export const reasonFieldRequired = z.refine<{ status: ExpenseRequestStatus, reason?: string | null }>(
  (value) => {
    if (!STATUSES_WHERE_REASON_REQUIRED.includes(value.status)) {
      return true
    }

    return !!value.reason && value.reason.length > 0
  },
  {
    message: 'O motivo é obrigatório para o status selecionado',
    path: ['reason'],
  },
)

export function validPDFCheck(maxSizeInMB: number) {
  return async (value: File, ctx: z.RefinementCtx) => {
    const validation = await validatePDF(value, maxSizeInMB)

    if (!validation.valid) {
      ctx.addIssue({
        code: 'custom',
        message: validation.error,
        path: ['file'],
      })
    }
  }
}

export function maskBankAccountTransform(val: string | undefined): string | undefined {
  if (!val)
    return val
  return val.length > 4 ? `****${val.slice(-4)}` : '****'
}

export const validBirthDate = z.coerce.date().superRefine((date, ctx) => {
  const today = new Date()

  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())

  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())

  if (date > maxDate) {
    ctx.addIssue({
      code: 'custom',
      message: 'Você precisa ter pelo menos 18 anos para se cadastrar.',
    })
  }

  if (date < minDate) {
    ctx.addIssue({
      code: 'custom',
      message: 'Data de nascimento inválida (limite de 120 anos).',
    })
  }
})

export const validBankCode = z.string().superRefine((val, ctx) => {
  if (!/^\d{3}$/.test(val)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Código de banco inválido. Utilize um código COMPE de 3 dígitos (ex: 001).',
    })
  }
})
export function minExpiryThresholdCheck() {
  return (value: { expiresAt?: Date }, ctx: z.RefinementCtx) => {
    const minExpiry = getInviteMinExpiry()

    if (value.expiresAt && dayjs(value.expiresAt).isBefore(minExpiry)) {
      const dataFormatada = dayjs.utc(value.expiresAt).format('LT')
      const limiteFormatado = dayjs.utc(minExpiry).format('LT')

      ctx.addIssue({
        code: 'custom',
        message: `A data ${dataFormatada} é inválida. O mínimo aceitável é às ${limiteFormatado}.`,
        path: ['expiresAt'],
      })
    }
  }
}

export const usedInviteFieldsRequired = z.refine<{
  status: InviteStatus
  usedById?: string | null
  usedAt?: Date | null
}>(
  (value) => {
    if (value.status !== INVITE_STATUS.USED)
      return true

    return !!value.usedById && !!value.usedAt
  },
  {
    message: 'Dados de utilização (quem e quando) são obrigatórios para convites usados',
    path: ['status'],
  },
)
