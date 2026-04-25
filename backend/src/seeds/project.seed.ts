/* eslint-disable no-console */
import type { Prisma } from '@/generated/prisma/client'
import { Decimal } from '@prisma/client/runtime/client'
import prisma from '@/lib/orm'
import { ID_PROJ_IA, ID_PROJ_ROBOTICA } from '../constants/seed.constant'
import { dummyExpenseCategories } from './expense.category.seed'

export const dummyProjects: Prisma.ProjectCreateInput[] = [
  {
    id: ID_PROJ_ROBOTICA,
    name: 'Laboratório de Robótica Avançada',
    code: 'ROBOTICA-26',
    budget: new Decimal(15000.00),
    expenseCategories: {
      connect: dummyExpenseCategories
        .map(expenseCategory => ({ id: expenseCategory.id })),
    },
  },
  {
    id: ID_PROJ_IA,
    name: 'Pesquisa em IA Aplicada',
    code: 'IA-WEB-26',
    budget: new Decimal(25000.00),

  },
]

async function seedProjects() {
  console.log('🎯 Seeding Dummy Projects...')

  for (const { id, ...data } of dummyProjects) {
    await prisma.project.upsert({
      where: { id },
      update: { ...data },
      create: {
        id,
        ...data,
      },
    })
  }
}

export default seedProjects
