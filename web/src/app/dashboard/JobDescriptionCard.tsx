"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type JobDescriptionCardProps = {
  latestJobDescription: {
    content: string
    createdAt: string
  } | null
}

export default function JobDescriptionCard({
  latestJobDescription,
}: JobDescriptionCardProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")

  async function onSave() {
    if (!content.trim()) {
      setStatus("error")
      setMsg("Paste a job description first")
      return
    }

    setStatus("saving")
    setMsg("")

    try {
      const res = await fetch("/api/job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus("error")
        setMsg(data?.error || "Save failed")
        return
      }

      setStatus("done")
      setMsg("Job description saved")
      setContent("")
      router.refresh()
    } catch {
      setStatus("error")
      setMsg("Save failed")
    }
  }

  return (
    <div className="mb-6 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="text-sm font-medium tracking-tight text-white/90">
        Job description
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste the job description here"
        rows={8}
        className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
      />

      <button
        type="button"
        onClick={onSave}
        disabled={status === "saving" || !content.trim()}
        className="mt-4 w-full rounded-xl bg-white/10 px-4 py-4 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save job description"}
      </button>

      {msg ? (
        <div
          className={`mt-3 text-sm ${
            status === "error" ? "text-red-300" : "text-white/80"
          }`}
        >
          {msg}
        </div>
      ) : null}
    </div>
  )
}
