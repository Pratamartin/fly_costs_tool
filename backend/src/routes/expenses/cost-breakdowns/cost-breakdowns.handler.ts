import type { CreateRoute, GetReceiptDownloadRoute, RemoveReceiptRoute, UploadReceiptRoute } from './cost-breakdowns.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import * as phrases from 'stoker/http-status-phrases'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { CostBreakdownResponseSchema, ReceiptDownloadUrlSchema } from '@/schemas/cost-breakdown.schema'
import { createCostBreakdown, deleteCostBreakdownReceipt, getCostBreakdownReceiptUrl, uploadCostBreakdownReceipt } from '@/services/budget.service'

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  const result = await createCostBreakdown(id, data)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Despesa ou Projeto não encontrados' }, codes.NOT_FOUND)
      case PROJECT_ERROR_CODES.PROJECT_ARCHIVED:
        return c.json({ message: 'Este projeto está arquivado e não pode receber discriminação de custo.' }, codes.CONFLICT)
      case PROJECT_ERROR_CODES.INSUFFICIENT_FUNDS:
        return c.json({ message: 'Projeto não possui budget suficiente.' }, codes.BAD_REQUEST)
      case PROJECT_ERROR_CODES.INVALID_SUBCATEGORIES_COUNT:
        return c.json({ message: 'Subcategoria inválida para este projeto.' }, codes.BAD_REQUEST)
      default:
        return c.json({ message: result.error }, codes.BAD_REQUEST)
    }
  }

  const parsed = CostBreakdownResponseSchema.parse({
    ...result,
    subcategory: result.expenseCategory,
  })
  return c.json(parsed, codes.CREATED)
}

export const uploadReceipt: AppRouteHandler<UploadReceiptRoute> = async (c) => {
  const { id, breakdownId } = c.req.valid('param')
  const { file } = c.req.valid('form')

  const result = await uploadCostBreakdownReceipt(id, breakdownId, file)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Despesa ou Discriminação não encontrada' }, codes.NOT_FOUND)
      case 'STORAGE_NOT_CONFIGURED':
        return c.json({ message: 'Armazenamento não configurado' }, codes.SERVICE_UNAVAILABLE)
      case phrases.BAD_GATEWAY:
        return c.json({ message: 'Falha na comunicação com o provedor de armazenamento' }, codes.BAD_GATEWAY)
      default:
        return c.json({ message: result.error }, codes.BAD_REQUEST)
    }
  }

  const parsed = CostBreakdownResponseSchema.parse({
    ...result,
    subcategory: result.expenseCategory,
  })
  return c.json(parsed, codes.OK)
}

export const removeReceipt: AppRouteHandler<RemoveReceiptRoute> = async (c) => {
  const { id, breakdownId } = c.req.valid('param')

  const result = await deleteCostBreakdownReceipt(id, breakdownId)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Comprovante não encontrado.' }, codes.NOT_FOUND)
      case phrases.BAD_GATEWAY:
        return c.json({ message: 'Falha ao remover arquivo do armazenamento (Cloudflare R2)' }, codes.BAD_GATEWAY)
      default:
        return c.json({ message: result.error }, codes.BAD_REQUEST)
    }
  }

  return c.body(null, codes.NO_CONTENT)
}

export const getReceiptDownload: AppRouteHandler<GetReceiptDownloadRoute> = async (c) => {
  const { id, breakdownId } = c.req.valid('param')
  const { sub, role } = c.get('jwtPayload')

  const result = await getCostBreakdownReceiptUrl(id, breakdownId, sub, role)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Comprovante não encontrado.' }, codes.NOT_FOUND)
      case 'STORAGE_NOT_CONFIGURED':
        return c.json({ message: 'Armazenamento não configurado.' }, codes.SERVICE_UNAVAILABLE)
      case phrases.BAD_GATEWAY:
        return c.json({ message: 'Falha na comunicação com o provedor de armazenamento.' }, codes.BAD_GATEWAY)
    }
  }

  const parsed = ReceiptDownloadUrlSchema.parse(result)

  return c.json(parsed, codes.OK)
}
