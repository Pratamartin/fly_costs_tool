/*
  Warnings:

  - You are about to drop the column `city` on the `ExpenseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `ExpenseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `departureDate` on the `ExpenseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `returnDate` on the `ExpenseRequest` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `ExpenseRequest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ExpenseRequest" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "departureDate",
DROP COLUMN "returnDate",
DROP COLUMN "state";

-- CreateTable
CREATE TABLE "PreferenceSurvey" (
    "id" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "ui" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expenseCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceSurveyAnswer" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expenseRequestId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceSurveyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceSurveyAnswer_expenseRequestId_surveyId_key" ON "PreferenceSurveyAnswer"("expenseRequestId", "surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- AddForeignKey
ALTER TABLE "PreferenceSurvey" ADD CONSTRAINT "PreferenceSurvey_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceSurveyAnswer" ADD CONSTRAINT "PreferenceSurveyAnswer_expenseRequestId_fkey" FOREIGN KEY ("expenseRequestId") REFERENCES "ExpenseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceSurveyAnswer" ADD CONSTRAINT "PreferenceSurveyAnswer_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "PreferenceSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
