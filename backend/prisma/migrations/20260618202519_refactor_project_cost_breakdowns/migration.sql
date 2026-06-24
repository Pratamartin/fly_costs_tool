/*
  Warnings:

  - You are about to drop the column `projectId` on the `ExpenseRequest` table. All the data in the column will be lost.
  - Added the required column `projectId` to the `CostBreakdown` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ExpenseRequest" DROP CONSTRAINT "ExpenseRequest_projectId_fkey";

-- AlterTable
ALTER TABLE "CostBreakdown" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExpenseRequest" DROP COLUMN "projectId";

-- CreateIndex
CREATE INDEX "CostBreakdown_projectId_idx" ON "CostBreakdown"("projectId");

-- CreateIndex
CREATE INDEX "CostBreakdown_expenseRequestId_idx" ON "CostBreakdown"("expenseRequestId");

-- CreateIndex
CREATE INDEX "CostBreakdown_expenseCategoryId_idx" ON "CostBreakdown"("expenseCategoryId");

-- AddForeignKey
ALTER TABLE "CostBreakdown" ADD CONSTRAINT "CostBreakdown_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
