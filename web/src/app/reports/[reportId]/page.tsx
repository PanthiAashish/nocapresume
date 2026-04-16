import { auth } from "@/auth"
import AppHeader from "@/components/AppHeader"
import ResumePreview from "@/components/ResumePreview"
import {
  isEnhancementReport,
  isStructuredResume,
  type EnhancementReport,
} from "@/lib/enhancementReport"
import { prisma } from "@/lib/prisma"
import type { StructuredResume } from "@/lib/resumeSchema"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

type ReportPageProps = {
  params: Promise<{
    reportId: string
  }>
}

export default async function ReportPage({ params }: ReportPageProps) {
  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const { reportId } = await params

  const secureReport = await prisma.tailoredResumeReport.findFirst({
    where: {
      id: reportId,
      userEmail: session.user.email,
    },
    select: {
      id: true,
      createdAt: true,
      tailoredResumeJson: true,
      enhancementReportJson: true,
      jobDescriptionEntry: {
        select: {
          content: true,
        },
      },
    },
  })

  if (!secureReport) notFound()

  if (!isStructuredResume(secureReport.tailoredResumeJson)) notFound()
  if (!isEnhancementReport(secureReport.enhancementReportJson)) notFound()

  const resume = secureReport.tailoredResumeJson as StructuredResume
  const enhancementReport = secureReport.enhancementReportJson as EnhancementReport

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <AppHeader user={session.user} />

      <section className="mx-auto w-full max-w-7xl px-8 pb-20 pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-white/45">Enhancement Report</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Tailored resume package</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              Generated {new Date(secureReport.createdAt).toLocaleString()} from the linked job description.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/api/reports/${secureReport.id}/pdf`}
              className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
            >
              Download PDF
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-[#0B1222] p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Generated Resume</div>
              <div className="mt-5">
                <ResumePreview resume={resume} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1222] p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">What Was Added / Changed</div>
              <div className="mt-5 space-y-4">
                {enhancementReport.changes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/55">
                    No grounded bullet rewrites were retained for this JD.
                  </div>
                ) : (
                  enhancementReport.changes.map((change, index) => (
                    <article key={`${change.entryId}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                        Triggered by &ldquo;{change.trigger}&rdquo;
                      </div>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-white/45">Original</div>
                          <div className="mt-2 text-sm text-white/70">
                            {change.originalText || "Newly added"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-white/45">Tailored</div>
                          <div className="mt-2 text-sm text-white">{change.tailoredText}</div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-[#0B1222] p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">JD Coverage</div>
              <div className="mt-5 flex flex-wrap gap-3">
                {enhancementReport.extractedRequirements.map((requirement) => (
                  <div
                    key={`${requirement.domain}-${requirement.keyword}`}
                    className={`rounded-full px-3 py-2 text-sm ${
                      requirement.coverage === "covered"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : requirement.coverage === "enhanced"
                          ? "bg-amber-500/15 text-amber-200"
                          : "bg-rose-500/15 text-rose-200"
                    }`}
                  >
                    {requirement.keyword} · {requirement.coverage}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1222] p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Interview Study Guide</div>
              <div className="mt-5 space-y-5">
                {enhancementReport.studyGuide.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/55">
                    The JD mainly aligned with skills already present in your base resume.
                  </div>
                ) : (
                  enhancementReport.studyGuide.map((topic) => (
                    <article key={topic.skill} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <h2 className="text-lg font-semibold">{topic.skill}</h2>
                      <p className="mt-2 text-sm text-white/65">{topic.reason}</p>

                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Concepts</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                          {topic.concepts.map((concept) => (
                            <li key={concept}>{concept}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Interview Questions</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                          {topic.questions.map((question) => (
                            <li key={question.question}>
                              {question.question} ({question.difficulty})
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Resources</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                          {topic.resources.map((resource) => (
                            <li key={resource.url}>
                              <a href={resource.url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">
                                {resource.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Mini Project</div>
                        <p className="mt-2 text-sm text-white/80">{topic.miniProject}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1222] p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Job Description</div>
              <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                {secureReport.jobDescriptionEntry.content}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
