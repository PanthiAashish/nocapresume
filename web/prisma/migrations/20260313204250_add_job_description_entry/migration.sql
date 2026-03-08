-- CreateTable
CREATE TABLE "JobDescriptionEntry" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDescriptionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobDescriptionEntry_userEmail_createdAt_idx" ON "JobDescriptionEntry"("userEmail", "createdAt");
