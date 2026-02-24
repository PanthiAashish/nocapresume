"use client"

import { useState } from "react"

export default function UploadCard() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle"
  )
  const [msg, setMsg] = useState("")

  async function onUpload() {
    if (!file) return
    setStatus("uploading")
    setMsg("")

    try {
      const fd = new FormData()
      fd.append("resume", file)

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: fd,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus("error")
        setMsg(data?.error || "Upload failed")
        return
      }

      setStatus("done")
      setMsg(`Saved: ${data.upload.filename}`)
      window.location.href = "/dashboard/success"
    } catch (e) {
      setStatus("error")
      setMsg("Upload failed")
    }
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="text-2xl font-semibold tracking-tight">
        Upload your resume (PDF)
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 px-6 py-14 text-center hover:bg-black/30">
          <div className="text-sm text-white/80">
            {file ? file.name : "Click to choose a PDF"}
          </div>
          <div className="text-xs text-white/50">.pdf</div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button
          type="button"
          onClick={onUpload}
          disabled={!file || status === "uploading"}
          className="mt-5 w-full rounded-xl bg-white/10 px-4 py-4 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
        >
          {status === "uploading" ? "Uploading..." : "Save to account"}
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
    </div>
  )
}
