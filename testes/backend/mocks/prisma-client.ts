/** Minimal Prisma.Decimal stand-in for unit tests (budget / cost-breakdown). */
export class PrismaDecimal {
  constructor(public readonly v: number) {}

  minus(other: PrismaDecimal) {
    return new PrismaDecimal(this.v - other.v)
  }

  plus(other: PrismaDecimal) {
    return new PrismaDecimal(this.v + other.v)
  }

  /** Prisma compara com Decimal ou número; o stub aceita ambos. */
  lessThanOrEqualTo(other: number | PrismaDecimal) {
    const n = typeof other === 'number' ? other : other.v
    return this.v <= n
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
  EM_PROCESSAMENTO: 'EM_PROCESSAMENTO',
}

export class PrismaClient {}
