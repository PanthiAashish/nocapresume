import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type RouteProps = {
  params: Promise<{
    reportId: string
  }>
}

export const runtime = "nodejs"

export async function GET(_: Request, { params }: RouteProps) {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }

  const { reportId } = await params

  const report = await prisma.tailoredResumeReport.findFirst({
    where: {
      id: reportId,
      userEmail: session.user.email,
    },
    select: {
      pdf: true,
      tailoredResumeJson: true,
    },
  })

  if (!report) {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404 })
  }

  const basics =
    report.tailoredResumeJson &&
    typeof report.tailoredResumeJson === "object" &&
    !Array.isArray(report.tailoredResumeJson) &&
    "basics" in report.tailoredResumeJson &&
    report.tailoredResumeJson.basics &&
    typeof report.tailoredResumeJson.basics === "object"
      ? (report.tailoredResumeJson.basics as { fullName?: string })
      : null

  const filenameBase =
    basics?.fullName?.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") || "resume"

  return new Response(new Uint8Array(report.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filenameBase}_tailored_resume.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
