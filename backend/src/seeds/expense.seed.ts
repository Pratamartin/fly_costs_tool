import type { Project, User } from '@/generated/prisma/client'
import { ExpenseRequestStatus, ExpenseTopic } from '@/generated/prisma/client'
import prisma from '@/lib/orm'

async function seedExpenses() {
  // eslint-disable-next-line no-console
  console.log('🧪 Seeding Dummy Expenses...')

  const aluno: User | null = await prisma.user.findUnique({ where: { email: 'aluno@icomp.ufam.edu.br' } })
  const projeto: Project | null = await prisma.project.findUnique({ where: { code: 'ROBOTICA-26' } })

  if (!aluno || !projeto)
    return

  const dummyExpenseId = 'd290f1ee-6c54-4b01-90e6-d701748f0851'

  await prisma.expenseRequest.upsert({
    where: { id: dummyExpenseId },
    update: {},
    create: {
      id: dummyExpenseId,
      title: 'Inscrição SBSC 2026',
      description: 'Apresentação de artigo sobre braços mecânicos.',
      amount: 450.00,
      topic: ExpenseTopic.INSCRICAO,
      status: ExpenseRequestStatus.PENDENTE,
      studentId: aluno.id,
      projectId: projeto.id,
    },
  })
}

export default seedExpenses
