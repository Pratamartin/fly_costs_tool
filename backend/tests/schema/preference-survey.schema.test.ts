import { describe, expect, it } from 'vitest'
import { preferenceSurveyJSONSchema } from '@/json'
import ajv from '@/lib/json-schema-validator'

describe('preference Survey Schema Validation', () => {
  describe('hospedagem', () => {
    const validate = ajv.compile((preferenceSurveyJSONSchema).definitions.hospedagem)

    it('deve validar com sucesso um booleano', () => {
      expect(validate(true)).toBe(true)
      expect(validate(false)).toBe(true)
    })

    it('deve falhar para valores não booleanos', () => {
      expect(validate('true')).toBe(false)
      expect(validate(1)).toBe(false)
      expect(validate({})).toBe(false)
    })
  })

  describe('inscricao', () => {
    const validate = ajv.compile((preferenceSurveyJSONSchema).definitions.inscricao)

    it('deve validar com sucesso uma inscrição válida', () => {
      const validPayload = { invoiceKey: 'formulario-preferencias/user-123/invoice.pdf' }
      expect(validate(validPayload)).toBe(true)
    })

    it('deve falhar para chave R2 inválida', () => {
      const invalidPayload = { invoiceKey: 'invalid-key/file.pdf' }
      expect(validate(invalidPayload)).toBe(false)
    })

    it('deve falhar se invoiceKey estiver faltando', () => {
      const invalidPayload = {}
      expect(validate(invalidPayload)).toBe(false)
    })
  })

  describe('passagem-aerea', () => {
    const validate = ajv.compile((preferenceSurveyJSONSchema).definitions['passagem-aerea'])

    it('deve validar com sucesso uma solicitação de passagem válida', () => {
      const validPayload = {
        departureDate: '2026-06-01',
        returnDate: '2026-06-10',
        departureRoute: 'Manaus para São Paulo',
        returnRoute: 'São Paulo para Manaus',
      }
      expect(validate(validPayload)).toBe(true)
    })

    it('deve validar quando a data de retorno é igual à de ida', () => {
      const validPayload = {
        departureDate: '2026-06-01',
        returnDate: '2026-06-01',
        departureRoute: 'Manaus para São Paulo',
        returnRoute: 'São Paulo para Manaus',
      }
      expect(validate(validPayload)).toBe(true)
    })

    it('deve validar com sucesso uma solicitação de passagem com flightSuggestionKey', () => {
      const validPayload = {
        departureDate: '2026-06-01',
        returnDate: '2026-06-10',
        departureRoute: 'Manaus para São Paulo',
        returnRoute: 'São Paulo para Manaus',
        flightSuggestionKey: 'formulario-preferencias/user-123/flight.pdf',
      }
      expect(validate(validPayload)).toBe(true)
    })

    it('deve falhar se flightSuggestionKey for uma chave R2 inválida', () => {
      const invalidPayload = {
        departureDate: '2026-06-01',
        returnDate: '2026-06-10',
        departureRoute: 'Manaus para São Paulo',
        returnRoute: 'São Paulo para Manaus',
        flightSuggestionKey: 'not-a-r2-key',
      }
      expect(validate(invalidPayload)).toBe(false)
    })

    it('deve falhar quando a data de retorno é anterior à de ida (dateAfter keyword)', () => {
      const invalidPayload = {
        departureDate: '2026-06-10',
        returnDate: '2026-06-01',
        departureRoute: 'Manaus para São Paulo',
        returnRoute: 'São Paulo para Manaus',
      }
      expect(validate(invalidPayload)).toBe(false)
      expect(validate.errors?.[0]?.keyword).toBe('dateAfter')
      expect(validate.errors?.[0]?.message).toBe('RETURN_DATE_BEFORE_DEPARTURE')
    })

    it('deve falhar para formato de data inválido', () => {
      const invalidPayload = {
        departureDate: '01/06/2026',
        returnDate: '10/06/2026',
        departureRoute: 'Manaus para São Paulo',
        returnRoute: 'São Paulo para Manaus',
      }
      expect(validate(invalidPayload)).toBe(false)
      expect(validate.errors?.[0]?.message).toContain('must match format "date"')
    })

    it('deve falhar se campos obrigatórios estiverem faltando', () => {
      const invalidPayload = {
        departureDate: '2026-06-01',
        returnDate: '2026-06-10',
      }
      expect(validate(invalidPayload)).toBe(false)
    })
  })
})
