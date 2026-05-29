/*
  Warnings:

  - Added the required column `article` to the `ExpenseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event` to the `ExpenseRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExpenseRequest" ADD COLUMN     "article" JSONB NOT NULL,
ADD COLUMN     "event" JSONB NOT NULL;
