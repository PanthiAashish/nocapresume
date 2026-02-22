// web/src/app/dashboard/page.tsx
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-6">
        <div className="text-lg font-semibold tracking-tight">NoCapResume</div>

        <div className="relative">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm">
                {session.user.name?.[0]?.toUpperCase() ??
                  session.user.email?.[0]?.toUpperCase() ??
                  "U"}
              </div>
              <div className="max-w-[220px] truncate text-sm text-white/90">
                {session.user.name ?? session.user.email}
              </div>
              <div className="text-white/60 text-xs">▾</div>
            </summary>

            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0B1222] p-2 shadow-xl">
              <div className="px-3 py-2">
                <div className="text-xs text-white/60">Signed in as</div>
                <div className="mt-1 truncate text-sm text-white/90">
                  {session.user.email}
                </div>
              </div>

              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">
                  Log out
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>

      {/* This is what makes the card sit lower */}
      <section className="mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-6xl items-start justify-center px-8 pt-20">
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="text-2xl font-semibold tracking-tight">
            Upload your resume (PDF)
          </div>

          <form className="mt-6">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 px-6 py-14 text-center hover:bg-black/30">
              <div className="text-sm text-white/80">Click to choose a PDF</div>
              <div className="text-xs text-white/50">.pdf</div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                name="resume"
              />
            </label>

            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-white/10 px-4 py-4 text-sm font-medium text-white hover:bg-white/15"
            >
              Continue
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}