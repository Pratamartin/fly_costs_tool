import { PrismaPg } from '@prisma/adapter-pg'
import env from '@/env'
import { PrismaClient } from '@/generated/prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  errorFormat: 'pretty',
})

export default prisma
