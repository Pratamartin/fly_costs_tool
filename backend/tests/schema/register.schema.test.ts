import { z } from '@hono/zod-openapi'
import { assert, describe, expect, it } from 'vitest'
import { UserRole } from '@/generated/prisma/enums'
import { RegisterSchema } from '@/schemas/auth.schema'

describe('registerSchema - Validações de Negócio', () => {
  const validBaseAluno: z.infer<typeof RegisterSchema> = {
    name: 'Aluno de Teste',
    email: 'teste@exemplo.com',
    password: 'P@ssword123',
    role: UserRole.ALUNO,
    inviteCode: 'CONVITE2026',
    cpf: '52998224725',
    rgPassaporte: 'MG-12.345',
    birthDate: new Date('1995-05-15T00:00:00Z'),
    profession: 'Estudante',
    address: 'Rua Principal, 123',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    bankAgency: '1234-X',
    bankAccount: '123456',
  }

  describe('validação de CPF', () => {
    it('deve rejeitar a ausência de CPF para ALUNO', () => {
      const { cpf, ...dataWithoutCpf } = validBaseAluno
      const result = RegisterSchema.safeParse(dataWithoutCpf)

      assert(!result.success)
      expect(z.treeifyError(result.error).properties).toHaveProperty('cpf')
    })

    it('deve rejeitar um CPF com todos os números iguais (ex: 111.111.111-11)', () => {
      const data: z.infer<typeof RegisterSchema> = {
        ...validBaseAluno,
        cpf: '11111111111',
      }
      const result = RegisterSchema.safeParse(data)

      assert(!result.success)
      expect(z.treeifyError(result.error).properties).toHaveProperty('cpf')
    })

    it('deve rejeitar um CPF com cálculo de dígito verificador incorreto', () => {
      const data: z.infer<typeof RegisterSchema> = {
        ...validBaseAluno,
        cpf: '12345678909',
      }
      const result = RegisterSchema.safeParse(data)

      assert(!result.success)
      expect(z.treeifyError(result.error).properties).toHaveProperty('cpf')
    })
  })

  describe('validação de Data de Nascimento', () => {
    it('deve rejeitar usuários com menos de 18 anos (Boundary: 17 anos e 364 dias)', () => {
      const today = new Date()
      const underAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1)

      const data: z.infer<typeof RegisterSchema> = {
        ...validBaseAluno,
        birthDate: underAgeDate,
      }
      const result = RegisterSchema.safeParse(data)

      assert(!result.success)
      expect(z.treeifyError(result.error).properties).toHaveProperty('birthDate')
    })

    it('deve aceitar usuários com exatamente 18 anos (Boundary: hoje)', () => {
      const today = new Date()
      const exactlyEighteen = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())

      const data: z.infer<typeof RegisterSchema> = {
        ...validBaseAluno,
        birthDate: exactlyEighteen,
      }
      const result = RegisterSchema.safeParse(data)

      assert(result.success)
    })

    it('deve rejeitar datas absurdas no passado (Boundary: > 120 anos)', () => {
      const today = new Date()
      const tooOldDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate() - 1)

      const data: z.infer<typeof RegisterSchema> = {
        ...validBaseAluno,
        birthDate: tooOldDate,
      }
      const result = RegisterSchema.safeParse(data)

      assert(!result.success)
      expect(z.treeifyError(result.error).properties).toHaveProperty('birthDate')
    })
  })

  describe('validações Bancárias', () => {
    it('deve rejeitar código de banco com letras ou diferente de 3 dígitos', () => {
      const data1: z.infer<typeof RegisterSchema> = {
        ...validBaseAluno,
        bankCode: '01',
      }
      const data2: z.infer<typeof RegisterSchema> = {
        ...validBaseAluno,
        bankCode: '01A',
      }

      const result1 = RegisterSchema.safeParse(data1)
      const result2 = RegisterSchema.safeParse(data2)

      assert(!result1.success)
      assert(!result2.success)
      expect(z.treeifyError(result1.error).properties).toHaveProperty('bankCode')
      expect(z.treeifyError(result2.error).properties).toHaveProperty('bankCode')
    })
  })
})
