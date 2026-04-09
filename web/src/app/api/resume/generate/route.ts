import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { loadCanonicalProfileByEmail, loadPrimaryBaseResumeByEmail } from "@/lib/profileLoader"
import { profileDataFromDraftOrProfile } from "@/lib/baseResumeSource"
import { renderResumeAsPdf } from "@/lib/pdfResumeRenderer"
import { tailorResumeFromProfile } from "@/lib/resumeTailoring"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const content = typeof body?.content === "string" ? body.content.trim() : ""

  if (!content) {
    return new Response(JSON.stringify({ error: "missing_content" }), { status: 400 })
  }

  const [profile, baseResume] = await Promise.all([
    loadCanonicalProfileByEmail(session.user.email),
    loadPrimaryBaseResumeByEmail(session.user.email),
  ])

  const baseProfile = profileDataFromDraftOrProfile(profile, baseResume?.parsedProfileDraft ?? null)
  if (!baseProfile) {
    return new Response(JSON.stringify({ error: "missing_profile" }), { status: 400 })
  }

  if (!baseResume) {
    return new Response(JSON.stringify({ error: "missing_base_resume" }), { status: 400 })
  }

  const savedJobDescription = await prisma.jobDescriptionEntry.create({
    data: {
      userEmail: session.user.email,
      content,
    },
    select: { id: true, content: true, createdAt: true },
  })

  let tailored
  try {
    tailored = await tailorResumeFromProfile({
      jobDescriptionText: content,
      baseResumeText: baseResume.extractedText,
      profile: baseProfile,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "resume_tailoring_failed"
    return new Response(JSON.stringify({ error: "resume_tailoring_failed", details: message }), {
      status: 422,
    })
  }

  let rendered: Awaited<ReturnType<typeof renderResumeAsPdf>>

  try {
    rendered = await renderResumeAsPdf(tailored.finalResume)
  } catch (error) {
    const message = error instanceof Error ? error.message : "resume_generation_failed"
    return new Response(JSON.stringify({ error: "resume_render_failed", details: message }), {
      status: 422,
    })
  }
  const pdf = rendered.pdf
  const filenameBase =
    tailored.finalResume.basics.fullName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") ||
    "resume"

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filenameBase}_resume.pdf"`,
      "X-Job-Description-Id": savedJobDescription.id,
      "X-Selected-Experience-Count": String(rendered.fit.resume.experience.entries.length),
      "X-Selected-Project-Count": String(rendered.fit.resume.projects.entries.length),
      "X-Tailoring-Keywords": tailored.audit.matchedJobKeywords.slice(0, 8).join(","),
      "X-Tailoring-Notes": String(tailored.audit.notes.length),
      "X-Resume-Compression-Steps": rendered.fit.appliedSteps.join(","),
      "X-Resume-Font-Scale": String(rendered.fit.layoutState.fontScale),
      "X-Resume-Spacing-Tightness": String(rendered.fit.layoutState.spacingTightness),
      "X-Render-Path": "pdf-lib-fixed-template",
      "Cache-Control": "no-store",
    },
  })
}
