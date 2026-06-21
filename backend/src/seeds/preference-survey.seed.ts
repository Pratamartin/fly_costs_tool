import type { Prisma } from '@/generated/prisma/client'
import { ID_SURVEY_DIARIAS, ID_SURVEY_INSCRICAO, ID_SURVEY_PASSAGEM_AEREA } from '@/constants/seed.constant'
import surveySchema from '@/json/preference-survey/preference-survey.schema.json' with { type: 'json' }
import surveyUiSchema from '@/json/preference-survey/preference-survey.ui.json' with { type: 'json' }
import { logger } from '@/lib/logger'
import prisma from '@/lib/orm'
import { dummyExpenseCategories } from './expense.category.seed'

const SURVEY_IDS: Record<string, string> = {
  'diarias': ID_SURVEY_DIARIAS,
  'inscricao': ID_SURVEY_INSCRICAO,
  'passagem-aerea': ID_SURVEY_PASSAGEM_AEREA,
}

export async function seedPreferenceSurveys() {
  logger.info('📋 Seeding Preference Surveys from JSON files...')

  const definitions = surveySchema.definitions

  for (const [normalizedName, schema] of Object.entries(definitions)) {
    const category = dummyExpenseCategories.find(c => c.normalizedName === normalizedName)
    const surveyId = SURVEY_IDS[normalizedName]
    const ui = (surveyUiSchema as any)[normalizedName]

    if (!category || !category.id || !surveyId) {
      logger.warn(`Category "${normalizedName}" or its constant ID not found, skipping survey seed.`)
      continue
    }

    await prisma.preferenceSurvey.upsert({
      where: { id: surveyId },
      update: {
        schema: schema as Prisma.InputJsonValue,
        ui: ui as Prisma.InputJsonValue,
        version: 1,
        isActive: true,
      },
      create: {
        id: surveyId,
        expenseCategoryId: category.id,
        schema: schema as Prisma.InputJsonValue,
        ui: ui as Prisma.InputJsonValue,
        version: 1,
        isActive: true,
      },
    })
  }
}

export default seedPreferenceSurveys
