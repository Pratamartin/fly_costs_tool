import type { AnySchema } from 'ajv'
import type { Prisma } from '@/generated/prisma/client'
import { PREFERENCE_SURVEY_ERROR_CODES } from '@/constants/preference-survey.constant'
import ajv from '@/lib/json-schema-validator'
import prisma from '@/lib/orm'

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

export async function validateAnswers(answers: { expenseCategoryId: string, data: any }[]) {
  for (const answer of answers) {
    const survey = await getActiveSurveyByCategoryId(answer.expenseCategoryId)

    if (!survey) {
      return PREFERENCE_SURVEY_ERROR_CODES.SURVEY_NOT_FOUND
    }

    const validate = ajv.compile(survey.schema as AnySchema)
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
  data: any,
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
