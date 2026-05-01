/*
  Warnings:

  - You are about to alter the column `budget` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "usedBudget" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "budget" SET DATA TYPE DECIMAL(10,2);
