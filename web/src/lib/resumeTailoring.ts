import { buildBaseResumeSource, type BaseResumeSource } from "@/lib/baseResumeSource"
import type { EnhancementReport } from "@/lib/enhancementReport"
import type { ProfileData } from "@/lib/profile"
import { buildTailoringPrompt } from "@/lib/resumeTailoringPrompt"
import { normalizeLlmTailoringPayload } from "@/lib/resumeTailoringSchema"
import type { StructuredResume } from "@/lib/resumeSchema"

const DEFAULT_MODEL = process.env.OPENAI_RESUME_TAILOR_MODEL || "gpt-4.1-mini"

export type TailoringResult = {
  source: BaseResumeSource
  finalResume: StructuredResume
  enhancementReport: EnhancementReport
}

function stripCodeFences(content: string) {
  return content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
}

async function requestJsonFromOpenAi(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("missing_openai_api_key")
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`openai_resume_tailor_failed:${response.status}:${errorText}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("openai_resume_tailor_empty")
  }

  return stripCodeFences(content)
}

export async function tailorResumeFromProfile(input: {
  jobDescriptionText: string
  baseResumeText?: string | null
  profile: ProfileData
}): Promise<TailoringResult> {
  const source = buildBaseResumeSource(input)
  const prompt = buildTailoringPrompt(source)
  const rawResponse = await requestJsonFromOpenAi(prompt)

  console.info("[resume-tailoring] raw-llm-response", rawResponse)

  const payload = normalizeLlmTailoringPayload(JSON.parse(rawResponse), source.basics)

  return {
    source,
    finalResume: payload.finalResume,
    enhancementReport: payload.enhancementReport,
  }
}
