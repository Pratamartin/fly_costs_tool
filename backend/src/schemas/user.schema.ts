import { z } from '@hono/zod-openapi'
import { UserRole } from '@/generated/prisma/enums'
import { IdSchema, TimestampSchema } from '@/schemas/shared.schema'

export const UserSchema = z.object({
  id: IdSchema,
  name: z.string().openapi({ example: 'João Silva' }),
  email: z.email()
    .openapi({ example: 'usuario@exemplo.com' }),
  role: z.enum(UserRole).openapi({ examples: Object.values(UserRole) }),
}).extend(TimestampSchema)

export const UserProfileSchema = UserSchema
