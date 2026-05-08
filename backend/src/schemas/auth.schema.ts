import { z } from '@hono/zod-openapi'
import { MOCK_USER } from '@/constants/seed.constant'
import { UserRole } from '@/generated/prisma/enums'
import { validBankCode, validBirthDate } from './schema.refine'
import { ProfileSchema, UserSchema } from './user.schema'

const RegisterBaseSchema = z.object({
  name: z.string().openapi({ example: MOCK_USER.name }),
  email: z.email().meta({ example: MOCK_USER.email }),
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/\d/, 'A senha deve conter pelo menos um número')
    .regex(/[^A-Z0-9]/i, 'A senha deve conter pelo menos um caractere especial')
    .openapi({
      description: 'A senha do usuário deve ter no mínimo 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.',
      example: MOCK_USER.password,
    }),
  role: z.enum(UserRole).openapi({ examples: Object.values(UserRole) }),
  inviteCode: z.string().openapi({ example: MOCK_USER.inviteCode }),
})

export const AlunoRegisterSchema = RegisterBaseSchema
  .extend((ProfileSchema.required()).shape)
  .extend({
    role: z.literal(UserRole.ALUNO),
    birthDate: validBirthDate,
    bankCode: validBankCode,
  })

export const StaffRegisterSchema = RegisterBaseSchema
  .extend({ role: z.enum([UserRole.ADMIN, UserRole.COORDENADOR]) })

export const RegisterSchema = z.discriminatedUnion('role', [
  StaffRegisterSchema.strict(),
  AlunoRegisterSchema,
])

export const RegisterSuccessSchema = UserSchema

export const LoginSchema = RegisterBaseSchema.pick({
  email: true,
  password: true,
})

export const LoginSuccessSchema = z.object({
  accessToken: z.string().openapi({
    description: 'JWT (JSON Web Token) para ser utilizado no header de autorização.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  }),
})
