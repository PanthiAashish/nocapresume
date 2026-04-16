/*
  Warnings:

  - You are about to drop the `TailoredResumeReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TailoredResumeReport" DROP CONSTRAINT "TailoredResumeReport_jobDescriptionEntryId_fkey";

-- DropTable
DROP TABLE "TailoredResumeReport";
