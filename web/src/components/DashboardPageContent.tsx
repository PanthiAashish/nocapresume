import AppHeader from "@/components/AppHeader"
import JobDescriptionCard from "@/app/dashboard/JobDescriptionCard"
import Link from "next/link"

type DashboardPageContentProps = {
  user: {
    name?: string | null
    email?: string | null
  }
  latestJobDescription: {
    content: string
    createdAt: string
  } | null
  recentReports: Array<{
    id: string
    createdAt: string
    jobDescriptionPreview: string
  }>
}

export default function DashboardPageContent({
  user,
  latestJobDescription,
  recentReports,
}: DashboardPageContentProps) {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <AppHeader user={user} />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-8 pb-20 pt-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <JobDescriptionCard latestJobDescription={latestJobDescription} />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="text-sm font-medium tracking-tight text-white/90">Enhancement history</div>

          {recentReports.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-white/55">
              Generated reports will appear here.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-white/20 hover:bg-black/30"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {new Date(report.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-2 line-clamp-3 text-sm text-white/80">
                    {report.jobDescriptionPreview}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
