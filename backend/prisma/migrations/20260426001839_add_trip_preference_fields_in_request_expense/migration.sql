/*
  Warnings:

  - Added the required column `city` to the `ExpenseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `ExpenseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureDate` to the `ExpenseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `returnDate` to the `ExpenseRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `ExpenseRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExpenseRequest" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" CHAR(2) NOT NULL,
ADD COLUMN     "departureDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "returnDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "state" VARCHAR(6) NOT NULL;
