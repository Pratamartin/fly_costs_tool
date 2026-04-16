import { UserRole } from '@/generated/prisma/client'
import prisma from '@/lib/orm'

async function seedUsers() {
  // eslint-disable-next-line no-console
  console.log('⏳ Seeding Users...')

  // Uma senha padrão "123456" já com hash (bcrypt) para facilitar login local
  const defaultHash = '$2b$10$Ep...dummyhash.../w1u'

  await prisma.user.upsert({
    where: { email: 'coordenador@icomp.ufam.edu.br' },
    update: {},
    create: {
      name: 'Coordenador Acadêmico',
      email: 'coordenador@icomp.ufam.edu.br',
      passwordHash: defaultHash,
      role: UserRole.ADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: 'aluno@icomp.ufam.edu.br' },
    update: {},
    create: {
      name: 'Codibentinho',
      email: 'aluno@icomp.ufam.edu.br',
      passwordHash: defaultHash,
      role: UserRole.ALUNO,
    },
  })
}

export default seedUsers
