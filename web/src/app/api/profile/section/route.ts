import { auth } from "@/auth"
import {
  educationEntriesFromRecords,
  educationEntriesToPersistenceInput,
  experienceEntriesFromRecords,
  experienceEntriesToPersistenceInput,
  extracurricularEntriesFromRecords,
  extracurricularEntriesToPersistenceInput,
  normalizeProfileData,
  projectEntriesFromRecords,
  projectEntriesToPersistenceInput,
} from "@/lib/profile"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.section !== "string") {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 })
  }

  const section = body.section

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email },
    select: { id: true },
  })

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
    select: { id: true },
  })

  if (section === "education") {
    const entries = normalizeProfileData({ educationEntries: body.entries }).educationEntries
    const payload = educationEntriesToPersistenceInput(entries)

    const savedEntries = await prisma.$transaction(async (tx) => {
      await tx.profileEducation.deleteMany({ where: { profileId: profile.id } })
      if (payload.length) {
        await tx.profileEducation.createMany({
          data: payload.map((entry) => ({ profileId: profile.id, ...entry })),
        })
      }
      return tx.profileEducation.findMany({
        where: { profileId: profile.id },
        orderBy: { sortOrder: "asc" },
      })
    })

    return Response.json({
      ok: true,
      section,
      entries: educationEntriesFromRecords(savedEntries),
    })
  }

  if (section === "experience") {
    const entries = normalizeProfileData({ experienceEntries: body.entries }).experienceEntries
    const payload = experienceEntriesToPersistenceInput(entries)

    const savedEntries = await prisma.$transaction(async (tx) => {
      await tx.profileExperience.deleteMany({ where: { profileId: profile.id } })
      if (payload.length) {
        await tx.profileExperience.createMany({
          data: payload.map((entry) => ({ profileId: profile.id, ...entry })),
        })
      }
      return tx.profileExperience.findMany({
        where: { profileId: profile.id },
        orderBy: { sortOrder: "asc" },
      })
    })

    return Response.json({
      ok: true,
      section,
      entries: experienceEntriesFromRecords(savedEntries),
    })
  }

  if (section === "projects") {
    const entries = normalizeProfileData({ projectEntries: body.entries }).projectEntries
    const payload = projectEntriesToPersistenceInput(entries)

    const savedEntries = await prisma.$transaction(async (tx) => {
      await tx.profileProject.deleteMany({ where: { profileId: profile.id } })
      if (payload.length) {
        await tx.profileProject.createMany({
          data: payload.map((entry) => ({ profileId: profile.id, ...entry })),
        })
      }
      return tx.profileProject.findMany({
        where: { profileId: profile.id },
        orderBy: { sortOrder: "asc" },
      })
    })

    return Response.json({
      ok: true,
      section,
      entries: projectEntriesFromRecords(savedEntries),
    })
  }

  if (section === "extracurricular") {
    const entries = normalizeProfileData({ extracurricularEntries: body.entries })
      .extracurricularEntries
    const payload = extracurricularEntriesToPersistenceInput(entries)

    const savedEntries = await prisma.$transaction(async (tx) => {
      await tx.profileExtracurricular.deleteMany({ where: { profileId: profile.id } })
      if (payload.length) {
        await tx.profileExtracurricular.createMany({
          data: payload.map((entry) => ({ profileId: profile.id, ...entry })),
        })
      }
      return tx.profileExtracurricular.findMany({
        where: { profileId: profile.id },
        orderBy: { sortOrder: "asc" },
      })
    })

    return Response.json({
      ok: true,
      section,
      entries: extracurricularEntriesFromRecords(savedEntries),
    })
  }

  return new Response(JSON.stringify({ error: "invalid_section" }), { status: 400 })
}
