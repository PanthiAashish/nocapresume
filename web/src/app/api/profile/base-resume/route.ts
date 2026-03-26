import { auth } from "@/auth"
import { extractPdfText } from "@/lib/extractPdfText"
import { parseResumeWithLlm } from "@/lib/parseResumeWithLlm"
import { toPrismaProfileDraftJson } from "@/lib/profileDraft"
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

  const arrayBuffer = await file.arrayBuffer()
  const bytes = Buffer.from(arrayBuffer)
  let extractedText: string | null = null
  let textExtractionError: string | null = null
  let parsedProfileDraft = null

  try {
    const text = await extractPdfText(bytes)
    extractedText = text || null
  } catch (error) {
    console.error("Base resume PDF text extraction failed", error)
    textExtractionError = "pdf_text_extraction_failed"
  }

  if (extractedText) {
    try {
      parsedProfileDraft = await parseResumeWithLlm(extractedText)
    } catch (error) {
      console.error("Base resume LLM parsing failed", error)
    }
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email },
    select: { id: true },
  })

  await prisma.baseResume.updateMany({
    where: {
      userId: user.id,
      isPrimary: true,
    },
    data: {
      isPrimary: false,
    },
  })

  const saved = await prisma.baseResume.create({
    data: {
      userId: user.id,
      fileName: file.name || "resume.pdf",
      storageKey: null,
      mimeType: file.type,
      fileSize: bytes.byteLength,
      bytes,
      extractedText,
      parsedProfileDraft: parsedProfileDraft
        ? toPrismaProfileDraftJson(parsedProfileDraft)
        : undefined,
      textExtractionError,
      isPrimary: true,
    },
    select: {
      id: true,
      createdAt: true,
      fileName: true,
      fileSize: true,
      parsedProfileDraft: true,
      textExtractionError: true,
      isPrimary: true,
    },
  })

  return Response.json({
    ok: true,
    baseResume: saved,
    parsedProfileDraft,
    extraction: {
      ok: !saved.textExtractionError,
      error: saved.textExtractionError,
    },
  })
}
