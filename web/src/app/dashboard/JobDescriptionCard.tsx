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
  const [content, setContent] = useState(latestJobDescription?.content ?? "")
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")
  const [generationSummary, setGenerationSummary] = useState<{
    experienceCount: number
    projectCount: number
    leadershipCount: number
    reportId: string
  } | null>(null)

  async function onGenerate() {
    if (!content.trim()) {
      setStatus("error")
      setMsg("Paste a job description first")
      return
    }

    setStatus("saving")
    setMsg("")

    try {
      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus("error")
        setMsg(
          data?.error === "missing_profile"
            ? "Complete your saved profile first"
            : data?.error || "Generation failed"
        )
        return
      }

      const data = await res.json()

      setGenerationSummary({
        experienceCount: Number(data?.experienceCount ?? "0"),
        projectCount: Number(data?.projectCount ?? "0"),
        leadershipCount: Number(data?.leadershipCount ?? "0"),
        reportId: String(data?.reportId ?? ""),
      })
      setStatus("done")
      setMsg("Tailored resume and enhancement report generated")
      router.push(`/reports/${data.reportId}`)
      router.refresh()
    } catch {
      setStatus("error")
      setMsg("Generation failed")
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
        onClick={onGenerate}
        disabled={status === "saving" || !content.trim()}
        className={`mt-4 w-full rounded-xl px-4 py-4 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
          content.trim()
            ? "bg-blue-600 hover:bg-blue-500"
            : "bg-white/10 hover:bg-white/15"
        }`}
      >
        {status === "saving" ? "Generating..." : "Generate Resume"}
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

      {generationSummary ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
          Selected {generationSummary.experienceCount} experience entries,{" "}
          {generationSummary.projectCount} projects, and{" "}
          {generationSummary.leadershipCount} leadership entries. Report ID:{" "}
          {generationSummary.reportId}
        </div>
      ) : null}
    </div>
  )
}
