/* eslint-disable no-console */
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/orm'

export const dummyExpenseCategories: Prisma.ExpenseCategoryCreateInput[] = [
  {
    id: '0748489b-4449-408a-a16b-44c9e0550c29',
    name: 'Inscrição',
    normalizedName: 'inscricao',
  },
  {
    id: '12a3c3b4-acd5-4446-aeec-dc0e6d224183',
    name: 'Hospedagem',
    normalizedName: 'hospedagem',
  },
  {
    id: '131a5c24-ced2-47a9-bf86-6efe738d4f00',
    name: 'Passagem Aérea',
    normalizedName: 'passagem-aerea',
  },
]

async function seedExpenseCategories() {
  console.log('💰 Seeding Dummy Expense Categories...')

  for (const category of dummyExpenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { id: category.id },
      update: { name: category.name },
      create: category,
    })
  }
}

export default seedExpenseCategories
