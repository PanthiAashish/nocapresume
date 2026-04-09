import { auth, signIn } from "@/auth"
import DashboardPageContent from "@/components/DashboardPageContent"
import { prisma } from "@/lib/prisma"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    let latestJobDescription = null

    if (session.user.email) {
      try {
        latestJobDescription = await prisma.jobDescriptionEntry.findFirst({
          where: { userEmail: session.user.email },
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            createdAt: true,
          },
        })
      } catch (error) {
        console.error("Failed to load latest job description", error)
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
