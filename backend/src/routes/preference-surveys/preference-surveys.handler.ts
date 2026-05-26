import type { DownloadRoute, ListActiveRoute, UploadRoute } from './preference-surveys.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import { PREFERENCE_SURVEY_DOWNLOAD_EXPIRY_SECONDS } from '@/constants/preference-survey.constant'
import { getSignedDownloadUrl, isStorageConfigured, uploadFile } from '@/lib/storage'
import * as preferenceSurveyService from '@/services/preference-survey.service'

export const listActive: AppRouteHandler<ListActiveRoute> = async (c) => {
  const surveys = await preferenceSurveyService.getActiveSurveys()
  return c.json(surveys, codes.OK)
}

export const upload: AppRouteHandler<UploadRoute> = async (c) => {
  if (!isStorageConfigured()) {
    return c.json({ message: 'Variáveis R2 não configuradas.' }, codes.BAD_GATEWAY)
  }

  const { file } = c.req.valid('form')

  try {
    const { sub } = c.get('jwtPayload')
    const result = await uploadFile({
      file,
      contentType: file.type,
      folder: 'formulario-preferencias',
      subfolder: sub,
    })

    return c.json({
      fileKey: result.fileKey,
      fileName: result.fileName,
    }, codes.OK)
  }
  catch {
    return c.json({ message: 'Erro ao fazer upload para o R2.' }, codes.BAD_GATEWAY)
  }
}

export const download: AppRouteHandler<DownloadRoute> = async (c) => {
  if (!isStorageConfigured()) {
    return c.json({ message: 'Variáveis R2 não configuradas.' }, codes.SERVICE_UNAVAILABLE)
  }

  const { fileKey } = c.req.valid('query')

  // Segurança básica: Garantir que a chave pertence à pasta de pesquisas
  if (!fileKey.startsWith('formulario-preferencias/')) {
    return c.json({ message: 'Acesso negado: Chave de arquivo inválida.' }, codes.BAD_REQUEST)
  }

  try {
    const expiresIn = PREFERENCE_SURVEY_DOWNLOAD_EXPIRY_SECONDS
    const downloadUrl = await getSignedDownloadUrl(fileKey, expiresIn)

    return c.json({
      downloadUrl,
      expiresIn,
    }, codes.OK)
  }
  catch {
    return c.json({ message: 'Erro ao gerar URL de download.' }, codes.SERVICE_UNAVAILABLE)
  }
}
