import { z } from '@hono/zod-openapi'
import { UserRole } from '@/generated/prisma/enums'
import { IdSchema, TimestampSchema } from '@/schemas/shared.schema'

export const UserSchema = z.object({
  id: IdSchema
    .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().openapi({ example: 'João Silva' }),
  email: z.email()
    .openapi({ example: 'usuario@exemplo.com' }),
  role: z.enum(UserRole).openapi({ examples: Object.values(UserRole) }),
}).extend(TimestampSchema)

export const UserProfileSchema = UserSchema

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres')
    .optional()
    .openapi({ example: 'João Pedro Silva' }),
}).openapi('UpdateProfile')
