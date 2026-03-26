import { auth } from "@/auth"
import AppHeader from "@/components/AppHeader"
import { emptyProfileData, profileDataFromDraft, profileDataFromRecord } from "@/lib/profile"
import { prisma } from "@/lib/prisma"
import { fromPrismaProfileDraftJson } from "@/lib/profileDraft"
import { redirect } from "next/navigation"
import ProfileForm from "./ProfileForm"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/")

  const user = session.user.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
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
          baseResumes: {
            where: { isPrimary: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              parsedProfileDraft: true,
            },
          },
        },
      })
    : null
  const initialProfileDraft = fromPrismaProfileDraftJson(
    user?.baseResumes[0]?.parsedProfileDraft ?? null
  )
  const initialProfile =
    user?.profile
      ? profileDataFromRecord(user.profile)
      : initialProfileDraft
        ? profileDataFromDraft(initialProfileDraft)
        : emptyProfileData()
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <AppHeader user={session.user} />

      <section className="mx-auto w-full max-w-5xl px-8 pb-16 pt-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Profile</h1>
        </div>

        <ProfileForm initialProfile={initialProfile} />
      </section>
    </main>
  )
}
