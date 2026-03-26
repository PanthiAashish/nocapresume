-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseResume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "extractedText" TEXT,
    "textExtractionError" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaseResume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "BaseResume_userId_createdAt_idx" ON "BaseResume"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BaseResume_userId_isPrimary_idx" ON "BaseResume"("userId", "isPrimary");

-- AddForeignKey
ALTER TABLE "BaseResume" ADD CONSTRAINT "BaseResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
