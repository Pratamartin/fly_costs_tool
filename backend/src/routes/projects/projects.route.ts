import type { UserRole } from '@/generated/prisma/enums'
import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'
import { requireAuth, requireRole } from '@/middlewares'
import { CreateProjectSchema, ListProjectQuerySchema, ListProjectResponseSchema, ProjectResponseSchema, UpdateProjectSchema } from '@/schemas/project.schema'
import { ForbiddenResponse, IdSchema, UnauthorizedResponse } from '@/schemas/shared.schema'

const tags = ['Projects']
const ADMIN_ONLY: UserRole[] = ['ADMIN']

export type CreateRoute = typeof create
export type IndexRoute = typeof index
export type ReadRoute = typeof read
export type UpdateRoute = typeof update
export type RemoveRoute = typeof remove

export const index = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  request: { query: ListProjectQuerySchema },
  summary: 'List all projects',
  description: 'Retorna a lista completa de projetos cadastrados no sistema, incluindo orçamentos e metadados.',
  tags,
  responses: {
    [codes.OK]: jsonContent(ListProjectResponseSchema, 'Lista de projetos retornada com sucesso.'),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const create = createRoute({
  path: '/',
  method: 'post',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  summary: 'Create a new project',
  description: `
    Permite criar um novo projeto definindo um código único de identificação, orçamento total e categorias.
    A criação inicial define o orçamento utilizado como zero e o status como ativo por padrão.
  `,
  tags,
  request: { body: jsonContentRequired(CreateProjectSchema, 'Dados do projeto') },
  responses: {
    [codes.CREATED]: jsonContent(ProjectResponseSchema, 'Projeto criado com sucesso.'),
    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Subcategorias inválidas'),
      'Uma ou mais subcategorias enviadas não existem no banco de dados.',
    ),
    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('Código já utilizado'),
      'Já existe um projeto cadastrado com o código informado.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const read = createRoute({
  path: '/{id}',
  method: 'get',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  summary: 'Get project by ID',
  description: 'Busca os detalhes de um projeto específico, apresentando o balanço entre orçamento total, utilizado e disponível.',
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.OK]: jsonContent(ProjectResponseSchema, 'Detalhes do projeto localizados.'),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Projeto não encontrado'),
      'Nenhum projeto foi localizado com o ID informado no banco de dados.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const update = createRoute({
  path: '/{id}',
  method: 'patch',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  summary: 'Update project',
  description: `
    Permite atualizar informações cadastrais e financeiras do projeto. 
    Caso o código seja alterado, o sistema validará se o novo valor já não pertence a outro projeto existente.
  `,
  tags,
  request: {
    params: z.object({ id: IdSchema }),
    body: jsonContentRequired(UpdateProjectSchema, 'Dados para atualização'),
  },
  responses: {
    [codes.OK]: jsonContent(ProjectResponseSchema, 'Projeto atualizado com sucesso.'),
    [codes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema('Subcategorias inválidas'),
      'Uma ou mais subcategorias enviadas não existem no banco de dados.',
    ),
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Projeto não encontrado'),
      'Projeto inexistente ou não localizado para edição.',
    ),
    [codes.CONFLICT]: jsonContent(
      createMessageObjectSchema('Código já utilizado'),
      'A tentativa de alterar o código falhou pois o novo valor já está em uso por outro projeto.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})

export const remove = createRoute({
  path: '/{id}',
  method: 'delete',
  middleware: [requireAuth, requireRole(ADMIN_ONLY)],
  security: [{ bearerAuth: [] }],
  summary: 'Archive project (Soft Delete)',
  description: `
    Realiza o arquivamento lógico do projeto (isActive=false).
    O projeto deixará de aceitar novas despesas, mas seus dados históricos permanecem preservados para auditoria.
  `,
  tags,
  request: { params: z.object({ id: IdSchema }) },
  responses: {
    [codes.NO_CONTENT]: { description: 'Projeto arquivado com sucesso.' },
    [codes.NOT_FOUND]: jsonContent(
      createMessageObjectSchema('Projeto não encontrado'),
      'O projeto informado não existe ou já se encontra arquivado.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.FORBIDDEN]: ForbiddenResponse,
  },
})
