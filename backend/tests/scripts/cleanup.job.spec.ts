import { afterEach, assert, describe, expect, it, vi } from 'vitest'
import env from '@/env'
import { CleanupJob } from '@/jobs/cleanup.job'
import { dayjs } from '@/lib/date'
import { boss } from '@/lib/jobs'
import prisma from '@/lib/orm'

describe('[Jobs] CleanupJob', () => {
  const job = new CleanupJob(boss)

  afterEach(async () => {
    // Deep cleanup to isolate tests
    await prisma.userSession.deleteMany()
    await prisma.inviteCode.deleteMany()
    await prisma.user.deleteMany()
    vi.useRealTimers()
  })

  it(`deve deletar sessões que passaram do período de retenção (${env.CLEANUP_SESSION_RETENTION_DAYS} dias)`, async () => {
    // 1. Setup: Criar usuário e uma sessão que expira "agora"
    const user = await prisma.user.create({
      data: {
        name: 'QA Test',
        email: 'qa@test.com',
        passwordHash: 'hash',
      },
    })

    await prisma.userSession.create({
      data: {
        jti: 'session-to-delete',
        userId: user.id,
        expiresAt: dayjs().toDate(),
      },
    })

    // 2. Ação: Avançar o tempo para 1 dia após o limite de retenção
    vi.useFakeTimers()
    vi.setSystemTime(dayjs().add(env.CLEANUP_SESSION_RETENTION_DAYS + 1, 'days')
      .toDate())

    await job.work()

    // 3. Asserção: A sessão deve ter sido removida
    const session = await prisma.userSession.findUnique({ where: { jti: 'session-to-delete' } })
    expect(session).toBeNull()
  })

  it(`deve manter convites pendentes por ${env.CLEANUP_INVITE_PENDING_RETENTION_DAYS} dias e deletar após esse prazo`, async () => {
    // 1. Setup: Criar convite pendente expirando agora
    await prisma.inviteCode.create({
      data: {
        code: 'PENDING_TOKEN',
        role: 'ALUNO',
        expiresAt: dayjs().toDate(),
      },
    })

    vi.useFakeTimers()

    // 2. Ação: Avançar 1 dia a menos que o tempo limite (ainda deve existir)
    vi.setSystemTime(dayjs().add(env.CLEANUP_INVITE_PENDING_RETENTION_DAYS - 1, 'days')
      .toDate())
    await job.work()
    let invite = await prisma.inviteCode.findUnique({ where: { code: 'PENDING_TOKEN' } })
    expect(invite).not.toBeNull()

    // 3. Ação: Avançar 1 dia a mais que o limite (deve ser deletado)
    vi.setSystemTime(dayjs().add(env.CLEANUP_INVITE_PENDING_RETENTION_DAYS + 1, 'days')
      .toDate())
    await job.work()
    invite = await prisma.inviteCode.findUnique({ where: { code: 'PENDING_TOKEN' } })
    expect(invite).toBeNull()
  })

  it('deve manter convites usados por 30 dias para auditoria', async () => {
    // 1. Setup: Criar convite usado hoje
    await prisma.inviteCode.create({
      data: {
        code: 'USED_TOKEN',
        role: 'ALUNO',
        expiresAt: dayjs().toDate(),
        usedAt: dayjs().toDate(),
        usedById: 'some-user-uuid',
      },
    })

    vi.useFakeTimers()

    // 2. Ação: Avançar 15 dias (pendentes já teriam sumido, mas usados devem ficar)
    vi.setSystemTime(dayjs().add(15, 'days')
      .toDate())
    await job.work()
    const invite = await prisma.inviteCode.findUnique({ where: { code: 'USED_TOKEN' } })
    expect(invite).not.toBeNull()
  })

  it('deve limpar campos de reset de senha assim que expirarem', async () => {
    // 1. Setup: Usuário com token de reset vencendo agora
    await prisma.user.create({
      data: {
        name: 'Reset Test',
        email: 'reset@test.com',
        passwordHash: 'hash',
        passwordResetToken: 'secret-token',
        passwordResetExpiresAt: dayjs().toDate(),
      },
    })

    // 2. Ação: Avançar 1 minuto
    vi.useFakeTimers()
    vi.setSystemTime(dayjs().add(1, 'minute')
      .toDate())
    await job.work()

    // 3. Asserção: Campos devem estar nulos, mas o usuário continua existindo
    const user = await prisma.user.findUnique({ where: { email: 'reset@test.com' } })
    expect(user).not.toBeNull()
    assert(user)
    expect(user.passwordResetToken).toBeNull()
    expect(user.passwordResetExpiresAt).toBeNull()
  })
})
