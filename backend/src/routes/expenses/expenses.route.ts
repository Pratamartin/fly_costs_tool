import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { UserRole } from '@/generated/prisma/enums'
import { articleJSONSchema, eventJSONSchema } from '@/json'
import { registryResponses, standardResponses } from '@/lib/problems'
import { multipartFormContentRequired } from '@/lib/util'
import { requireAuth, requireRole, validateJsonSchema } from '@/middlewares'
import { uploadMemorandumSettings } from '@/middlewares/upload-settings'
import { AssignProjectResponseSchema, CreateExpenseResponseSchema, CreateExpenseSchema, ExpenseListQuerySchema, ExpenseResponseSchema, ListExpenseResponseSchema, UpdateExpenseSchema, UpdateExpenseStatusSchema, UploadMemorandumSchema } from '@/schemas/expense.schema'
import { IdSchema } from '@/schemas/shared.schema'

const tags = ['Expenses']

export type CreateRoute = typeof create
export type IndexRoute = typeof index
export type ReadRoute = typeof read
export type UpdateRoute = typeof update
export type UpdateStatusRoute = typeof updateStatus
export type AssignProjectRoute = typeof assignProject
export type UploadMemorandumRoute = typeof uploadMemorandum
export type GetMemorandumDownloadRoute = typeof getMemorandumDownload
export type ConcludeRoute = typeof conclude

const ALLOWED_ROLES: UserRole[] = ['ALUNO']

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'List expenses',
  description: 'Returns all expenses if ADMIN/COORDENADOR or only own expenses if ALUNO.',
  request: { query: ExpenseListQuerySchema },
  tags,
  responses: {
    [codes.OK]: jsonContent(ListExpenseResponseSchema, 'List of expense requests.'),
    ...registryResponses('UNAUTHORIZED', 'VALIDATION_ERROR'),
  },
})

export const create = createRoute({
  path: '/',
  method: 'post',
  middleware: [
    requireAuth,
    requireRole(ALLOWED_ROLES),
    validateJsonSchema('event', eventJSONSchema),
    validateJsonSchema('article', articleJSONSchema),
  ],
  security: [{ bearerAuth: [] }],
  summary: 'Create expense request',
  description: `
    Allows a PPGI student to request a new cost allowance.
    Restricted to users with role: ${ALLOWED_ROLES.join(', ')}.
  `,
  tags,
  request: { body: jsonContentRequired(CreateExpenseSchema, 'Request data') },
  responses: {
    [codes.CREATED]: jsonContent(
      CreateExpenseResponseSchema,
      'Request created successfully.',
    ),
    ...standardResponses,
    ...registryResponses('BAD_REQUEST'),
  },
})

export const read = createRoute({
  path: '/{id}',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Get expense by ID',
  description: 'Returns details of an expense request. Students can only access their own requests.',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.OK]: jsonContent(ExpenseResponseSchema, 'Expense request details.'),
    ...registryResponses('EXPENSE_NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN'),
  },
})

export const update = createRoute({
  path: '/{id}',
  method: 'patch',
  middleware: [
    requireAuth,
    requireRole(ALLOWED_ROLES),
    validateJsonSchema('event', eventJSONSchema),
    validateJsonSchema('article', articleJSONSchema),
  ],
  security: [{ bearerAuth: [] }],
  summary: 'Update expense',
  description: `
    Allows the student to update an expense request that is in 'EM_EDICAO' status.
    Upon saving, the status returns to 'APROVADO' and the correction reason is cleared.
  `,
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(UpdateExpenseSchema, 'Updated request data'),
  },
  responses: {
    [codes.OK]: jsonContent(ExpenseResponseSchema, 'Request updated successfully.'),
    ...standardResponses,
    ...registryResponses('EXPENSE_NOT_FOUND', 'BAD_REQUEST', 'INVALID_EXPENSE_STATE', 'FORBIDDEN'),
  },
})

const EVALUATOR_ROLES: UserRole[] = ['COORDENADOR', 'ADMIN']
export const updateStatus = createRoute({
  path: '/{id}/status',
  method: 'patch',
  middleware: [requireAuth, requireRole(EVALUATOR_ROLES)],
  security: [{ bearerAuth: [] }],
  summary: 'Update expense status',
  description: `
    Allows updating the status of an expense request.
    Flow: PENDENTE -> APROVADO/REJEITADO (Coordinator/Admin).
    Admin can transition APROVADO back to EM_EDICAO (returning it to the student).
  `,
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(UpdateExpenseStatusSchema, 'New request status'),
  },
  responses: {
    [codes.OK]: jsonContent(
      ExpenseResponseSchema,
      'Status updated successfully.',
    ),
    ...standardResponses,
    ...registryResponses('EXPENSE_NOT_FOUND', 'BAD_REQUEST', 'INVALID_EXPENSE_STATE', 'FORBIDDEN'),
  },
})

export const assignProject = createRoute({
  path: '/{id}/assign-project',
  method: 'patch',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  summary: 'Assign Project to Expense',
  description: `
    Links a project to an APPROVED request.
    The transition changes the status to 'EM_PROCESSAMENTO'.
    Restricted access to ADMIN.
  `,
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContent(
      z.object({ projectId: IdSchema }),
      'ID of the project to be linked',
    ),
  },
  responses: {
    [codes.OK]: jsonContent(
      AssignProjectResponseSchema,
      'Project linked and status changed to EM_PROCESSAMENTO.',
    ),
    ...standardResponses,
    ...registryResponses('EXPENSE_NOT_FOUND', 'PROJECT_NOT_FOUND', 'PROJECT_ARCHIVED', 'PROJECT_INSUFFICIENT_FUNDS', 'INVALID_EXPENSE_STATE', 'FORBIDDEN'),
  },
})

export const uploadMemorandum = createRoute({
  path: '/{id}/memorandum',
  method: 'post',
  middleware: [requireAuth, requireRole(ALLOWED_ROLES), uploadMemorandumSettings.size, uploadMemorandumSettings.content],
  security: [{ bearerAuth: [] }],
  summary: 'Upload memorandum (PDF)',
  description:
    'Student attaches a PDF to a **PENDENTE** request. Send `multipart/form-data` with **file** field.',
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: multipartFormContentRequired(UploadMemorandumSchema, 'Memorandum PDF file upload'),
  },
  responses: {
    [codes.OK]: jsonContent(
      ExpenseResponseSchema,
      'Memorandum attached; expense updated.',
    ),
    ...standardResponses,
    ...registryResponses('INVALID_FILE', 'FILE_TOO_LARGE', 'UNSUPPORTED_MEDIA_TYPE', 'INVALID_EXPENSE_STATE', 'EXPENSE_NOT_FOUND', 'STORAGE_UNAVAILABLE', 'FORBIDDEN'),
  },
})

export const getMemorandumDownload = createRoute({
  path: '/{id}/memorandum/download',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'Signed URL for memorandum download',
  description:
    'Student (own), coordinator, or admin obtains a temporary URL (1h) to download the PDF from R2.',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.OK]: jsonContent(
      z.object({
        downloadUrl: z.string().url(),
        expiresIn: z.number(),
      }),
      'URL generated.',
    ),
    ...registryResponses('BAD_REQUEST', 'FORBIDDEN', 'EXPENSE_NOT_FOUND', 'STORAGE_UNAVAILABLE', 'UNAUTHORIZED'),
  },
})

export const conclude = createRoute({
  path: '/{id}/conclude',
  method: 'post',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  summary: 'Conclude expense request',
  description: `
    Finalizes the expense request, formally sending the documents to the student.
    Requires the expense to be in 'EM_PROCESSAMENTO' status, have at least one cost breakdown, and ALL breakdowns must have receipts attached.
    Restricted access to ADMIN.
  `,
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.OK]: jsonContent(
      ExpenseResponseSchema,
      'Request concluded successfully.',
    ),
    ...registryResponses('PENDING_ISSUES', 'INVALID_EXPENSE_STATE', 'EXPENSE_NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN'),
  },
})
