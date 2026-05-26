import { logger } from './lib/logger'
import prisma from './lib/orm'
import { seedExpenseCategories, seedExpenses, seedInviteCodes, seedPreferenceSurveys, seedProjects, seedUsers } from './seeds'

async function main() {
  await seedExpenseCategories()
  await seedPreferenceSurveys()
  await seedInviteCodes()
  await seedProjects()
  await seedUsers()
  await seedExpenses()
}

main()
  .catch((e) => {
    logger.error(e, '❌ Erro crítico durante o seed')
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
