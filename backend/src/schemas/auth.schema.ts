import { z } from '@hono/zod-openapi'
import { UserRole } from '@/generated/prisma/enums'
import { TimestampSchema } from '@/schemas/shared.schema'

export const RegisterSchema = z.object({
  name: z.string().openapi({ example: 'João Silva' }),
  email: z.email().meta({ example: 'usuario@exemplo.com' }),
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/\d/, 'A senha deve conter pelo menos um número')
    .regex(/[^A-Z0-9]/i, 'A senha deve conter pelo menos um caractere especial')
    .openapi({
      description: 'A senha do usuário deve ter no mínimo 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.',
      example: 'P@ssw0rd123',
    }),
  role: z.enum(UserRole).openapi({ examples: Object.values(UserRole) }),
  inviteCode: z.string().openapi({ example: 'CONVITE2026' }),
})

export const RegisterSuccessSchema = RegisterSchema.omit({
  password: true,
  inviteCode: true,
}).extend({
  id: z.uuid(),
  ...TimestampSchema,
})
