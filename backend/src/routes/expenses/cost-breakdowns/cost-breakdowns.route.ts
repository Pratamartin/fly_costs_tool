import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { UserRole } from '@/generated/prisma/enums'
import { multipartFormContentRequired } from '@/lib/util'
import { requireAuth, requireRole } from '@/middlewares'
import { uploadReceiptSettings } from '@/middlewares/upload-settings'
import { CostBreakdownResponseSchema, CreateCostBreakdownSchema, ReceiptDownloadUrlSchema, UploadReceiptSchema } from '@/schemas/cost-breakdown.schema'
import { ForbiddenResponse, IdSchema, UnauthorizedResponse } from '@/schemas/shared.schema'

const tags = ['Cost Breakdowns']

export type CreateRoute = typeof create
export type UploadReceiptRoute = typeof uploadReceipt
export type RemoveReceiptRoute = typeof removeReceipt
export type GetReceiptDownloadRoute = typeof getReceiptDownload

export const create = createRoute({
  path: '/',
  method: 'post',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  summary: 'Add cost breakdown to expense',
  description: 'Adiciona uma discriminação de custo a uma solicitação de despesa. Restrito a ADMIN.',
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(CreateCostBreakdownSchema, 'Detalhes da discriminação de custo'),
  },
  responses: {
    [codes.CREATED]: jsonContent(
      CostBreakdownResponseSchema,
      'Discriminação salva com sucesso.',
    ),
    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Erro de validação'),
      'Erro de regra de negócio (ex: Budget insuficiente, Categoria inválida).',
    ),
    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('Operação inválida'),
      'O projeto está arquivado ou não pode receber discriminação de custo.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Despesa não encontrada'),
      'A despesa não existe ou não possui projeto vinculado.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const uploadReceipt = createRoute({
  path: '/{breakdownId}/receipt',
  method: 'post',
  middleware: [
    requireAuth,
    requireRole([UserRole.ADMIN]),
    uploadReceiptSettings.size,
    uploadReceiptSettings.content,
  ],
  security: [{ bearerAuth: [] }],
  summary: 'Upload receipt to cost breakdown',
  description: 'Faz upload de um arquivo de comprovante para uma discriminação de custo existente.',
  tags,
  request: {
    params: z.object({
      id: IdSchema,
      breakdownId: IdSchema,
    }),
    body: multipartFormContentRequired(UploadReceiptSchema, 'Arquivo de comprovante (PDF, Imagem)'),
  },
  responses: {
    [codes.OK]: jsonContent(
      CostBreakdownResponseSchema,
      'Comprovante anexado com sucesso.',
    ),
    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Erro na requisição'),
      'Arquivo inválido ou erro de processamento.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Não encontrado'),
      'Despesa ou Discriminação de custo não encontrados.',
    ),
    [codes.SERVICE_UNAVAILABLE]: jsonContent(
      createMessageObjectSchema('Armazenamento indisponível'),
      'Variáveis R2 não configuradas.',
    ),
    [codes.BAD_GATEWAY]: jsonContent(
      createMessageObjectSchema('Erro no provedor de armazenamento'),
      'Falha na comunicação com o Cloudflare R2.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const removeReceipt = createRoute({
  path: '/{breakdownId}/receipt',
  method: 'delete',
  middleware: [requireAuth, requireRole([UserRole.ADMIN])],
  security: [{ bearerAuth: [] }],
  summary: 'Delete receipt from cost breakdown',
  description: 'Remove o comprovante do banco de dados e do armazenamento R2. Restrito a ADMIN.',
  tags,
  request: {
    params: z.object({
      id: IdSchema,
      breakdownId: IdSchema,
    }),
  },
  responses: {
    [codes.NO_CONTENT]: { description: 'Comprovante removido com sucesso.' },
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Não encontrado'),
      'Comprovante não encontrado.',
    ),
    [codes.BAD_GATEWAY]: jsonContent(
      createMessageObjectSchema('Erro no provedor de armazenamento'),
      'Falha na comunicação com o Cloudflare R2.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const getReceiptDownload = createRoute({
  path: '/{breakdownId}/receipt/download',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'URL assinada para download do comprovante',
  description: 'Retorna uma URL pré-assinada válida por 15 min para baixar o comprovante de um cost breakdown. Acesso: ADMIN ou dono da despesa.',
  tags,
  request: {
    params: z.object({
      id: IdSchema,
      breakdownId: IdSchema,
    }),
  },
  responses: {
    [codes.OK]: jsonContent(
      ReceiptDownloadUrlSchema,
      'URL gerada com sucesso.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Não encontrado'),
      'Comprovante não encontrado ou despesa inexistente.',
    ),
    [codes.SERVICE_UNAVAILABLE]: jsonContent(
      createMessageObjectSchema('Armazenamento indisponível'),
      'Variáveis R2 não configuradas.',
    ),
    [codes.BAD_GATEWAY]: jsonContent(
      createMessageObjectSchema('Erro no provedor de armazenamento'),
      'Falha na comunicação com o Cloudflare R2.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})
