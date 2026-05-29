import type { AnySchema, ValidateFunction } from 'ajv'
import type { Prisma } from '@/generated/prisma/client'
import { PREFERENCE_SURVEY_ERROR_CODES } from '@/constants/preference-survey.constant'
import ajv from '@/lib/json-schema-validator'
import prisma from '@/lib/orm'

/**
 * Cache para validadores AJV compilados para evitar recompilação JIT repetitiva.
 * Chave: preferenceSurvey.id
 */
const validatorCache = new Map<string, ValidateFunction>()

export async function getActiveSurveys() {
  return prisma.preferenceSurvey.findMany({
    where: { isActive: true },
    include: {
      expenseCategory: {
        select: {
          name: true,
          normalizedName: true,
        },
      },
    },
  })
}

export async function getActiveSurveyByCategoryId(categoryId: string) {
  return prisma.preferenceSurvey.findFirst({
    where: {
      expenseCategoryId: categoryId,
      isActive: true,
    },
    orderBy: { version: 'desc' },
  })
}

export async function validateAnswers(answers: { expenseCategoryId: string, data: Record<string, unknown> }[]) {
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return PREFERENCE_SURVEY_ERROR_CODES.AT_LEAST_ONE_ANSWER_REQUIRED
  }

  // Otimização: Busca em lote para evitar N+1 queries
  const categoryIds = answers.map(a => a.expenseCategoryId)
  const surveys = await prisma.preferenceSurvey.findMany({
    where: {
      expenseCategoryId: { in: categoryIds },
      isActive: true,
    },
  })

  for (const answer of answers) {
    const survey = surveys.find(s => s.expenseCategoryId === answer.expenseCategoryId)

    if (!survey) {
      return PREFERENCE_SURVEY_ERROR_CODES.SURVEY_NOT_FOUND
    }

    // Otimização: Uso de cache para o validador compilado
    let validate = validatorCache.get(survey.id)
    if (!validate) {
      validate = ajv.compile(survey.schema as AnySchema)
      validatorCache.set(survey.id, validate)
    }

    const valid = validate(answer.data)

    if (!valid) {
      const error = validate.errors?.[0]
      return error?.message || PREFERENCE_SURVEY_ERROR_CODES.INVALID_SURVEY_DATA
    }
  }
  return null
}

export async function createSurveyAnswer(
  tx: Prisma.TransactionClient,
  expenseRequestId: string,
  categoryId: string,
  data: Record<string, unknown>,
) {
  const survey = await getActiveSurveyByCategoryId(categoryId)

  if (!survey) {
    throw new Error(PREFERENCE_SURVEY_ERROR_CODES.SURVEY_NOT_FOUND)
  }

  return tx.preferenceSurveyAnswer.create({
    data: {
      data: data as Prisma.InputJsonValue,
      surveyId: survey.id,
      expenseRequestId,
    },
  })
}
