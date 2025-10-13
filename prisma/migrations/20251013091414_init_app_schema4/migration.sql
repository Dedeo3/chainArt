/*
  Warnings:

  - Made the column `verified` on table `Karya` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Karya" ALTER COLUMN "verified" SET NOT NULL,
ALTER COLUMN "verified" SET DEFAULT false;
