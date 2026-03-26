import { auth } from "@/auth"
import {
  normalizeProfileData,
  profileDataFromRecord,
  profileDataToPersistenceInput,
} from "@/lib/profile"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 })
  }

  const profile = normalizeProfileData(body)
  const payload = profileDataToPersistenceInput(profile)

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email },
    select: { id: true },
  })

  const savedProfile = await prisma.$transaction(async (tx) => {
    const saved = await tx.profile.upsert({
      where: { userId: user.id },
      update: {
        fullName: payload.basics.fullName,
        email: payload.basics.email,
        phone: payload.basics.phone,
        location: payload.basics.location,
        linkedinUrl: payload.basics.linkedinUrl,
        githubUrl: payload.basics.githubUrl,
        skillLanguages: payload.skills.languages,
        skillFrameworks: payload.skills.frameworks,
        skillTools: payload.skills.tools,
        skillCloud: payload.skills.cloud,
        skillDatabases: payload.skills.databases,
        skillOther: payload.skills.other,
      },
      create: {
        userId: user.id,
        fullName: payload.basics.fullName,
        email: payload.basics.email,
        phone: payload.basics.phone,
        location: payload.basics.location,
        linkedinUrl: payload.basics.linkedinUrl,
        githubUrl: payload.basics.githubUrl,
        skillLanguages: payload.skills.languages,
        skillFrameworks: payload.skills.frameworks,
        skillTools: payload.skills.tools,
        skillCloud: payload.skills.cloud,
        skillDatabases: payload.skills.databases,
        skillOther: payload.skills.other,
      },
      select: { id: true },
    })

    await Promise.all([
      tx.profileEducation.deleteMany({ where: { profileId: saved.id } }),
      tx.profileExperience.deleteMany({ where: { profileId: saved.id } }),
      tx.profileProject.deleteMany({ where: { profileId: saved.id } }),
      tx.profileExtracurricular.deleteMany({ where: { profileId: saved.id } }),
    ])

    if (payload.educationEntries.length) {
      await tx.profileEducation.createMany({
        data: payload.educationEntries.map((entry) => ({
          profileId: saved.id,
          ...entry,
        })),
      })
    }

    if (payload.experienceEntries.length) {
      await tx.profileExperience.createMany({
        data: payload.experienceEntries.map((entry) => ({
          profileId: saved.id,
          ...entry,
        })),
      })
    }

    if (payload.projectEntries.length) {
      await tx.profileProject.createMany({
        data: payload.projectEntries.map((entry) => ({
          profileId: saved.id,
          ...entry,
        })),
      })
    }

    if (payload.extracurricularEntries.length) {
      await tx.profileExtracurricular.createMany({
        data: payload.extracurricularEntries.map((entry) => ({
          profileId: saved.id,
          ...entry,
        })),
      })
    }

    return tx.profile.findUniqueOrThrow({
      where: { id: saved.id },
      include: {
        educationEntries: { orderBy: { sortOrder: "asc" } },
        experienceEntries: { orderBy: { sortOrder: "asc" } },
        projectEntries: { orderBy: { sortOrder: "asc" } },
        extracurricularEntries: { orderBy: { sortOrder: "asc" } },
      },
    })
  })

  return Response.json({
    ok: true,
    profile: profileDataFromRecord(savedProfile),
  })
}
