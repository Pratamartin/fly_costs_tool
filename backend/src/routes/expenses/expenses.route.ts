import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { MEMORANDUM_DOWNLOAD_URL_EXPIRY_SECONDS, MEMORANDUM_UPLOAD_MAX_SIZE_MB } from '@/constants/file.constant'
import { UserRole } from '@/generated/prisma/enums'
import { articleJSONSchema, eventJSONSchema } from '@/json'
import { registryResponses, standardResponses } from '@/lib/problems'
import { multipartFormContentRequired } from '@/lib/util'
import { requireAuth, requireRole, validateJsonSchema } from '@/middlewares'
import { uploadMemorandumSettings } from '@/middlewares/upload-settings'
import { AssignProjectResponseSchema, CreateExpenseResponseSchema, CreateExpenseSchema, ExpenseListQuerySchema, ExpenseResponseSchema, ListExpenseResponseSchema, UpdateExpenseSchema, UpdateExpenseStatusSchema, UploadMemorandumSchema } from '@/schemas/expense.schema'
import { DeleteExpenseResponseSchema, IdSchema } from '@/schemas/shared.schema'

const tags = ['Expenses']

export type CreateRoute = typeof create
export type IndexRoute = typeof index
export type ReadRoute = typeof read
export type UpdateRoute = typeof update
export type UpdateStatusRoute = typeof updateStatus
export type StartProcessingRoute = typeof startProcessing
export type UploadMemorandumRoute = typeof uploadMemorandum
export type GetMemorandumDownloadRoute = typeof getMemorandumDownload
export type ConcludeRoute = typeof conclude
export type RemoveRoute = typeof remove

const ALLOWED_ROLES: UserRole[] = ['ALUNO']

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  operationId: 'listExpenses',
  summary: 'List expenses',
  description: 'Visibility is role-scoped: `ALUNO` sees only own expenses (all statuses). `COORDENADOR` sees `PENDENTE`, `APROVADO`, `REJEITADO`. `ADMIN` sees `APROVADO`, `EM_EDICAO`, `EM_PROCESSAMENTO`, `CONCLUIDO`.',
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
  operationId: 'createExpense',
  summary: 'Create expense request',
  description: `Creates a new expense request in \`PENDENTE\` status. Event and article payloads are validated against JSON Schema (AJV) before Zod validation. Restricted to role: ${ALLOWED_ROLES.join(', ')}.`,
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
  operationId: 'getExpense',
  summary: 'Get expense by ID',
  description: 'Returns full expense details. Students can only access their own requests; other students\' expenses return `FORBIDDEN`.',
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
  operationId: 'updateExpense',
  summary: 'Update expense',
  description: 'Allows a student to update an expense in `EM_EDICAO` status (correction cycle). Upon saving, the status automatically transitions back to `APROVADO` and the `correctionReason` is cleared.',
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
  operationId: 'updateExpenseStatus',
  summary: 'Update expense status',
  description: 'State machine transitions. `COORDENADOR/ADMIN`: `PENDENTE` → `APROVADO | REJEITADO`. `ADMIN` only: `APROVADO` → `EM_EDICAO`. Requires a `reason` when transitioning to `REJEITADO` or `EM_EDICAO`. `REJEITADO` is a terminal state.',
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

export const startProcessing = createRoute({
  path: '/{id}/start-processing',
  method: 'patch',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  operationId: 'startExpenseProcessing',
  summary: 'Start financial processing',
  description: 'Transitions an `APROVADO` expense to `EM_PROCESSAMENTO`, unlocking cost breakdown allocation. `ADMIN` only.',
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContent(
      z.object({}),
      'Empty body required to initiate processing',
    ),
  },
  responses: {
    [codes.OK]: jsonContent(
      AssignProjectResponseSchema,
      'Status changed to EM_PROCESSAMENTO.',
    ),
    ...standardResponses,
    ...registryResponses('EXPENSE_NOT_FOUND', 'INVALID_EXPENSE_STATE', 'FORBIDDEN'),
  },
})

export const uploadMemorandum = createRoute({
  path: '/{id}/memorandum',
  method: 'post',
  middleware: [requireAuth, requireRole(ALLOWED_ROLES), uploadMemorandumSettings.size, uploadMemorandumSettings.content],
  security: [{ bearerAuth: [] }],
  operationId: 'uploadExpenseMemorandum',
  summary: 'Upload memorandum',
  description: `Student uploads a memorandum PDF. Format: \`application/pdf\`. Max size: **${MEMORANDUM_UPLOAD_MAX_SIZE_MB}MB**.`,
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
  operationId: 'getMemorandumDownloadUrl',
  summary: 'Get memorandum download URL',
  description: `Generates a signed R2 URL to download the memorandum PDF. Valid for **${MEMORANDUM_DOWNLOAD_URL_EXPIRY_SECONDS}s**. Accessible by: expense owner, \`COORDENADOR\`, or \`ADMIN\`.`,
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

export const remove = createRoute({
  path: '/{id}',
  method: 'delete',
  middleware: [requireAuth, requireRole([UserRole.ALUNO, UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  operationId: 'deleteExpense',
  summary: 'Delete expense request',
  description: 'Hard deletes the expense, all cost breakdowns, and all attached R2 files. Blocked for `CONCLUIDO` expenses (`INVALID_EXPENSE_STATE`). Deletion during `EM_PROCESSAMENTO` does NOT affect project budget.',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.OK]: jsonContent(DeleteExpenseResponseSchema, 'Expense deleted successfully.'),
    ...standardResponses,
    ...registryResponses('EXPENSE_NOT_FOUND', 'FORBIDDEN', 'STORAGE_UNAVAILABLE'),
  },
})

export const conclude = createRoute({
  path: '/{id}/conclude',
  method: 'post',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  operationId: 'concludeExpense',
  summary: 'Conclude expense request',
  description: 'Finalizes the expense to `CONCLUIDO`. **Preconditions:** status must be `EM_PROCESSAMENTO`, at least one cost breakdown exists (`MISSING_BREAKDOWNS`), ALL breakdowns must have receipts (`MISSING_RECEIPTS`). **Side effect:** debits project `usedBudget` by the sum of all breakdown amounts. `ADMIN` only.',
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
