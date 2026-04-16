import { auth, signIn } from "@/auth"
import DashboardPageContent from "@/components/DashboardPageContent"
import { prisma } from "@/lib/prisma"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    let latestJobDescription = null
    let recentReports: Array<{
      id: string
      createdAt: string
      jobDescriptionPreview: string
    }> = []

    if (session.user.email) {
      try {
        const [latestJobDescriptionEntry, reportEntries] = await Promise.all([
          prisma.jobDescriptionEntry.findFirst({
            where: { userEmail: session.user.email },
            orderBy: { createdAt: "desc" },
            select: {
              content: true,
              createdAt: true,
            },
          }),
          prisma.tailoredResumeReport.findMany({
            where: { userEmail: session.user.email },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
              id: true,
              createdAt: true,
              jobDescriptionEntry: {
                select: {
                  content: true,
                },
              },
            },
          }),
        ])

        latestJobDescription = latestJobDescriptionEntry
        recentReports = reportEntries.map((entry) => ({
          id: entry.id,
          createdAt: entry.createdAt.toISOString(),
          jobDescriptionPreview: entry.jobDescriptionEntry.content,
        }))
      } catch (error) {
        console.error("Failed to load dashboard data", error)
      }
    }

    return (
      <DashboardPageContent
        user={session.user}
        latestJobDescription={
          latestJobDescription
            ? {
                content: latestJobDescription.content,
                createdAt: latestJobDescription.createdAt.toISOString(),
              }
            : null
        }
        recentReports={recentReports}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="flex min-h-screen flex-col items-center justify-between">
          <div className="pt-[40vh]">
            <div className="text-center text-5xl font-extrabold tracking-tight">
              NoCapResume
            </div>
          </div>

          <div className="mt-10 w-full max-w-md pb-[40vh]">
            <form
              action={async () => {
                "use server"
                await signIn("google")
              }}
            >
              <button className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-medium text-white hover:bg-white/15">
                Sign in with Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
