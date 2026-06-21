/**
 * DEV ONLY — bypass R2 receipt requirement to conclude an expense locally.
 *
 * Usage:
 *   npm run dev:bypass-conclude -- <expense-id-or-req-prefix>
 *
 * Example:
 *   npm run dev:bypass-conclude -- d290f1ee
 *   npm run dev:bypass-conclude -- d290f1ee-6c54-4b01-90e6-d701748f0851
 *
 * What it does:
 *   Sets attachmentKey = "local-bypass" on every CostBreakdown that has
 *   no receipt attached, satisfying the concludeExpenseRequest validation
 *   without needing a real R2 bucket configured.
 */

import prisma from '@/lib/orm'
import 'dotenv/config'

const arg = process.argv[2]

if (!arg) {
  console.error('Uso: npm run dev:bypass-conclude -- <expense-id-ou-req-prefix>')
  console.error('Exemplo: npm run dev:bypass-conclude -- d290f1ee')
  process.exit(1)
}

async function main() {
  const expense = await prisma.expenseRequest.findFirst({
    where: { id: { startsWith: arg.toLowerCase() } },
    include: {
      costBreakdowns: {
        select: {
          id: true,
          attachmentKey: true,
          amount: true,
        },
      },
    },
  })

  if (!expense) {
    console.error(`Despesa não encontrada para o prefixo "${arg}".`)
    process.exit(1)
  }

  console.warn(`Despesa : ${expense.id}`)
  console.warn(`Status  : ${expense.status}`)
  console.warn(`Breakdowns: ${expense.costBreakdowns.length}`)
  for (const cb of expense.costBreakdowns) {
    const tag = cb.attachmentKey ? '✓ já tem receipt' : '✗ sem receipt'
    console.warn(`  - R$${cb.amount}  [${tag}]  id: ${cb.id}`)
  }

  if (expense.costBreakdowns.length === 0) {
    console.error('\nNenhum cost breakdown encontrado. Adicione pelo menos um antes de concluir.')
    process.exit(1)
  }

  const updated = await prisma.costBreakdown.updateMany({
    where: {
      expenseRequestId: expense.id,
      attachmentKey: null,
    },
    data: { attachmentKey: 'local-bypass' },
  })

  if (updated.count === 0) {
    console.warn('\nTodos os breakdowns já possuem attachmentKey. Pode concluir no admin.')
  }
  else {
    console.warn(`\n✓ ${updated.count} breakdown(s) atualizados com attachmentKey = "local-bypass"`)
    console.warn('Agora clique em Concluir no admin.')
  }
}

main().finally(() => prisma.$disconnect())
