import { z } from '@hono/zod-openapi'
import { zodValidator } from 'cpf-cnpj-validator/zod'

import { MOCK_PROFILE, MOCK_USER } from '@/constants/seed.constant'
import { UserRole } from '@/generated/prisma/enums'
import { maskBankAccountTransform, validBankAccount, validBankAgency, validBankCode, validBirthDate, validIdentityDoc } from './schema.refine'
import { IdSchema, TimestampSchema } from './shared.schema'

const { cpf: zCpf } = zodValidator(z)

export const ProfileSchema = z.object({
  cpf: zCpf()
    .nullish()
    .openapi({ example: MOCK_PROFILE.cpf }),

  rgPassaporte: validIdentityDoc.nullish()
    .openapi({ example: MOCK_PROFILE.rgPassaporte }),

  birthDate: validBirthDate.nullish()
    .openapi({ example: MOCK_PROFILE.birthDate }),

  profession: z.string()
    .trim()
    .nullish()
    .openapi({ example: MOCK_PROFILE.profession }),

  address: z.string()
    .trim()
    .min(5, 'Address must be at least 5 characters long.')
    .nullish()
    .openapi({ example: MOCK_PROFILE.address }),

  bankCode: validBankCode.nullish()
    .openapi({ example: MOCK_PROFILE.bankCode }),

  bankName: z.string()
    .trim()
    .toUpperCase()
    .min(2, 'Bank name must be at least 2 characters long.')
    .nullish()
    .openapi({ example: MOCK_PROFILE.bankName }),

  bankAgency: validBankAgency.nullish()
    .openapi({ example: MOCK_PROFILE.bankAgency }),

  bankAccount: validBankAccount.nullish()
    .openapi({ example: MOCK_PROFILE.bankAccount }),
})

export const UserSchema = z.object({
  id: IdSchema,
  name: z.string().openapi({ example: MOCK_USER.name }),
  email: z.email()
    .openapi({ example: MOCK_USER.email }),
  role: z.enum(UserRole).openapi({ examples: Object.values(UserRole) }),
  isActive: z.boolean().openapi({ example: true }),
  profile: ProfileSchema.extend({
    bankAccount: z.string().transform(maskBankAccountTransform)
      .nullish(),
  })
    .nullish(),
}).extend(TimestampSchema)

export const UpdateProfileSchema = ProfileSchema.partial().extend({
  name: z.string().optional(),
  email: z.email().optional(),
})
