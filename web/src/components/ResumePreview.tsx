import type { StructuredResume } from "@/lib/resumeSchema"

type ResumePreviewProps = {
  resume: StructuredResume
}

function renderDateRange(params: {
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking?: boolean
  currentlyAttending?: boolean
}) {
  const start = [params.startMonth, params.startYear].filter(Boolean).join(" ")
  const end =
    params.currentlyWorking || params.currentlyAttending
      ? "Present"
      : [params.endMonth, params.endYear].filter(Boolean).join(" ")
  return [start, end].filter(Boolean).join(" - ")
}

export default function ResumePreview({ resume }: ResumePreviewProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-semibold tracking-tight">{resume.basics.fullName}</h1>
        <div className="mt-2 text-sm text-slate-600">
          {[resume.basics.email, resume.basics.phone, resume.basics.location]
            .filter(Boolean)
            .join(" | ")}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {[resume.basics.linkedIn, resume.basics.github].filter(Boolean).join(" | ")}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Skills</h2>
        <div className="mt-3 space-y-2">
          {resume.skills.categories.map((category) => (
            <div key={category.id} className="text-sm">
              <span className="font-semibold">{category.label}:</span>{" "}
              <span>{category.items.map((item) => item.label).join(", ")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Experience</h2>
        <div className="mt-3 space-y-5">
          {resume.experience.entries.map((entry) => (
            <article key={entry.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="font-semibold">{entry.title}</div>
                  <div className="text-sm text-slate-600">
                    {[entry.company, entry.location].filter(Boolean).join(" | ")}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {renderDateRange(entry)}
                </div>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {entry.bullets.map((bullet, index) => (
                  <li key={`${entry.id}-${index}`}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Projects</h2>
        <div className="mt-3 space-y-5">
          {resume.projects.entries.map((entry) => (
            <article key={entry.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="font-semibold">{entry.name}</div>
                  <div className="text-sm text-slate-600">
                    {[entry.role, entry.technologies.join(", ")].filter(Boolean).join(" | ")}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {renderDateRange(entry)}
                </div>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {entry.bullets.map((bullet, index) => (
                  <li key={`${entry.id}-${index}`}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Education</h2>
        <div className="mt-3 space-y-4">
          {resume.education.entries.map((entry) => (
            <article key={entry.id} className="flex flex-wrap items-baseline justify-between gap-3 text-sm">
              <div>
                <div className="font-semibold">
                  {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ")}
                </div>
                <div className="text-slate-600">
                  {[entry.school, entry.college].filter(Boolean).join(" | ")}
                </div>
              </div>
              <div className="text-slate-500">
                {renderDateRange(entry)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
