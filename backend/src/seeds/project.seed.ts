/* eslint-disable no-console */
import type { Project } from '@/generated/prisma/client'
import { Decimal } from '@prisma/client/runtime/client'
import { ExpenseTopic } from '@/generated/prisma/client'
import prisma from '@/lib/orm'
import { ID_PROJ_IA, ID_PROJ_ROBOTICA } from '../constants/seed.constant'

type DummyProject = Omit<Project, 'createdAt' | 'updatedAt'>

export const dummyProjects: DummyProject[] = [
  {
    id: ID_PROJ_ROBOTICA,
    name: 'Laboratório de Robótica Avançada',
    code: 'ROBOTICA-26',
    budget: new Decimal(15000.00),
    expenseTopics: [
      ExpenseTopic.INSCRICAO,
      ExpenseTopic.PASSAGEM,
      ExpenseTopic.HOSPEDAGEM,
    ],
  },
  {
    id: ID_PROJ_IA,
    name: 'Pesquisa em IA Aplicada',
    code: 'IA-WEB-26',
    budget: new Decimal(25000.00),
    expenseTopics: [
      ExpenseTopic.PASSAGEM,
    ],
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
