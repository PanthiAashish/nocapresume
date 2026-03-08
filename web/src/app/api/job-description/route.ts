import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const content =
    typeof body?.content === "string" ? body.content.trim() : ""

  if (!content) {
    return new Response(JSON.stringify({ error: "missing_content" }), { status: 400 })
  }

  const saved = await prisma.jobDescriptionEntry.create({
    data: {
      userEmail: session.user.email,
      content,
    },
    select: { id: true, content: true, createdAt: true },
  })

  return Response.json({ ok: true, jobDescription: saved })
}
