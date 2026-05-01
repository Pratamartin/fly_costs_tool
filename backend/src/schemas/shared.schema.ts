import { z } from '@hono/zod-openapi'
import { jsonContent } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'

export const IdSchema = z.uuid()
  .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' })

export const TimestampSchema = z.object({
  createdAt: z.coerce.date()
    .openapi({ example: '2026-02-02T12:34:56Z' }),
  updatedAt: z.coerce.date()
    .openapi({ example: '2026-02-02T12:45:00Z' }),
}).shape

export const LocationSchema = z.object({
  city: z.string()
    .min(2)
    .openapi({ example: 'Dois Vizinhos' }),

  state: z.string()
    .min(4)
    .max(6)
    .toUpperCase()
    .openapi({
      example: 'BR-PR',
      description: 'Sigla do estado/província no padrão ISO 3166-2 (ex: BR-AM)',
      externalDocs: {
        description: 'Consulte os códigos ISO 3166-2',
        url: 'https://en.wikipedia.org/wiki/ISO_3166-2',
      },
    }),

  country: z.string()
    .length(2)
    .toUpperCase()
    .default('BR')
    .openapi({
      example: 'BR',
      description: 'Sigla internacional do país com 2 caracteres (padrão ISO 3166-1 alpha-2)',
      externalDocs: {
        description: 'Consulte os códigos ISO 3166-1',
        url: 'https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2',
      },
    }),
})

export const TripPeriodSchema = z.object({
  departureDate: z.coerce.date().openapi({
    example: '2026-05-20T09:00:00Z',
    description: 'Data de ida',
  }),
  returnDate: z.coerce.date().openapi({
    example: '2026-05-25T18:00:00Z',
    description: 'Data de volta',
  }),
})

export const UnauthorizedResponse = jsonContent(createMessageObjectSchema('Não autenticado'), 'Erro: Token inválido ou expirado.')
export const ForbiddenResponse = jsonContent(createMessageObjectSchema('Acesso restrito'), 'Erro: Perfil não autorizado.')
