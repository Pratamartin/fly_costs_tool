/* eslint-disable no-console */
import type { ExpenseRequest } from '@/generated/prisma/client'
import { Decimal } from '@prisma/client/runtime/client'
import { ExpenseRequestStatus, ExpenseTopic } from '@/generated/prisma/client'
import prisma from '@/lib/orm'
import { ID_ALUNO, ID_PROJ_IA, ID_PROJ_ROBOTICA } from '../constants/seed.constant'

type DummyExpense = Omit<ExpenseRequest, 'createdAt' | 'updatedAt'>

const dummyExpenses: DummyExpense[] = [
  {
    id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    title: 'Inscrição SBSC 2026',
    description: 'Apresentação de artigo sobre braços mecânicos.',
    amount: new Decimal(450.00),
    topic: ExpenseTopic.INSCRICAO,
    status: ExpenseRequestStatus.APROVADO,
    studentId: ID_ALUNO,
    projectId: ID_PROJ_IA,
  },
  {
    id: 'e310a2ff-7d65-5c12-01f7-e812859g1962',
    title: 'Passagens para Manaus',
    description: 'Voo para participação no simpósio de robótica.',
    amount: Decimal(1200.50),
    topic: ExpenseTopic.PASSAGEM,
    status: ExpenseRequestStatus.REJEITADO,
    studentId: ID_ALUNO,
    projectId: ID_PROJ_IA,
  },
  {
    id: 'f421b3aa-8e76-6d23-12a8-f923960h2073',
    title: 'Alimentação - Diárias',
    description: 'Refeições durante os 3 dias de evento.',
    amount: Decimal(679.00),
    topic: ExpenseTopic.HOSPEDAGEM,
    status: ExpenseRequestStatus.PENDENTE,
    studentId: ID_ALUNO,
    projectId: ID_PROJ_ROBOTICA,
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
