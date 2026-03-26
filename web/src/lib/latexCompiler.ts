import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const LATEX_ENGINES = ["pdflatex", "xelatex", "lualatex"] as const

export type LatexCompileResult =
  | {
      ok: true
      engine: string
      pdf: Buffer
      tex: string
    }
  | {
      ok: false
      reason: "engine_unavailable" | "compile_failed"
      tex: string
      engine?: string
      error?: string
    }

async function findAvailableLatexEngine() {
  for (const engine of LATEX_ENGINES) {
    try {
      await execFileAsync("sh", ["-lc", `command -v ${engine}`])
      return engine
    } catch {
      continue
    }
  }

  return null
}

export async function compileLatexToPdf(tex: string): Promise<LatexCompileResult> {
  const engine = await findAvailableLatexEngine()
  if (!engine) {
    return {
      ok: false,
      reason: "engine_unavailable",
      tex,
    }
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "nocapresume-"))
  const texPath = path.join(tempDir, "resume.tex")
  const pdfPath = path.join(tempDir, "resume.pdf")
  const logPath = path.join(tempDir, "resume.log")

  try {
    await fs.writeFile(texPath, tex, "utf8")
    await execFileAsync(
      engine,
      ["-interaction=nonstopmode", "-halt-on-error", "-output-directory", tempDir, texPath],
      {
        cwd: tempDir,
        maxBuffer: 1024 * 1024 * 10,
      }
    )

    const pdf = await fs.readFile(pdfPath)
    return {
      ok: true,
      engine,
      pdf,
      tex,
    }
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : "latex_compile_failed"
    try {
      const log = await fs.readFile(logPath, "utf8")
      errorMessage = log.slice(-8000)
    } catch {
      // Fall back to the command error message when the log file is unavailable.
    }
    return {
      ok: false,
      reason: "compile_failed",
      tex,
      engine,
      error: errorMessage,
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}
