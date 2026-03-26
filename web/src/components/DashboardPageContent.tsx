import AppHeader from "@/components/AppHeader"
import JobDescriptionCard from "@/app/dashboard/JobDescriptionCard"

type DashboardPageContentProps = {
  user: {
    name?: string | null
    email?: string | null
  }
  latestJobDescription: {
    content: string
    createdAt: string
  } | null
}

export default function DashboardPageContent({
  user,
  latestJobDescription,
}: DashboardPageContentProps) {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <AppHeader user={user} />

      <section className="mx-auto flex w-full max-w-6xl justify-center px-8 pt-20">
        <JobDescriptionCard latestJobDescription={latestJobDescription} />
      </section>
    </main>
  )
}
