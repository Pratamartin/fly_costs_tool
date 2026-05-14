import type { AssignProjectRoute, ConcludeRoute, CreateRoute, GetMemorandumDownloadRoute, IndexRoute, ReadRoute, UpdateRoute, UpdateStatusRoute, UploadMemorandumRoute } from './expenses.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import * as phrases from 'stoker/http-status-phrases'
import { EXPENSE_ERROR_CODES } from '@/constants/expense.constant'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { AssignProjectResponseSchema, CreateExpenseResponseSchema, ExpenseResponseSchema, ListExpenseResponseSchema } from '@/schemas/expense.schema'
import { assignProjectToExpense, attachMemorandumToExpense, concludeExpenseRequest, createExpenseRequest, getAllExpenseRequests, getExpenseById, getMemorandumDownloadUrl, updateExpense, updateExpenseStatus } from '@/services/expense.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const query = c.req.valid('query')

  const data = await getAllExpenseRequests(sub, role, query)

  const parsed = ListExpenseResponseSchema.parse(data)

  return c.json(parsed, codes.OK)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid('json')

  const { sub } = c.get('jwtPayload')

  const result = await createExpenseRequest(sub, data)

  const parsed = CreateExpenseResponseSchema.parse(result)

  return c.json(parsed, codes.CREATED)
}

export const read: AppRouteHandler<ReadRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const { id } = c.req.valid('param')

  const data = await getExpenseById(id, sub, role)

  if (!data) {
    return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)
  }

  const payload = {
    ...data,
    costBreakdowns: data.costBreakdowns?.map(cb => ({
      ...cb,
      subcategory: cb.expenseCategory,
    })),
  }

  const parsed = ExpenseResponseSchema.parse(payload)
  return c.json(parsed, codes.OK)
}

export const updateStatus: AppRouteHandler<UpdateStatusRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { status, reason } = c.req.valid('json')
  const { role } = c.get('jwtPayload')

  const result = await updateExpenseStatus(id, status, role, reason)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)

      case phrases.CONFLICT:
        return c.json({ message: 'Transição de status inválida ou dados ausentes' }, codes.CONFLICT)

      case phrases.FORBIDDEN:
        return c.json({ message: 'Ação não permitida para o seu perfil' }, codes.FORBIDDEN)

      case EXPENSE_ERROR_CODES.REASON_REQUIRED:
        return c.json({ message: 'O motivo é obrigatório para este status' }, codes.BAD_REQUEST)

      default:
        return c.json({ message: result.error }, codes.BAD_REQUEST)
    }
  }

  const payload = {
    ...result,
    costBreakdowns: result.costBreakdowns?.map(cb => ({
      ...cb,
      subcategory: cb.expenseCategory,
    })),
  }

  const parsed = ExpenseResponseSchema.parse(payload)
  return c.json(parsed, codes.OK)
}

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const { sub } = c.get('jwtPayload')

  const result = await updateExpense(id, sub, data)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)

      case phrases.FORBIDDEN:
        return c.json({ message: 'Sem permissão para editar esta despesa' }, codes.FORBIDDEN)

      case phrases.CONFLICT:
        return c.json({ message: 'Apenas despesas em estado de edição podem ser alteradas' }, codes.CONFLICT)

      case EXPENSE_ERROR_CODES.RETURN_BEFORE_DEPARTURE:
        return c.json({ message: 'A data de retorno não pode ser anterior à de partida' }, codes.BAD_REQUEST)

      default:
        return c.json({ message: result.error }, codes.BAD_REQUEST)
    }
  }

  const payload = {
    ...result,
    costBreakdowns: result.costBreakdowns?.map(cb => ({
      ...cb,
      subcategory: cb.expenseCategory,
    })),
  }

  const parsed = ExpenseResponseSchema.parse(payload)
  return c.json(parsed, codes.OK)
}

export const assignProject: AppRouteHandler<AssignProjectRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { projectId } = c.req.valid('json')

  const result = await assignProjectToExpense(id, projectId)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json(
          { message: 'Solicitação ou Projeto não encontrados.' },
          codes.NOT_FOUND,
        )

      case phrases.CONFLICT:
        return c.json(
          { message: 'A solicitação não está com status APROVADO' },
          codes.CONFLICT,
        )

      case PROJECT_ERROR_CODES.INSUFFICIENT_FUNDS:
        return c.json(
          { message: 'Projeto não possui budget suficiente.' },
          codes.CONFLICT,
        )

      case PROJECT_ERROR_CODES.PROJECT_ARCHIVED:
        return c.json(
          { message: 'Este projeto está arquivado e não pode ser vinculado.' },
          codes.CONFLICT,
        )
    }
  }
  const parsed = AssignProjectResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}

export const uploadMemorandum: AppRouteHandler<UploadMemorandumRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { sub } = c.get('jwtPayload')
  const form = c.req.valid('form')

  const result = await attachMemorandumToExpense(id, sub, form.file)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)
      case phrases.FORBIDDEN:
        return c.json({ message: 'Sem permissão para anexar nesta solicitação' }, codes.FORBIDDEN)
      case phrases.CONFLICT:
        return c.json({ message: 'Só é possível anexar memorando em solicitações pendentes' }, codes.CONFLICT)
      case EXPENSE_ERROR_CODES.STORAGE_NOT_CONFIGURED:
        return c.json({ message: 'Armazenamento de arquivos não configurado' }, codes.SERVICE_UNAVAILABLE)
      default:
        return c.json({ message: result.error }, codes.BAD_REQUEST)
    }
  }

  const parsed = ExpenseResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}

export const getMemorandumDownload: AppRouteHandler<GetMemorandumDownloadRoute> = async (c) => {
  const { sub, role } = c.get('jwtPayload')
  const { id } = c.req.valid('param')

  const result = await getMemorandumDownloadUrl(id, sub, role)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)
      case phrases.FORBIDDEN:
        return c.json({ message: 'Sem permissão para acessar este memorando' }, codes.FORBIDDEN)
      case EXPENSE_ERROR_CODES.MEMORANDUM_MISSING:
        return c.json({ message: 'Esta solicitação não possui memorando anexado' }, codes.BAD_REQUEST)
      case EXPENSE_ERROR_CODES.STORAGE_NOT_CONFIGURED:
        return c.json({ message: 'Armazenamento de arquivos não configurado' }, codes.SERVICE_UNAVAILABLE)
      default:
        return c.json({ message: result.error }, codes.BAD_REQUEST)
    }
  }

  return c.json({
    downloadUrl: result.url,
    expiresIn: result.expiresIn,
  }, codes.OK)
}

export const conclude: AppRouteHandler<ConcludeRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const { role } = c.get('jwtPayload')

  const result = await concludeExpenseRequest(id, role)

  if ('error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Despesa não encontrada' }, codes.NOT_FOUND)
      case phrases.CONFLICT:
        return c.json({ message: 'A solicitação não está no estado adequado para ser concluída' }, codes.CONFLICT)
      case EXPENSE_ERROR_CODES.MISSING_BREAKDOWNS:
        return c.json({ message: 'A solicitação não possui custos registrados' }, codes.BAD_REQUEST)
      case EXPENSE_ERROR_CODES.MISSING_RECEIPTS:
        return c.json({ message: 'Existem custos sem comprovantes anexados' }, codes.BAD_REQUEST)
      default:
        return c.json({ message: result.error }, codes.BAD_REQUEST)
    }
  }

  const payload = {
    ...result,
    costBreakdowns: result.costBreakdowns?.map(cb => ({
      ...cb,
      subcategory: cb.expenseCategory,
    })),
  }

  const parsed = ExpenseResponseSchema.parse(payload)
  return c.json(parsed, codes.OK)
}
