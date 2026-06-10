import type { EmailJobData } from '@/jobs/send-email.job'
import crypto from 'node:crypto'
import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, afterEach, assert, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { jobManager } from '@/jobs'
import { createTestApp } from '@/lib/config'
import { dayjs } from '@/lib/date'
import prisma from '@/lib/orm'
import { auth } from '@/routes'
import seedUsers, { dummyUsers } from '@/seeds/user.seed'
import { expectProblem } from '../../util/assertions'

vi.mock('@/lib/email/providers', () => ({
  createEmailProvider: () => ({
    send: vi.fn().mockResolvedValue({
      success: true,
      previewUrl: 'http://preview.url',
    }),
  }),
}))

const client = testClient(createTestApp(auth))
const testUser = dummyUsers.find(u => u.role === 'ALUNO')
assert(testUser, 'Usuário de teste com papel ALUNO não encontrado nos dados de semente.')

describe('[Autenticação] Fluxo de Recuperação de Senha', () => {
  let userInDb: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>

  beforeAll(async () => {
    await seedUsers()
    const foundUser = await prisma.user.findUnique({ where: { email: testUser.email } })
    assert(foundUser, `Usuário semeado ${testUser.email} não encontrado no banco de dados.`)
    userInDb = foundUser

    await jobManager.start()
  })

  beforeEach(() => {
    vi.spyOn(jobManager, 'emit')
  })

  afterEach(async () => {
    jobManager.boss.clearSpies()
    vi.restoreAllMocks()

    // Garantir que o usuário volte a ficar ativo após cada teste
    await prisma.user.update({
      where: { id: userInDb.id },
      data: { isActive: true },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: dummyUsers.map(u => u.email) } } })
  })

  describe('pOST /auth/forgot-password', () => {
    it('[Passo 1] deve retornar 200 e disparar o job de e-mail se o usuário existir e estiver ativo', async () => {
      const spy = jobManager.boss.getSpy<EmailJobData>('send-email')

      const res = await client.auth['forgot-password'].$post({ json: { email: testUser.email } })

      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)

      const job = await spy.waitForJob(
        data => data.to === testUser.email && data.template?.type === 'password-recovery',
        'completed',
      )
      assert(job)
      expect(job.data.subject).toMatch(/^SGDA:/)

      const user = await prisma.user.findUnique({ where: { id: userInDb.id } })
      expect(user?.passwordResetToken).not.toBeNull()
      expect(user?.passwordResetExpiresAt).not.toBeNull()

      const expiresAt = user?.passwordResetExpiresAt ?? new Date(0)
      expect(dayjs(expiresAt).isAfter(dayjs())).toBe(true)
    })

    it('[Passo 2] deve retornar 200, mas NÃO disparar o job de e-mail se o usuário estiver inativo', async () => {
      await prisma.user.update({
        where: { id: userInDb.id },
        data: { isActive: false },
      })

      const res = await client.auth['forgot-password'].$post({ json: { email: testUser.email } })

      expect(res.status).toBe(status.OK)
      expect(jobManager.emit).not.toHaveBeenCalled()
    })

    it('[Passo 3] deve retornar 200, mas NÃO disparar o job de e-mail se o usuário não existir', async () => {
      const res = await client.auth['forgot-password'].$post({ json: { email: 'nonexistent@example.com' } })

      expect(res.status).toBe(status.OK)
      expect(jobManager.emit).not.toHaveBeenCalled()
    })
  })

  describe('pOST /auth/reset-password', () => {
    it('[Passo 4] deve redefinir a senha com um token válido e permitir o login', async () => {
      // Configuração: Gerar um token manualmente para teste
      const plainToken = 'valid-token-123'
      const hashedToken = crypto.createHash('sha256').update(plainToken)
        .digest('hex')
      const oneHourFromNow = dayjs().add(1, 'hour')
        .toDate()

      await prisma.user.update({
        where: { id: userInDb.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: oneHourFromNow,
        },
      })

      const newPassword = 'NewPassword123!'
      const res = await client.auth['reset-password'].$post({
        json: {
          token: plainToken,
          newPassword,
        },
      })

      expect(res.status).toBe(status.OK)
      assert(res.status === status.OK)

      const updatedUser = await prisma.user.findUnique({ where: { id: userInDb.id } })
      expect(updatedUser?.passwordResetToken).toBeNull()
      expect(updatedUser?.passwordResetExpiresAt).toBeNull()

      // Verificar que a senha foi alterada tentando fazer login
      const loginRes = await client.auth.login.$post({
        json: {
          email: testUser.email,
          password: newPassword,
        },
      })
      expect(loginRes.status).toBe(status.OK)
    })

    it('[Passo 5] deve retornar 400 para um token expirado', async () => {
      const plainToken = 'expired-token-123'
      const hashedToken = crypto.createHash('sha256').update(plainToken)
        .digest('hex')
      const oneHourAgo = dayjs().subtract(1, 'hour')
        .toDate()

      await prisma.user.update({
        where: { id: userInDb.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: oneHourAgo,
        },
      })

      const res = await client.auth['reset-password'].$post({
        json: {
          token: plainToken,
          newPassword: 'NewPassword123!',
        },
      })

      await expectProblem(res, 'INVALID_TOKEN')
    })

    it('[Passo 6] deve retornar 400 para um token inválido', async () => {
      const res = await client.auth['reset-password'].$post({
        json: {
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        },
      })

      await expectProblem(res, 'INVALID_TOKEN')
    })
  })
})
