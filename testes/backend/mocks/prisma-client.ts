/** Minimal Prisma.Decimal stand-in for unit tests (budget / cost-breakdown). */
export class PrismaDecimal {
  constructor(public readonly v: number) {}

  add(other: PrismaDecimal | number) {
    const n = typeof other === 'number' ? other : other.v
    return new PrismaDecimal(this.v + n)
  }

  minus(other: PrismaDecimal | number) {
    const n = typeof other === 'number' ? other : other.v
    return new PrismaDecimal(this.v - n)
  }

  plus(other: PrismaDecimal | number) {
    const n = typeof other === 'number' ? other : other.v
    return new PrismaDecimal(this.v + n)
  }

  /** Prisma compara com Decimal ou número; o stub aceita ambos. */
  lessThanOrEqualTo(other: number | PrismaDecimal) {
    const n = typeof other === 'number' ? other : other.v
    return this.v <= n
  }

  greaterThan(other: number | PrismaDecimal) {
    const n = typeof other === 'number' ? other : other.v
    return this.v > n
  }

  /** Retorna -1, 0 ou 1 (mesmo contrato do Decimal.js real). */
  comparedTo(other: PrismaDecimal | number) {
    const n = typeof other === 'number' ? other : other.v
    if (this.v < n) return -1
    if (this.v > n) return 1
    return 0
  }

  cmp(other: PrismaDecimal | number) {
    return this.comparedTo(other)
  }

  toNumber() {
    return this.v
  }

  toFixed(fractionDigits?: number) {
    return this.v.toFixed(fractionDigits ?? 2)
  }

  toString() {
    return String(this.v)
  }
}

export const Prisma = {
  Decimal: PrismaDecimal,
}

export const ExpenseRequestStatus = {
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  REJEITADO: 'REJEITADO',
  EM_EDICAO: 'EM_EDICAO',
  EM_PROCESSAMENTO: 'EM_PROCESSAMENTO',
  CONCLUIDO: 'CONCLUIDO',
}

export const UserRole = {
  ALUNO: 'ALUNO',
  COORDENADOR: 'COORDENADOR',
  ADMIN: 'ADMIN',
} as const

export class PrismaClient {}
