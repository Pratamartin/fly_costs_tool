import { bodyLimit } from 'hono/body-limit'
import { createMiddleware } from 'hono/factory'
import * as codes from 'stoker/http-status-codes'

export type UploadOptions = {
  maxFileSizeMB: number
  allowedMimeFileTypes: readonly string[]
  fieldName?: string
}

export default function uploadSettings(options: UploadOptions) {
  const fieldName = options.fieldName ?? 'files'

  const size = bodyLimit({
    maxSize: options.maxFileSizeMB * 1024 * 1024,
    onError: c => c.json({ message: `Tamanho total máximo excedido. O limite é de ${options.maxFileSizeMB}MB.` }, codes.REQUEST_TOO_LONG),
  })

  const content = createMiddleware(async (c, next) => {
    const body = await c.req.parseBody({ all: true })
    const data = body[fieldName]

    if (!data) {
      return c.json({ message: `O campo '${fieldName}' é obrigatório` }, codes.BAD_REQUEST)
    }

    const files = Array.isArray(data) ? data : [data]
    const allowed = options.allowedMimeFileTypes.join(', ')

    for (const file of files) {
      if (!(file instanceof File)) {
        return c.json({ message: `O campo '${fieldName}' deve conter apenas arquivos.` }, codes.BAD_REQUEST)
      }

      if (!options.allowedMimeFileTypes.includes(file.type)) {
        return c.json({ message: `Arquivo '${file.name}' não suportado. Permitidos: ${allowed}` }, codes.BAD_REQUEST)
      }
    }

    await next()
  })

  return {
    size,
    content,
  }
}

export const uploadMemorandumSettings = uploadSettings({
  maxFileSizeMB: 5,
  allowedMimeFileTypes: ['application/pdf'],
  fieldName: 'file',
})
