import { z } from '@hono/zod-openapi'
import countries from 'i18n-iso-countries'
import iso31662 from 'iso-3166-2'

export const validStateCheck = z.refine<{ state: string }>(
  value => iso31662.subdivision(value.state) !== null,
  { message: 'Código de estado/província inexistente. Utilize um código válido (ex: \'BR-SP\').' },
)

export const validCountryCheck = z.refine<{ country: string }>(
  value => countries.isValid(value.country),
  { message: 'Código de país inexistente. Utilize uma sigla ISO válida (ex: \'BR\').' },
)

export const stateBelongsToCountryCheck = z.refine<{ state: string, country: string }>(
  value => value.state.startsWith(`${value.country}-`),
  {
    message: 'O estado informado não pertence ao país selecionado.',
    path: ['state'],
  },
)

export const returnDateAfterDepartureDateCheck = z.refine<{ returnDate: Date, departureDate: Date }>(
  value => value.returnDate >= value.departureDate,
  {
    message: 'A data de retorno não pode ser anterior à data de partida',
    path: ['returnDate'],
  },
)
