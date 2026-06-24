import dayjs from 'dayjs'
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
    startDate: dayjs().subtract(1, 'month')
      .toDate(),
    endDate: dayjs().add(1, 'year')
      .toDate(),
    budget: new Prisma.Decimal(20000.00), // Mínimo = 15010 (seed) + margem
    isActive: true,
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
    startDate: dayjs().subtract(1, 'month')
      .toDate(),
    endDate: dayjs().add(2, 'year')
      .toDate(),
    budget: new Prisma.Decimal(35000.00), // Mínimo = 30000 (seed) + margem
    usedBudget: new Prisma.Decimal(15000.00),
    isActive: true,
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
    startDate: dayjs().subtract(2, 'year')
      .toDate(),
    endDate: dayjs().subtract(1, 'month')
      .toDate(),
    budget: new Prisma.Decimal(10000.00),
    isActive: true,
    expenseCategories: { connect: dummyExpenseCategories.map(c => ({ id: c.id })) },
  },
  {
    id: '95b138f9-f17c-4041-bd90-946cdd164c0a',
    name: 'Projeto Arquivado Antigo',
    code: 'ARQ-2024',
    resourceSource: 'FAPESP',
    startDate: dayjs().subtract(3, 'year')
      .toDate(),
    endDate: dayjs().subtract(2, 'year')
      .toDate(),
    budget: new Prisma.Decimal(5000.00),
    isActive: false,
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
