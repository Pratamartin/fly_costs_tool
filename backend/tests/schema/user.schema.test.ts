import { assert, describe, expect, it } from 'vitest'
import { UserRole } from '@/generated/prisma/enums'
import { UserSchema } from '@/schemas/user.schema'

describe('userSchema - validações', () => {
  const validUser = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Teste',
    email: 'teste@exemplo.com',
    role: UserRole.ALUNO,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  describe('mascaramento de conta bancária', () => {
    it('deve mascarar os primeiros 4 dígitos de uma conta longa', () => {
      const data = {
        ...validUser,
        profile: { bankAccount: '12345678' },
      }

      const result = UserSchema.safeParse(data)
      expect(result.success)
      assert(result.data)
      expect(result.data.profile?.bankAccount).toBe('****5678')
    })

    it('deve retornar **** se a conta tiver 4 ou menos caracteres', () => {
      const data = {
        ...validUser,
        profile: { bankAccount: '123' },
      }

      const result = UserSchema.safeParse(data)
      expect(result.success)
      assert(result.data)
      expect(result.data.profile?.bankAccount).toBe('****')
    })
  })
})
