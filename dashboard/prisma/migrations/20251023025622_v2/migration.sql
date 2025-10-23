/*
  Warnings:

  - You are about to drop the column `schemaVersion` on the `setup_status` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "setup_status" DROP COLUMN "schemaVersion";
