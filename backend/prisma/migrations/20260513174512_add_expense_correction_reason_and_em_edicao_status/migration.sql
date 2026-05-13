-- AlterEnum
ALTER TYPE "ExpenseRequestStatus" ADD VALUE 'EM_EDICAO';

-- AlterTable
ALTER TABLE "ExpenseRequest" ADD COLUMN     "correctionReason" TEXT;
