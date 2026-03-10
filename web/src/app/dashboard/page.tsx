import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import JobDescriptionCard from "./JobDescriptionCard"
import UploadCard from "./UploadCard"

export default async function Dashboard() {
  const session = await auth()
  if (!session?.user) redirect("/")

  const uploads = session.user.email
    ? await prisma.resumeUpload.findMany({
        where: { userEmail: session.user.email },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          filename: true,
          createdAt: true,
          extractedText: true,
          textExtractionError: true,
        },
      })
    : null
  const latestJobDescription = session.user.email
    ? await prisma.jobDescriptionEntry.findFirst({
        where: { userEmail: session.user.email },
        orderBy: { createdAt: "desc" },
        select: { content: true, createdAt: true },
      })
    : null
  const latestResume = uploads?.[0] ?? null
  const latestResumePreview = latestResume?.extractedText
    ? latestResume.extractedText.slice(0, 600).trim()
    : null
  const readinessMessage =
    latestResume && latestJobDescription
      ? "Ready for analysis"
      : latestResume
        ? "Missing job description"
        : latestJobDescription
          ? "Missing resume"
          : "Missing resume and job description"

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

      <section className="mx-auto min-h-[calc(100vh-84px)] w-full max-w-6xl px-8 pt-24">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="flex">
            <JobDescriptionCard
              latestJobDescription={
                latestJobDescription
                  ? {
                      content: latestJobDescription.content,
                      createdAt: latestJobDescription.createdAt.toISOString(),
                    }
                  : null
              }
            />
          </div>
          <div className="flex">
            <UploadCard />
          </div>
        </div>

        <div className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="text-sm font-medium tracking-tight text-white/90">
            Analysis workspace
          </div>
          <div className="mt-2 text-sm text-white/70">{readinessMessage}</div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
                Latest resume
              </div>
              {latestResume ? (
                <>
                  <div className="mt-3 text-sm text-white">{latestResume.filename}</div>
                  <div className="mt-1 text-xs text-white/60">
                    Uploaded{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(latestResume.createdAt)}
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
                      Extracted text preview
                    </div>
                    {latestResumePreview ? (
                      <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-white/85">
                        {latestResumePreview}
                        {latestResume.extractedText &&
                        latestResume.extractedText.length > latestResumePreview.length
                          ? "..."
                          : ""}
                      </div>
                    ) : latestResume.textExtractionError ? (
                      <div className="mt-3 text-sm text-white/60">
                        Resume text extraction failed for this upload.
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-white/60">
                        No extracted text available yet.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-white/60">
                  No resume uploaded yet.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
                Latest job description
              </div>
              {latestJobDescription ? (
                <>
                  <div className="mt-3 text-xs text-white/60">
                    Saved{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(latestJobDescription.createdAt)}
                  </div>
                  <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-white/85">
                    {latestJobDescription.content}
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-white/60">
                  No job description saved yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
