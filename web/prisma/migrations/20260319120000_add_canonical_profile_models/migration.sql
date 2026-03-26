-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "linkedinUrl" TEXT NOT NULL DEFAULT '',
    "githubUrl" TEXT NOT NULL DEFAULT '',
    "skillLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillFrameworks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillCloud" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillDatabases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillOther" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileEducation" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "school" TEXT NOT NULL DEFAULT '',
    "college" TEXT NOT NULL DEFAULT '',
    "degree" TEXT NOT NULL DEFAULT '',
    "fieldOfStudy" TEXT NOT NULL DEFAULT '',
    "minor" TEXT NOT NULL DEFAULT '',
    "schoolYear" TEXT NOT NULL DEFAULT '',
    "startMonth" TEXT NOT NULL DEFAULT '',
    "startYear" TEXT NOT NULL DEFAULT '',
    "endMonth" TEXT NOT NULL DEFAULT '',
    "endYear" TEXT NOT NULL DEFAULT '',
    "currentlyAttending" BOOLEAN NOT NULL DEFAULT false,
    "gpa" TEXT NOT NULL DEFAULT '',
    "departmentGpa" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ProfileEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileExperience" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "employmentType" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "startMonth" TEXT NOT NULL DEFAULT '',
    "startYear" TEXT NOT NULL DEFAULT '',
    "endMonth" TEXT NOT NULL DEFAULT '',
    "endYear" TEXT NOT NULL DEFAULT '',
    "currentlyWorking" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "bullets" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ProfileExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileProject" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "startMonth" TEXT NOT NULL DEFAULT '',
    "startYear" TEXT NOT NULL DEFAULT '',
    "endMonth" TEXT NOT NULL DEFAULT '',
    "endYear" TEXT NOT NULL DEFAULT '',
    "currentlyWorking" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "bullets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "githubUrl" TEXT NOT NULL DEFAULT '',
    "liveUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ProfileProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileExtracurricular" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "organization" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "startMonth" TEXT NOT NULL DEFAULT '',
    "startYear" TEXT NOT NULL DEFAULT '',
    "endMonth" TEXT NOT NULL DEFAULT '',
    "endYear" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "bullets" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ProfileExtracurricular_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "ProfileEducation_profileId_sortOrder_idx" ON "ProfileEducation"("profileId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProfileExperience_profileId_sortOrder_idx" ON "ProfileExperience"("profileId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProfileProject_profileId_sortOrder_idx" ON "ProfileProject"("profileId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProfileExtracurricular_profileId_sortOrder_idx" ON "ProfileExtracurricular"("profileId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileEducation" ADD CONSTRAINT "ProfileEducation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileExperience" ADD CONSTRAINT "ProfileExperience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileProject" ADD CONSTRAINT "ProfileProject_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileExtracurricular" ADD CONSTRAINT "ProfileExtracurricular_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
