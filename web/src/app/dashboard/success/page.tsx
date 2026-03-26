import { auth } from "@/auth"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function SuccessPage() {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-8 text-center">
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
          Upload complete
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Your file has been successfully submitted
        </h1>

        <p className="mt-3 text-sm text-white/60">
          You can continue to the next step.
        </p>

        <Link
          href="/"
          className="mt-8 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/15"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}
