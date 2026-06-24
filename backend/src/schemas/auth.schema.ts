import { z } from '@hono/zod-openapi'
import { MOCK_USER } from '@/constants/seed.constant'
import { UserRole } from '@/generated/prisma/enums'
import { validBankCode, validBirthDate, validPixKey } from './schema.refine'
import { ProfileSchema, UserSchema } from './user.schema'

const RegisterBaseSchema = z.object({
  name: z.string().openapi({ example: MOCK_USER.name }),
  email: z.email().openapi({ example: MOCK_USER.email }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^A-Z0-9]/i, 'Password must contain at least one special character')
    .openapi({
      description: 'User password must have at least 8 characters, 1 uppercase letter, 1 number, and 1 special character.',
      example: MOCK_USER.password,
    }),
  role: z.enum(UserRole).openapi({ examples: Object.values(UserRole) }),
  inviteCode: z.string().openapi({ example: MOCK_USER.inviteCode }),
})

export const AlunoRegisterSchema = RegisterBaseSchema
  .extend((ProfileSchema.omit({ pixKey: true }).required()).shape)
  .extend({
    role: z.literal(UserRole.ALUNO).openapi({ example: UserRole.ALUNO }),
    birthDate: validBirthDate,
    bankCode: validBankCode,
    pixKey: validPixKey,
  })

export const StaffRegisterSchema = RegisterBaseSchema
  .extend({ role: z.enum([UserRole.ADMIN, UserRole.COORDENADOR]).openapi({ examples: [UserRole.ADMIN, UserRole.COORDENADOR] }) })

export const RegisterSchema = z.discriminatedUnion('role', [
  StaffRegisterSchema.strict(),
  AlunoRegisterSchema,
]).openapi('RegisterUserRequest')

export const RegisterSuccessSchema = UserSchema

export const LoginSchema = RegisterBaseSchema.pick({
  email: true,
  password: true,
}).openapi('LoginUserRequest')

export const LoginSuccessSchema = z.object({
  accessToken: z.string().openapi({
    description: 'JWT (JSON Web Token) to be used in the authorization header.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  }),
}).openapi('LoginResponse')

export const ForgotPasswordSchema = z.object({
  email: z.email()
    .openapi({ example: MOCK_USER.email }),
}).openapi('ForgotPasswordRequest')

export const ResetPasswordSchema = z.object({
  token: z.string().openapi({ example: 'plain-token-here' }),
  newPassword: RegisterBaseSchema.shape.password,
}).openapi('ResetPasswordRequest')
