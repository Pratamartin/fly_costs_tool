import prisma from './lib/orm'
import { seedExpenseCategories, seedExpenses, seedProjects, seedUsers } from './seeds'

async function main() {
  await seedExpenseCategories()
  await seedProjects()
  await seedUsers()
  await seedExpenses()
}

main()
  .catch((e) => {
    console.error('❌ Erro crítico durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
