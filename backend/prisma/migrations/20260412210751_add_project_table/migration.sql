-- CreateEnum
CREATE TYPE "ExpenseTopic" AS ENUM ('INSCRICAO', 'PASSAGEM', 'HOSPEDAGEM');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "budget" DECIMAL(65,30) NOT NULL,
    "expenseTopics" "ExpenseTopic"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");
