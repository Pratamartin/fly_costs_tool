import Ajv from 'ajv'
import addErrors from 'ajv-errors'
import addFormats from 'ajv-formats'
import countries from 'i18n-iso-countries'
import iso31662 from 'iso-3166-2'
import { EXPENSE_ERROR_CODES } from '@/constants/expense.constant'

const ajv = new Ajv({
  allErrors: true,
  $data: true,
  strict: false,
  useDefaults: true,
})

addFormats(ajv)
addErrors(ajv)

ajv.addFormat('iso-country', { validate: (code: string) => countries.isValid(code.toUpperCase()) })
ajv.addFormat('iso-state', { validate: (code: string) => iso31662.subdivision(code.toUpperCase()) !== null })

ajv.addKeyword({
  keyword: 'dateAfter',
  type: 'string',
  $data: true,
  validate: (otherDateStr: any, currentDateStr: any) => {
    if (!currentDateStr || !otherDateStr)
      return true
    const current = new Date(currentDateStr)
    const other = new Date(otherDateStr)
    return !Number.isNaN(current.getTime()) && !Number.isNaN(other.getTime()) ? current >= other : true
  },
  error: { message: EXPENSE_ERROR_CODES.RETURN_BEFORE_DEPARTURE },
})

ajv.addKeyword({
  keyword: 'belongsToCountry',
  type: 'string',
  $data: true,
  validate: (countryCode: any, stateCode: any) => {
    if (!countryCode || !stateCode)
      return true
    return String(stateCode).toUpperCase()
      .startsWith(`${String(countryCode).toUpperCase()}-`)
  },
  error: { message: 'STATE_COUNTRY_MISMATCH' },
})

export default ajv
