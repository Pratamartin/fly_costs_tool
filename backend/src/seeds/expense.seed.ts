import type { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { ID_ALUNO, ID_PROJ_IA, ID_PROJ_ROBOTICA } from '../constants/seed.constant'

export const dummyExpenses: Prisma.ExpenseRequestCreateInput[] = [
  {
    id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    title: 'Inscrição SBSC 2026',
    description: 'Apresentação de artigo sobre braços mecânicos.',
    status: ExpenseRequestStatus.APROVADO,
    event: {
      name: 'SBSC 2026',
      location: 'Rio de Janeiro/RJ',
    },
    article: { classification: 'A1' },
    student: { connect: { id: ID_ALUNO } },
  },
  {
    id: '104bfd84-d27e-44c0-a26b-96db1ac0fb10',
    title: 'Participação na ERAD 2026',
    description: 'Apresentação sobre otimização de redes neurais embarcadas.',
    status: ExpenseRequestStatus.EM_PROCESSAMENTO,
    event: {
      name: 'ERAD 2026',
      location: 'Florianópolis/SC',
    },
    article: { classification: 'A2' },
    student: { connect: { id: ID_ALUNO } },
    costBreakdowns: {
      create: [
        {
          amount: 15000,
          project: { connect: { id: ID_PROJ_IA } },
          expenseCategory: { connect: { normalizedName: 'inscricao' } },
        },
        {
          amount: 15000,
          project: { connect: { id: ID_PROJ_ROBOTICA } },
          expenseCategory: { connect: { normalizedName: 'diarias' } },
        },
        {
          amount: 10,
          project: { connect: { id: ID_PROJ_ROBOTICA } },
          expenseCategory: { connect: { normalizedName: 'passagem-aerea' } },
        },
      ],
    },
  },
  {
    id: 'ef9ac2fc-a3a2-488b-b06b-480e57315c4f',
    title: 'Passagens para Manaus',
    description: 'Voo para participação no simpósio de robótica.',
    status: ExpenseRequestStatus.REJEITADO,
    event: {
      name: 'Simpósio de Robótica',
      location: 'Manaus/AM',
    },
    article: { classification: 'Sem Qualis' },
    student: { connect: { id: ID_ALUNO } },
  },
  {
    id: '9e730bb7-6123-4363-8f87-e37f907a3246',
    title: 'Alimentação - Diárias',
    description: 'Refeições durante os 3 dias de evento.',
    status: ExpenseRequestStatus.PENDENTE,
    event: {
      name: 'Evento Genérico',
      location: 'Remoto',
    },
    article: { classification: 'Sem Qualis' },
    student: { connect: { id: ID_ALUNO } },
  },
  {
    id: 'ee128e58-fb1a-4be0-b2f3-9c6229b49784',
    title: 'Diárias em Conferência',
    description: 'Reserva de hotel para o período do evento.',
    status: ExpenseRequestStatus.EM_EDICAO,
    correctionReason: 'Por favor, corrija seus dados bancários',
    event: {
      name: 'Conferência Anual',
      location: 'Brasília/DF',
    },
    article: { classification: 'B1' },
    student: { connect: { id: ID_ALUNO } },
  },
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    title: 'Simulação de Gasto Histórico',
    description: 'Simulação de compra concluída de passagens/inscrição no passado.',
    status: ExpenseRequestStatus.CONCLUIDO,
    event: {
      name: 'Evento Histórico',
      location: 'Porto Alegre/RS',
    },
    article: { classification: 'Sem Qualis' },
    student: { connect: { id: ID_ALUNO } },
    costBreakdowns: {
      create: [
        {
          amount: 15000,
          project: { connect: { id: ID_PROJ_IA } },
          expenseCategory: { connect: { normalizedName: 'inscricao' } },
        },
      ],
    },
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
