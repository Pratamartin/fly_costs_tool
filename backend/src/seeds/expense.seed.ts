import type { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { getRelativeDate } from '@/lib/util'
import { ID_ALUNO, ID_PROJ_DATA_SCIENCE, ID_PROJ_IA } from '../constants/seed.constant'

export const dummyExpenses: Prisma.ExpenseRequestCreateInput[] = [
  {
    id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    title: 'Inscrição SBSC 2026',
    description: 'Apresentação de artigo sobre braços mecânicos.',
    status: ExpenseRequestStatus.APROVADO,
    student: { connect: { id: ID_ALUNO } },
    project: { connect: { id: ID_PROJ_IA } },
    city: 'Dois Vizinhos',
    state: 'BR-PR',
    country: 'BR',
    // Viagem daqui a 30 dias, voltando em 31 dias
    departureDate: getRelativeDate(30, 9), // Daqui 30 dias às 09:00
    returnDate: getRelativeDate(31, 18), // Daqui 31 dias às 18:00
  },
  {
    id: '104bfd84-d27e-44c0-a26b-96db1ac0fb10',
    title: 'Participação na ERAD 2026',
    description: 'Apresentação sobre otimização de redes neurais embarcadas.',
    status: ExpenseRequestStatus.EM_PROCESSAMENTO,
    student: { connect: { id: ID_ALUNO } },
    project: { connect: { id: ID_PROJ_DATA_SCIENCE } },
    city: 'Porto Alegre',
    state: 'BR-RS',
    country: 'BR',
    departureDate: getRelativeDate(15, 7), // Daqui 15 dias às 07:00
    returnDate: getRelativeDate(18, 20), // Daqui 18 dias às 20:00
  },
  {
    id: 'ef9ac2fc-a3a2-488b-b06b-480e57315c4f',
    title: 'Passagens para Manaus',
    description: 'Voo para participação no simpósio de robótica.',
    status: ExpenseRequestStatus.REJEITADO,
    student: { connect: { id: ID_ALUNO } },
    project: undefined,
    city: 'Manaus',
    state: 'BR-AM',
    country: 'BR',
    // Viagem no passado (para simular requisições antigas)
    departureDate: getRelativeDate(-15, 9), // 15 dias atrás
    returnDate: getRelativeDate(-10, 18), // 10 dias atrás
  },
  {
    id: '9e730bb7-6123-4363-8f87-e37f907a3246',
    title: 'Alimentação - Diárias',
    description: 'Refeições durante os 3 dias de evento.',
    status: ExpenseRequestStatus.PENDENTE,
    student: { connect: { id: ID_ALUNO } },
    project: undefined,
    city: 'Anta Gorda',
    state: 'BR-RS',
    country: 'BR',
    // Viagem iminente
    departureDate: getRelativeDate(2, 9), // Daqui 2 dias
    returnDate: getRelativeDate(5, 18), // Daqui 5 dias
  },
  {
    id: 'ee128e58-fb1a-4be0-b2f3-9c6229b49784',
    title: 'Hospedagem em Conferência',
    description: 'Reserva de hotel para o período do evento.',
    status: ExpenseRequestStatus.EM_EDICAO,
    correctionReason: 'Por favor, corrija seus dados bancários',
    student: { connect: { id: ID_ALUNO } },
    project: undefined,
    city: 'Curitiba',
    state: 'BR-PR',
    country: 'BR',
    departureDate: getRelativeDate(10, 14),
    returnDate: getRelativeDate(14, 10),
  },
]

async function seedExpenses() {
  logger.info('💰 Seeding Dummy Expenses...')

  for (const { id, ...data } of dummyExpenses) {
    await prisma.expenseRequest.upsert({
      where: { id },
      update: data,
      create: {
        id,
        ...data,
      },
    })
  }
}

export default seedExpenses
