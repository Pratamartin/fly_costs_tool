/*
  Warnings:

  - You are about to drop the column `amount` on the `ExpenseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `ExpenseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `expenseTopics` on the `Project` table. All the data in the column will be lost.
  - Made the column `code` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ExpenseRequest" DROP COLUMN "amount",
DROP COLUMN "topic";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "expenseTopics",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "ExpenseTopic";

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExpenseCategoryToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExpenseCategoryToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_normalizedName_key" ON "ExpenseCategory"("normalizedName");

-- CreateIndex
CREATE INDEX "_ExpenseCategoryToProject_B_index" ON "_ExpenseCategoryToProject"("B");

-- AddForeignKey
ALTER TABLE "_ExpenseCategoryToProject" ADD CONSTRAINT "_ExpenseCategoryToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "ExpenseCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExpenseCategoryToProject" ADD CONSTRAINT "_ExpenseCategoryToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
