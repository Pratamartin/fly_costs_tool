import stream from 'node:stream'
import * as MaskData from 'maskdata'
import pino from 'pino'
import { describe, expect, it } from 'vitest'

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

const redactConfig: pino.redactOptions = {
  paths: [
    'password',
    '*.password',
    '*.*.password',
    'email',
    '*.email',
    '*.*.email',
    'inviteCode',
    '*.inviteCode',
    '*.*.inviteCode',
    'token',
    '*.token',
  ],
  censor: (value: unknown, path: string[]) => {
    if (typeof value !== 'string')
      return '[REDACTED]'

    const pathStr = path.map(p => String(p)).join('.')
      .toLowerCase()

    if (pathStr.includes('email') || (value.includes('@') && value.includes('.'))) {
      return MaskData.maskEmail2(value, emailMaskOptions)
    }
    if (pathStr.includes('password')) {
      return MaskData.maskPassword(value, passwordMaskOptions)
    }
    if (value.length > 10) {
      return `${value.slice(0, 3)}***${value.slice(-3)}`
    }
    return '***'
  },
}

describe('logger Redaction TDD (Native JIT)', () => {
  it('should redact sensitive information recursively up to mapped levels', () => {
    let loggedData = ''
    const writable = new stream.Writable({
      write(chunk, _encoding, callback) {
        loggedData += chunk.toString()
        callback()
      },
    })

    const testLogger = pino({
      level: 'info',
      redact: redactConfig,
    }, writable)

    const sensitiveInfo = {
      email: 'user@example.com',
      password: 'SecretPassword123!',
      inviteCode: 'CONVITE_SEC_2026',
      user: {
        email: 'nested@example.com',
        nested: { inviteCode: 'LEVEL2_CODE_2026' },
      },
    }

    testLogger.info(sensitiveInfo, 'Testing native redaction')

    if (!loggedData)
      throw new Error('No data logged')
    const logJson = JSON.parse(loggedData)

    // Validação Nível 0
    expect(logJson.email).not.toBe(sensitiveInfo.email)
    expect(logJson.email).toContain('*')
    expect(logJson.password).toBe('********')
    expect(logJson.inviteCode).toBe('CON***026')

    // Validação Nível 1
    expect(logJson.user.email).not.toBe(sensitiveInfo.user.email)
    expect(logJson.user.email).toContain('*')

    // Validação Nível 2
    expect(logJson.user.nested.inviteCode).toBe('LEV***026')
  })
})
