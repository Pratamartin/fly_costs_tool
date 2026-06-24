import { cpf } from 'cpf-cnpj-validator'
import { EXAMPLE_CPF } from '@/schemas/schema.refine'

const ID_ALUNO = 'c341c8fa-724f-4ab2-9a4e-5ca55f201ad4'
const ID_PROJ_ROBOTICA = 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab'
const ID_PROJ_DATA_SCIENCE = '4aa1fe1f-5c8b-4fd5-999b-adf0195b0ccb'

const ID_PROJ_IA = 'b2c3d4e5-f6a7-5b6c-9d0e-1234567890bc'
const DEFAULT_USER_PASSWORD = 'Test@1234'

const ID_SURVEY_DIARIAS = '68816593-b6cd-4325-90fc-bb0db20fdb78'
const ID_SURVEY_INSCRICAO = '2c8f25b5-744c-4b19-8434-a951f4196f25'
const ID_SURVEY_PASSAGEM_AEREA = 'e8744823-dc60-45d4-9540-3461fd6b21e4'

const MOCK_PROFILE = {
  cpf: cpf.generate(),
  rgPassaporte: 'MG-12.345.678',
  birthDate: '2000-01-01T00:00:00.000Z',
  profession: 'Estudante',
  address: 'Rua das Flores, 123',
  bankCode: '001',
  bankName: 'BANCO DO BRASIL',
  bankAgency: '1234-5',
  bankAccount: '12345678',
  pixKey: EXAMPLE_CPF,
} as const

const MOCK_USER = {
  name: 'João Silva',
  email: 'usuario@exemplo.com',
  password: 'P@ssw0rd123',
  inviteCode: 'aluno2026',
} as const

export {
  DEFAULT_USER_PASSWORD,
  ID_ALUNO,
  ID_PROJ_DATA_SCIENCE,
  ID_PROJ_IA,
  ID_PROJ_ROBOTICA,
  ID_SURVEY_DIARIAS,
  ID_SURVEY_INSCRICAO,
  ID_SURVEY_PASSAGEM_AEREA,
  MOCK_PROFILE,
  MOCK_USER,
}
