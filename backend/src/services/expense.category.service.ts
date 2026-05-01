import type { z } from '@hono/zod-openapi'
import type { Prisma } from '@/generated/prisma/client'
import type { ListExpenseCategoryQuerySchema } from '@/schemas/expense.category.schema'
import prisma from '@/lib/orm'

const DIACRITICS_REGEX = /[\u0300-\u036F]/g
const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]+/g
const LEADING_TRAILING_HYPHENS_REGEX = /^-+|-+$/g

export function normalizeCategoryName(name: string): string {
  return name
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_REGEX, '-')
    .replace(LEADING_TRAILING_HYPHENS_REGEX, '')
}

export async function getNormalizedNameById(id: string): Promise<string | null> {
  const category = await prisma.expenseCategory.findUnique({
    where: { id },
    select: { normalizedName: true },
  })

  return category?.normalizedName || null
}

export async function getManyNormalizedNames(ids: string[]): Promise<string[]> {
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: ids } },
    select: { normalizedName: true },
  })

  return categories.map(c => c.normalizedName)
}

export async function getAllExpenseCategories(filters: z.infer<typeof ListExpenseCategoryQuerySchema>) {
  const where: Prisma.ExpenseCategoryWhereInput = {}

  if (filters.search) {
    where.name = {
      contains: filters.search,
      mode: 'insensitive',
    }
  }

  return prisma.expenseCategory.findMany({
    where,
    orderBy: { name: 'asc' },
  })
}

export async function validateSubcategoriesExist(subcategories: string[]): Promise<boolean> {
  const existingCount = await prisma.expenseCategory.count({ where: { normalizedName: { in: subcategories } } })

  return existingCount === subcategories.length
}
