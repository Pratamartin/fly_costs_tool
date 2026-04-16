import { ExpenseTopic } from '@/generated/prisma/client'
import prisma from '@/lib/orm'

async function seedProjects() {
  // eslint-disable-next-line no-console
  console.log('⏳ Seeding Projects...')

  await prisma.project.upsert({
    where: { code: 'ROBOTICA-26' },
    update: {},
    create: {
      name: 'Laboratório de Robótica Avançada',
      code: 'ROBOTICA-26',
      budget: 15000.00,
      expenseTopics: [ExpenseTopic.INSCRICAO, ExpenseTopic.PASSAGEM, ExpenseTopic.HOSPEDAGEM],
    },
  })
}

export default seedProjects
