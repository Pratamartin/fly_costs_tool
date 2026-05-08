import { z } from '@hono/zod-openapi'
import { zodValidator } from 'cpf-cnpj-validator/zod'

import { MOCK_PROFILE, MOCK_USER } from '@/constants/seed.constant'
import { UserRole } from '@/generated/prisma/enums'
import { maskBankAccountTransform } from './schema.refine'
import { IdSchema, TimestampSchema } from './shared.schema'

const { cpf: zCpf } = zodValidator(z)

export const ProfileSchema = z.object({
  cpf: zCpf()
    .openapi({ example: MOCK_PROFILE.cpf }),

  rgPassaporte: z.string()
    .trim()
    .toUpperCase()
    .openapi({ example: MOCK_PROFILE.rgPassaporte }),

  birthDate: z.coerce.date()
    .openapi({ example: MOCK_PROFILE.birthDate }),

  profession: z.string()
    .trim()
    .openapi({ example: MOCK_PROFILE.profession }),

  address: z.string()
    .trim()
    .min(5, 'O endereço deve ter pelo menos 5 caracteres.')
    .openapi({ example: MOCK_PROFILE.address }),

  bankCode: z.string()
    .trim()
    .length(3)
    .openapi({ example: MOCK_PROFILE.bankCode }),

  bankName: z.string()
    .trim()
    .toUpperCase()
    .min(2, 'O nome do banco deve ter pelo menos 2 caracteres.')
    .openapi({ example: MOCK_PROFILE.bankName }),

  bankAgency: z.string()
    .trim()
    .toUpperCase()
    .openapi({ example: MOCK_PROFILE.bankAgency }),

  bankAccount: z.string()
    .trim()
    .toUpperCase()
    .openapi({ example: MOCK_PROFILE.bankAccount }),
})

export const UserSchema = z.object({
  id: IdSchema,
  name: z.string().openapi({ example: MOCK_USER.name }),
  email: z.email()
    .openapi({ example: MOCK_USER.email }),
  role: z.enum(UserRole).openapi({ examples: Object.values(UserRole) }),
  isActive: z.boolean().openapi({ example: true }),
  profile: ProfileSchema.partial().extend({
    bankAccount: z.string().transform(maskBankAccountTransform),
  })
    .optional()
    .nullable(),
}).extend(TimestampSchema)
