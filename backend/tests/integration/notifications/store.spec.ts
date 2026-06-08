import { testClient } from 'hono/testing'
import * as status from 'stoker/http-status-codes'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/config'
import prisma from '@/lib/orm'
import { notifications } from '@/routes'
import { seedUsers } from '@/seeds'
import { getAuthHeaders } from '../../util'
import { expectProblem } from '../../util/assertions'

const client = testClient(createTestApp(notifications))

describe('[Notifications API] - Gestão de Avisos', () => {
  let alunoHeaders: { Authorization: string }
  let alunoId: string
  let expenseId: string

  beforeAll(async () => {
    await seedUsers()
    const aluno = await prisma.user.findFirst({ where: { email: 'aluno@test.com' } })
    assert(aluno)
    alunoId = aluno.id
    alunoHeaders = await getAuthHeaders('aluno@test.com', 'ALUNO')

    // Criar uma despesa real para satisfazer a FK
    const expense = await prisma.expenseRequest.create({
      data: {
        title: 'Despesa para Notificações',
        studentId: alunoId,
        event: {
          name: 'Evento',
          location: 'Local',
        },
        article: { classification: 'A1' },
      },
    })
    expenseId = expense.id

    // Criar notificações vinculadas à despesa real
    await prisma.notification.createMany({
      data: [
        {
          userId: alunoId,
          expenseRequestId: expenseId,
        },
        {
          userId: alunoId,
          expenseRequestId: expenseId,
        },
      ],
    })
  })

  afterAll(async () => {
    await prisma.notification.deleteMany()
    await prisma.expenseRequest.deleteMany()
    await prisma.user.deleteMany()
  })

  it('[SUCESSO]: Deve listar notificações do aluno', async () => {
    const res = await client.notifications.$get({ query: {} }, { headers: alunoHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThanOrEqual(2)
  })

  it('[SUCESSO]: Deve marcar uma notificação como lida', async () => {
    const notif = await prisma.notification.findFirst({ where: { userId: alunoId } })
    assert(notif)

    const res = await client.notifications[':id'].read.$patch({ param: { id: notif.id } }, { headers: alunoHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const updated = await prisma.notification.findUnique({ where: { id: notif.id } })
    expect(updated?.isRead).toBe(true)
  })

  it('[ERRO]: Deve retornar 404 para notificação inexistente (NOTIFICATION_NOT_FOUND)', async () => {
    const res = await client.notifications[':id'].read.$patch({ param: { id: '00000000-0000-0000-0000-000000000000' } }, { headers: alunoHeaders })

    await expectProblem(res, 'NOTIFICATION_NOT_FOUND')
  })

  it('[SUCESSO]: Deve marcar todas como lidas', async () => {
    const res = await client.notifications['read-all'].$patch({}, { headers: alunoHeaders })
    expect(res.status).toBe(status.OK)
    assert(res.status === status.OK)

    const unread = await prisma.notification.count({
      where: {
        userId: alunoId,
        isRead: false,
      },
    })
    expect(unread).toBe(0)
  })
})
