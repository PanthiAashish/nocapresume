-- CreateTable
CREATE TABLE "TailoredResumeReport" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "jobDescriptionEntryId" TEXT NOT NULL,
    "baseResumeId" TEXT,
    "originalResumeJson" JSONB NOT NULL,
    "tailoredResumeJson" JSONB NOT NULL,
    "enhancementReportJson" JSONB NOT NULL,
    "pdf" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TailoredResumeReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TailoredResumeReport_jobDescriptionEntryId_key" ON "TailoredResumeReport"("jobDescriptionEntryId");

-- CreateIndex
CREATE INDEX "TailoredResumeReport_userEmail_createdAt_idx" ON "TailoredResumeReport"("userEmail", "createdAt");

-- CreateIndex
CREATE INDEX "TailoredResumeReport_baseResumeId_idx" ON "TailoredResumeReport"("baseResumeId");

-- AddForeignKey
ALTER TABLE "TailoredResumeReport" ADD CONSTRAINT "TailoredResumeReport_jobDescriptionEntryId_fkey" FOREIGN KEY ("jobDescriptionEntryId") REFERENCES "JobDescriptionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
