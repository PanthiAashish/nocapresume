import { signOut } from "@/auth"
import Link from "next/link"

type AppHeaderProps = {
  user: {
    name?: string | null
    email?: string | null
  }
  maxWidthClassName?: string
}

export default function AppHeader({
  user,
  maxWidthClassName = "max-w-6xl",
}: AppHeaderProps) {
  return (
    <header
      className={`mx-auto flex w-full ${maxWidthClassName} items-center justify-between px-8 py-6`}
    >
      <div className="text-lg font-semibold tracking-tight">NoCapResume</div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
        >
          Dashboard
        </Link>

        <div className="relative">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm">
                {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="max-w-[220px] truncate text-sm text-white/90">
                {user.name ?? user.email}
              </div>
              <div className="text-white/60 text-xs">▾</div>
            </summary>

            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0B1222] p-2 shadow-xl">
              <Link
                href="/profile"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
              >
                Profile
              </Link>

              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">
                  Log out
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
