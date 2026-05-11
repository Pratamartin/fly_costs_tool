import { z } from '@hono/zod-openapi'
import { INVITE_STATUS, mockInviteCode } from '@/constants/invite.constant'
import { UserRole } from '@/generated/prisma/enums'
import { minExpiryThresholdCheck, usedInviteFieldsRequired } from '@/schemas/schema.refine'
import { getInviteDefaultExpiry, getInviteExampleExpiry } from '@/services/invite.service'
import { IdSchema, TimestampSchema } from './shared.schema'

const BaseSchema = z.object({
  id: IdSchema,
  code: z.string().openapi({ example: mockInviteCode }),
  role: z.enum(UserRole).openapi({ example: UserRole.ALUNO }),
  usedById: IdSchema.nullish().default(null),
  usedAt: z.coerce.date()
    .nullable()
    .openapi({ example: null })
    .default(null),
  expiresAt: z.coerce.date().default(getInviteDefaultExpiry())
    .openapi({
      description: 'Data e hora de expiração do convite. Segue o padrão UTC (ISO 8601).',
      example: getInviteExampleExpiry(),
    }),
  status: z.enum([INVITE_STATUS.ACTIVE, INVITE_STATUS.USED, INVITE_STATUS.EXPIRED]).openapi({ example: INVITE_STATUS.ACTIVE }),
  createdAt: TimestampSchema.createdAt,
})

export const CreateInviteSchema = BaseSchema.pick({
  role: true,
  expiresAt: true,
}).superRefine(minExpiryThresholdCheck())

export const ListInvitesQuerySchema = BaseSchema.pick({
  role: true,
  status: true,
}).extend({
  search: z.string().optional()
    .openapi({
      description: 'Busca pelo código de convite',
      example: mockInviteCode,
    }),
})
  .partial()

export const InviteResponseSchema = BaseSchema.check(usedInviteFieldsRequired)

export const ListInvitesSchema = z.array(InviteResponseSchema)
