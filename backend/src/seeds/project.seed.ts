import { Prisma } from '@/generated/prisma/client'
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { ID_PROJ_DATA_SCIENCE, ID_PROJ_IA, ID_PROJ_ROBOTICA } from '../constants/seed.constant'
import { dummyExpenseCategories } from './expense.category.seed'

export const dummyProjects: Prisma.ProjectCreateInput[] = [
  {
    id: ID_PROJ_ROBOTICA,
    name: 'Laboratório de Robótica Avançada',
    code: 'ROBOTICA-26',
    resourceSource: 'FAPESP',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2027-12-31T23:59:59.000Z'),
    budget: new Prisma.Decimal(15000.00),
    expenseCategories: {
      connect: dummyExpenseCategories
        .map(expenseCategory => ({ id: expenseCategory.id })),
    },
  },
  {
    id: ID_PROJ_IA,
    name: 'Pesquisa em IA Aplicada',
    code: 'IA-WEB-26',
    resourceSource: 'CNPq',
    startDate: new Date('2026-06-01T00:00:00.000Z'),
    endDate: new Date('2028-06-01T00:00:00.000Z'),
    budget: new Prisma.Decimal(25000.00),
    usedBudget: new Prisma.Decimal(15000.00),
    expenseCategories: {
      connect: dummyExpenseCategories
        .map(expenseCategory => ({ id: expenseCategory.id })),
    },
  },
  {
    id: ID_PROJ_DATA_SCIENCE,
    name: 'Projeto de DATASCIENCE',
    code: 'DATA-26',
    resourceSource: 'Capes',
    startDate: new Date('2025-01-01T00:00:00.000Z'),
    endDate: new Date('2026-01-01T00:00:00.000Z'),
    budget: new Prisma.Decimal(10000.00),
    expenseCategories: { connect: dummyExpenseCategories.map(c => ({ id: c.id })) },
  },
]

async function seedProjects() {
  logger.info('🎯 Seeding Dummy Projects...')

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
