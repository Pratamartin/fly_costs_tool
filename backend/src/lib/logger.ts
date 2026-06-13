import * as MaskData from 'maskdata'
import pino from 'pino'

// eslint-disable-next-line node/no-process-env
const isProduction = process.env.NODE_ENV === 'production'

const emailMaskOptions: MaskData.EmailMask2Options = {
  maskWith: '*',
  unmaskedStartCharactersBeforeAt: 3,
  unmaskedEndCharactersAfterAt: 3,
  maskAtTheRate: false,
}

const passwordMaskOptions: MaskData.PasswordMaskOptions = {
  maskWith: '*',
  fixedOutputLength: 8,
}

// Configuração de Redação Nativa (JIT)
const redactConfig: pino.redactOptions = {
  paths: [
    // Raiz
    'password',
    'newPassword',
    'inviteCode',
    'token',
    'accessToken',
    'refreshToken',
    'passwordResetToken',
    'email',
    'cpf',
    'cnpj',
    'authorization',
    'cookie',
    // Nível 1 (Cobre a maioria dos objetos de domínio como User, Project, etc)
    '*.password',
    '*.newPassword',
    '*.inviteCode',
    '*.token',
    '*.email',
    '*.cpf',
    '*.cnpj',
    // Nível 2 (Objetos aninhados comuns em transações)
    '*.*.password',
    '*.*.email',
    '*.*.inviteCode',
  ],
  censor: (value: unknown, path: string[]) => {
    if (typeof value !== 'string')
      return '[REDACTED]'

    const pathStr = path.map(p => String(p)).join('.')
      .toLowerCase()

    // Inteligência de máscara baseada no nome do campo ou conteúdo
    if (pathStr.includes('email') || (value.includes('@') && value.includes('.'))) {
      return MaskData.maskEmail2(value, emailMaskOptions)
    }

    if (pathStr.includes('password')) {
      return MaskData.maskPassword(value, passwordMaskOptions)
    }

    // Máscara genérica para tokens e códigos (preserva início/fim para debug)
    if (value.length > 10) {
      return `${value.slice(0, 3)}***${value.slice(-3)}`
    }

    return '***'
  },

}

/* eslint-disable node/no-process-env */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: redactConfig,
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
        },
      }
    : undefined,
})
