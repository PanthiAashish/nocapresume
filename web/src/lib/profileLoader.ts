import { prisma } from "@/lib/prisma"
import { profileDataFromRecord, type ProfileData } from "@/lib/profile"

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
