import type { CreateRoute, IndexRoute, ReadRoute, RemoveRoute, UpdateRoute } from './projects.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import * as phrases from 'stoker/http-status-phrases'
import { PROJECT_ERROR_CODES } from '@/constants/project.constant'
import { ListProjectResponseSchema, ProjectResponseSchema } from '@/schemas/project.schema'
import { createProject, deleteProject, getAllProjects, getProjectById, updateProject } from '@/services/project.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const query = c.req.valid('query')
  const data = await getAllProjects(query)
  const parsed = ListProjectResponseSchema.parse(data)
  return c.json(parsed, codes.OK)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const data = c.req.valid('json')
  const result = await createProject(data)

  if (result && 'error' in result) {
    switch (result.error) {
      case phrases.CONFLICT:
        return c.json({ message: 'Código de projeto já existe' }, codes.CONFLICT)
      case PROJECT_ERROR_CODES.SUBCATEGORIES_NOT_FOUND:
        return c.json({ message: 'Uma ou mais subcategorias enviadas não existem' }, codes.BAD_REQUEST)
    }
  }

  const parsed = ProjectResponseSchema.parse(result)
  return c.json(parsed, codes.CREATED)
}

export const read: AppRouteHandler<ReadRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const data = await getProjectById(id)

  if (!data) {
    return c.json({ message: 'Projeto não encontrado' }, codes.NOT_FOUND)
  }

  const parsed = ProjectResponseSchema.parse(data)
  return c.json(parsed, codes.OK)
}

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  const result = await updateProject(id, data)

  if (result && 'error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Projeto não encontrado' }, codes.NOT_FOUND)
      case phrases.CONFLICT:
        return c.json({ message: 'Não foi possível trocar o código do projeto' }, codes.CONFLICT)
      case PROJECT_ERROR_CODES.PROJECT_ARCHIVED:
        return c.json({ message: 'Este projeto está arquivado e não pode ser editado' }, codes.CONFLICT)
      case PROJECT_ERROR_CODES.SUBCATEGORIES_NOT_FOUND:
        return c.json({ message: 'Uma ou mais subcategorias enviadas não existem' }, codes.BAD_REQUEST)
    }
  }

  const parsed = ProjectResponseSchema.parse(result)
  return c.json(parsed, codes.OK)
}

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const result = await deleteProject(id)

  if (result && 'error' in result) {
    switch (result.error) {
      case phrases.NOT_FOUND:
        return c.json({ message: 'Projeto não encontrado' }, codes.NOT_FOUND)
    }
  }

  return c.body(null, codes.NO_CONTENT)
}
