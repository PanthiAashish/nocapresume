import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

  const saved = await prisma.resumeUpload.create({
    data: {
      userEmail: session.user.email,
      filename: file.name || "resume.pdf",
      mimeType: file.type,
      bytes,
    },
    select: { id: true, createdAt: true, filename: true },
  })

  return Response.json({ ok: true, upload: saved })
}
