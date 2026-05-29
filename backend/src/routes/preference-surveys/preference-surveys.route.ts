import { createRoute, z } from '@hono/zod-openapi'
import * as codes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { requireAuth } from '@/middlewares'
import { uploadSurveySettings } from '@/middlewares/upload-settings'
import { ListPreferenceSurveyResponseSchema } from '@/schemas/preference-survey.schema'
import { UnauthorizedResponse } from '@/schemas/shared.schema'

const tags = ['Preference Surveys']

export const listActive = createRoute({
  path: '/',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'List active preference surveys',
  description: 'Retorna todos os schemas de pesquisa de preferência ativos vinculados às categorias de despesa.',
  tags,
  responses: {
    [codes.OK]: jsonContent(ListPreferenceSurveyResponseSchema, 'Lista de pesquisas de preferência.'),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
  },
})

export const upload = createRoute({
  path: '/upload',
  method: 'post',
  middleware: [
    requireAuth,
    uploadSurveySettings.size,
    uploadSurveySettings.content,
  ] as const,
  security: [{ bearerAuth: [] }],
  summary: 'Upload a file for a preference survey',
  description: 'Faz o upload de um arquivo para o armazenamento R2 e retorna a chave do arquivo para ser usada na resposta do formulário.',
  tags,
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.instanceof(File).openapi({
              type: 'string',
              format: 'binary',
              description: 'Arquivo a ser enviado (PDF, JPEG, PNG). Máx 10MB.',
            }),
          }),
        },
      },
    },
  },
  responses: {
    [codes.OK]: jsonContent(
      z.object({
        fileKey: z.string().openapi({ description: 'Chave do arquivo no R2' }),
        fileName: z.string().openapi({ description: 'Nome original do arquivo' }),
      }),
      'Arquivo enviado com sucesso.',
    ),
    [codes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      'Arquivo inválido ou erro no upload.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.BAD_GATEWAY]: jsonContent(
      z.object({ message: z.string() }),
      'Falha na comunicação com o Cloudflare R2.',
    ),
  },
})

export const download = createRoute({
  path: '/download',
  method: 'get',
  middleware: [requireAuth],
  security: [{ bearerAuth: [] }],
  summary: 'URL assinada para download de anexo da pesquisa',
  description: 'Gera uma URL temporária para baixar um arquivo enviado via pesquisa de preferência.',
  tags,
  request: { query: z.object({ fileKey: z.string().openapi({ description: 'Chave do arquivo no R2' }) }) },
  responses: {
    [codes.OK]: jsonContent(
      z.object({
        downloadUrl: z.string().url(),
        expiresIn: z.number(),
      }),
      'URL gerada com sucesso.',
    ),
    [codes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      'Chave de arquivo inválida.',
    ),
    [codes.UNAUTHORIZED]: UnauthorizedResponse,
    [codes.SERVICE_UNAVAILABLE]: jsonContent(
      z.object({ message: z.string() }),
      'Armazenamento R2 não configurado.',
    ),
  },
})

export type ListActiveRoute = typeof listActive
export type UploadRoute = typeof upload
export type DownloadRoute = typeof download
