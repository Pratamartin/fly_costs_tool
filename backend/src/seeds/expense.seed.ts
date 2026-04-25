/* eslint-disable no-console */
import type { Prisma } from '@/generated/prisma/client'
import { ExpenseRequestStatus } from '@/generated/prisma/client'
import prisma from '@/lib/orm'
import { ID_ALUNO, ID_PROJ_IA } from '../constants/seed.constant'

export const dummyExpenses: Prisma.ExpenseRequestCreateInput[] = [
  {
    id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    title: 'Inscrição SBSC 2026',
    description: 'Apresentação de artigo sobre braços mecânicos.',
    status: ExpenseRequestStatus.APROVADO,
    student: { connect: { id: ID_ALUNO } },
    project: { connect: { id: ID_PROJ_IA } },
  },
  {
    id: 'ef9ac2fc-a3a2-488b-b06b-480e57315c4f',
    title: 'Passagens para Manaus',
    description: 'Voo para participação no simpósio de robótica.',
    status: ExpenseRequestStatus.REJEITADO,
    student: { connect: { id: ID_ALUNO } },
    project: undefined,
  },
  {
    id: '9e730bb7-6123-4363-8f87-e37f907a3246',
    title: 'Alimentação - Diárias',
    description: 'Refeições durante os 3 dias de evento.',
    status: ExpenseRequestStatus.PENDENTE,
    student: { connect: { id: ID_ALUNO } },
    project: undefined,
  },
]

async function seedExpenses() {
  console.log('💰 Seeding Dummy Expenses...')

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
