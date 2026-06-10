import type { AnySchema, ValidateFunction } from 'ajv'
import type { Prisma } from '@/generated/prisma/client'
import type { ServiceResult } from '@/lib/problems'
import { ZodIssueCode } from 'zod'
import ajv, { formatAjvErrors } from '@/lib/json-schema-validator'
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

export async function validateAnswers(answers: { expenseCategoryId: string, data: Record<string, unknown> }[]): Promise<ServiceResult<{ success: true }, 'VALIDATION_ERROR'>> {
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return {
      error: 'VALIDATION_ERROR',
      context: {
        errors: [{
          field: 'surveyAnswers',
          message: 'AT_LEAST_ONE_ANSWER_REQUIRED',
          code: ZodIssueCode.custom,
        }],
      },
    }
  }

  // Otimização: Busca em lote para evitar N+1 queries
  const categoryIds = answers.map(a => a.expenseCategoryId)
  const surveys = await prisma.preferenceSurvey.findMany({
    where: {
      expenseCategoryId: { in: categoryIds },
      isActive: true,
    },
  })

  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i]!
    const survey = surveys.find(s => s.expenseCategoryId === answer.expenseCategoryId)

    if (!survey) {
      return {
        error: 'VALIDATION_ERROR',
        context: {
          errors: [{
            field: `surveyAnswers.${i}.expenseCategoryId`,
            message: 'SURVEY_NOT_FOUND',
            code: ZodIssueCode.custom,
          }],
        },
      }
    }

    // Otimização: Uso de cache para o validador compilado
    let validate = validatorCache.get(survey.id)
    if (!validate) {
      validate = ajv.compile(survey.schema as AnySchema)
      validatorCache.set(survey.id, validate)
    }

    const valid = validate(answer.data)

    if (!valid && validate.errors) {
      const errors = formatAjvErrors({
        errors: validate.errors,
        schema: survey.schema as AnySchema,
        data: answer.data,
        basePath: `surveyAnswers.${i}.data`,
      })

      return {
        error: 'VALIDATION_ERROR',
        context: { errors },
      }
    }
  }
  return { success: true }
}

export async function createSurveyAnswer(
  tx: Prisma.TransactionClient,
  expenseRequestId: string,
  categoryId: string,
  data: Record<string, unknown>,
) {
  const survey = await getActiveSurveyByCategoryId(categoryId)

  if (!survey) {
    throw new Error('SURVEY_NOT_FOUND')
  }

  return tx.preferenceSurveyAnswer.create({
    data: {
      data: data as Prisma.InputJsonValue,
      surveyId: survey.id,
      expenseRequestId,
    },
  })
}
