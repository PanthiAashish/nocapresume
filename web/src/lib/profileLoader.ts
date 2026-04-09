import { prisma } from "@/lib/prisma"
import { profileDataFromRecord, type ProfileData } from "@/lib/profile"
import { fromPrismaProfileDraftJson } from "@/lib/profileDraft"

export async function loadCanonicalProfileByEmail(
  email: string
): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      profile: {
        include: {
          educationEntries: {
            orderBy: { sortOrder: "asc" },
          },
          experienceEntries: {
            orderBy: { sortOrder: "asc" },
          },
          projectEntries: {
            orderBy: { sortOrder: "asc" },
          },
          extracurricularEntries: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  })

  return user?.profile ? profileDataFromRecord(user.profile) : null
}

export async function loadPrimaryBaseResumeByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      baseResumes: {
        where: { isPrimary: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          extractedText: true,
          parsedProfileDraft: true,
          textExtractionError: true,
          fileName: true,
          createdAt: true,
        },
      },
    },
  })

  const baseResume = user?.baseResumes[0]
  if (!baseResume) return null

  return {
    id: baseResume.id,
    extractedText: baseResume.extractedText,
    parsedProfileDraft: fromPrismaProfileDraftJson(baseResume.parsedProfileDraft),
    textExtractionError: baseResume.textExtractionError,
    fileName: baseResume.fileName,
    createdAt: baseResume.createdAt,
  }
}
