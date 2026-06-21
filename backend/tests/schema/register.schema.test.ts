import { z } from '@hono/zod-openapi'
import { cnpj, cpf } from 'cpf-cnpj-validator'
import { getExampleNumber } from 'libphonenumber-js'
import phoneExamples from 'libphonenumber-js/examples.mobile.json'
import { assert, describe, expect, it } from 'vitest'
import { UserRole } from '@/generated/prisma/enums'
import { RegisterSchema } from '@/schemas/auth.schema'
import { EXAMPLE_PHONE } from '@/schemas/schema.refine'

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
    bankAccount: '12345-6',
    pixKey: EXAMPLE_PHONE,
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
  describe('validacao Chave Pix', () => {
    describe('cenários Positivos (Devem Passar)', () => {
      it('deve aceitar CPF com pontuação', () => {
        const valid = cpf.generate(true)
        expect(() => RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: valid,
        })).not.toThrow()
      })

      it('deve aceitar CPF sem pontuação', () => {
        const valid = cpf.generate(false)
        expect(() => RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: valid,
        })).not.toThrow()
      })

      it('deve aceitar CNPJ com pontuação', () => {
        const valid = cnpj.generate(true)
        expect(() => RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: valid,
        })).not.toThrow()
      })

      it('deve aceitar CNPJ sem pontuação', () => {
        const valid = cnpj.generate(false)
        expect(() => RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: valid,
        })).not.toThrow()
      })

      it('deve aceitar Email', () => {
        expect(RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: 'aluno.teste@universidade.edu.br',
        }).success).toBe(true)
        expect(RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: 'teste@gmail.com',
        }).success).toBe(true)
      })

      it('deve aceitar Telefone no padrão E.164', () => {
        // Canonical BR example from Google's libphonenumber database
        expect(RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: EXAMPLE_PHONE,
        }).success).toBe(true)
        // Canonical US example
        expect(RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: getExampleNumber('US', phoneExamples)?.format('E.164') ?? '+12015550123',
        }).success).toBe(true)
      })

      it('deve aceitar Chave Aleatória (EVP/UUID)', () => {
        expect(RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: '123e4567-e89b-12d3-a456-426614174000',
        }).success).toBe(true)
      })
    })

    describe('cenários Negativos (Devem Falhar)', () => {
      const expectPixError = (val: string) => {
        const result = RegisterSchema.safeParse({
          ...validBaseAluno,
          pixKey: val,
        })
        assert(!result.success)

        const pixIssue = result.error.issues.find(i => i.path.includes('pixKey'))
        // Com o z.union, QUALQUER falha (seja CPF, Email, etc) cai no errorMap genérico de union
        expect(pixIssue?.message).toBe('Invalid PIX key format. Use E-mail, Phone (+55...), CPF, CNPJ or EVP (UUID).')
      }

      it('deve rejeitar CPF inválido', () => {
        expectPixError('111.111.111-11')
      })

      it('deve rejeitar CNPJ inválido', () => {
        expectPixError('00.000.000/0000-00')
      })

      it('deve rejeitar Email malformado', () => {
        expectPixError('alunouniversidade.com')
        expectPixError('aluno@')
        expectPixError('@gmail.com')
      })

      it('deve rejeitar Telefone sem o sinal de +', () => {
        expectPixError('5511999999999')
      })

      it('deve rejeitar Telefone com caracteres inválidos', () => {
        expectPixError('+55 11 99999-9999')
        expectPixError('+55(11)999999999')
      })

      it('deve rejeitar Chaves Aleatórias (EVP) fora do formato UUID', () => {
        expectPixError('123e4567-e89b-12d3-a456')
        expectPixError('123e4567e89b12d3a456426614174000')
      })

      it('deve rejeitar textos genéricos e tipos incompatíveis', () => {
        expectPixError('chave-aleatoria-qualquer')
      })
    })
  })
})
