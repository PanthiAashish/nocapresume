import { auth } from "@/auth"
import { extractPdfText } from "@/lib/extractPdfText"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("resume") as File | null

  if (!file) {
    return new Response(JSON.stringify({ error: "missing_file" }), { status: 400 })
  }

  if (file.type !== "application/pdf") {
    return new Response(JSON.stringify({ error: "only_pdf" }), { status: 400 })
  }

  const ab = await file.arrayBuffer()
  const bytes = Buffer.from(ab)
  let extractedText: string | null = null
  let textExtractionError: string | null = null

  try {
    const text = await extractPdfText(bytes)
    extractedText = text || null
  } catch (error) {
    console.error("Resume PDF text extraction failed", error)
    textExtractionError = "pdf_text_extraction_failed"
  }

  const saved = await prisma.resumeUpload.create({
    data: {
      userEmail: session.user.email,
      filename: file.name || "resume.pdf",
      mimeType: file.type,
      bytes,
      extractedText,
      textExtractionError,
    },
    select: {
      id: true,
      createdAt: true,
      filename: true,
      textExtractionError: true,
    },
  })

  return Response.json({
    ok: true,
    upload: saved,
    extraction: {
      ok: !saved.textExtractionError,
      error: saved.textExtractionError,
    },
  })
}
