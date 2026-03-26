import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { loadCanonicalProfileByEmail } from "@/lib/profileLoader"
import { compileLatexToPdf } from "@/lib/latexCompiler"
import { renderResumeAsLatex } from "@/lib/latexResumeRenderer"
import { generateResumeFromProfile } from "@/lib/resumeGeneration"

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

  const profile = await loadCanonicalProfileByEmail(session.user.email)
  if (!profile) {
    return new Response(JSON.stringify({ error: "missing_profile" }), { status: 400 })
  }

  const savedJobDescription = await prisma.jobDescriptionEntry.create({
    data: {
      userEmail: session.user.email,
      content,
    },
    select: { id: true, content: true, createdAt: true },
  })

  const generatedResume = generateResumeFromProfile(profile, content)
  const latex = renderResumeAsLatex(generatedResume)
  const latexResult = await compileLatexToPdf(latex)

  if (!latexResult.ok) {
    return new Response(
      JSON.stringify({
        error: latexResult.reason,
        latexEngine: latexResult.engine ?? null,
        details: latexResult.error ?? null,
      }),
      { status: 503 }
    )
  }

  const pdf = latexResult.pdf
  const filenameBase =
    generatedResume.header.fullName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") ||
    "resume"

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filenameBase}_resume.pdf"`,
      "X-Job-Description-Id": savedJobDescription.id,
      "X-Selected-Experience-Count": String(generatedResume.experience.length),
      "X-Selected-Project-Count": String(generatedResume.projects.length),
      "X-Selected-Leadership-Count": String(generatedResume.leadership.length),
      "X-Render-Path": "latex",
      "X-Latex-Engine": latexResult.engine,
      "Cache-Control": "no-store",
    },
  })
}
