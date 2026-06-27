/**
 * DEV ONLY — bypass R2 memo (memorando) upload for a student expense request.
 *
 * Usage:
 *   npm run dev:bypass-memo                          # creates a new request and bypasses memo
 *   npm run dev:bypass-memo -- <expense-id-prefix>   # bypasses memo on an existing PENDENTE request
 *
 * Examples:
 *   npm run dev:bypass-memo
 *   npm run dev:bypass-memo -- 9e730bb7
 *
 * What it does:
 *   • Without an ID: creates a new PENDENTE expense request for the seed student
 *     (aluno@test.com) and sets attachmentKey = "local-bypass" directly, skipping
 *     the real R2 upload step.
 *   • With an ID prefix: finds the matching PENDENTE request and sets
 *     attachmentKey = "local-bypass" so the coordinator can approve it without
 *     a real R2 bucket configured.
 */

import { ID_ALUNO, ID_SURVEY_INSCRICAO } from '@/constants/seed.constant'
import { ExpenseRequestStatus } from '@/generated/prisma/enums'
import prisma from '@/lib/orm'
import 'dotenv/config'

const arg = process.argv[2]

async function createAndBypass() {
  const expense = await prisma.expenseRequest.create({
    data: {
      title: 'Bypass Script — Solicitação de Teste',
      description: 'Criada pelo script dev:bypass-memo para testes locais.',
      status: ExpenseRequestStatus.PENDENTE,
      attachmentKey: 'local-bypass',
      event: {
        name: 'Evento de Teste',
        location: 'Local/XX',
      },
      article: { classification: 'Sem Qualis' },
      student: { connect: { id: ID_ALUNO } },
      surveyAnswers: {
        create: [
          {
            survey: { connect: { id: ID_SURVEY_INSCRICAO } },
            data: { invoiceKey: 'local-bypass/nota-fiscal-teste.pdf' },
          },
        ],
      },
    },
    select: {
      id: true,
      status: true,
      attachmentKey: true,
      title: true,
    },
  })

  console.warn('\n✓ Solicitação criada com bypass de R2:')
  console.warn(`  ID     : ${expense.id}`)
  console.warn(`  Título : ${expense.title}`)
  console.warn(`  Status : ${expense.status}`)
  console.warn(`  Memo   : ${expense.attachmentKey}`)
  console.warn('\nAgora o coordenador pode aprovar esta solicitação.')
}

async function bypassExisting(prefix: string) {
  const expense = await prisma.expenseRequest.findFirst({
    where: { id: { startsWith: prefix.toLowerCase() } },
    select: {
      id: true,
      status: true,
      attachmentKey: true,
      title: true,
    },
  })

  if (!expense) {
    console.error(`Solicitação não encontrada para o prefixo "${prefix}".`)
    process.exit(1)
  }

  console.warn(`Solicitação : ${expense.id}`)
  console.warn(`Título      : ${expense.title}`)
  console.warn(`Status      : ${expense.status}`)
  console.warn(`Memo atual  : ${expense.attachmentKey ?? '(nenhum)'}`)

  if (expense.status !== ExpenseRequestStatus.PENDENTE) {
    console.error(`\nErro: status deve ser PENDENTE para anexar memorando (atual: ${expense.status}).`)
    process.exit(1)
  }

  if (expense.attachmentKey) {
    console.warn('\nSolicitação já possui memorando. Nenhuma alteração feita.')
    return
  }

  await prisma.expenseRequest.update({
    where: { id: expense.id },
    data: { attachmentKey: 'local-bypass' },
  })

  console.warn('\n✓ attachmentKey = "local-bypass" definido na solicitação.')
  console.warn('Agora o coordenador pode aprovar esta solicitação.')
}

async function main() {
  if (arg) {
    await bypassExisting(arg)
  }
  else {
    await createAndBypass()
  }
}

main().finally(() => prisma.$disconnect())
