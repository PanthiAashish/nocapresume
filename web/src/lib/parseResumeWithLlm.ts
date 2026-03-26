import { normalizeProfileDraft, type ProfileDraft } from "@/lib/profileDraft"

const DEFAULT_MODEL = process.env.OPENAI_PROFILE_PARSER_MODEL || "gpt-4.1-mini"

const PROFILE_PARSER_PROMPT = `You extract structured resume data from plain resume text.

Rules:
- Extract only information explicitly supported by the provided resume text.
- Do not infer, guess, or hallucinate missing values.
- Return valid JSON only. No markdown. No code fences. No commentary.
- Preserve bullet wording closely when possible.
- For missing string fields, return "".
- For missing array fields, return [].
- For missing booleans, return false.
- Keep month and year as separate strings when available.
- If a section is absent, return an empty array or empty object fields as appropriate.

Return exactly this JSON shape:
{
  "basics": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedinUrl": "",
    "githubUrl": ""
  },
  "education": [
    {
      "school": "",
      "college": "",
      "degree": "",
      "fieldOfStudy": "",
      "minor": "",
      "schoolYear": "",
      "startMonth": "",
      "startYear": "",
      "endMonth": "",
      "endYear": "",
      "currentlyAttending": false,
      "gpa": "",
      "departmentGpa": "",
      "description": ""
    }
  ],
  "experience": [
    {
      "company": "",
      "title": "",
      "location": "",
      "startMonth": "",
      "startYear": "",
      "endMonth": "",
      "endYear": "",
      "currentlyWorking": false,
      "bullets": []
    }
  ],
  "projects": [
    {
      "name": "",
      "role": "",
      "startMonth": "",
      "startYear": "",
      "endMonth": "",
      "endYear": "",
      "currentlyWorking": false,
      "bullets": [],
      "technologies": [],
      "githubUrl": "",
      "liveUrl": ""
    }
  ],
  "skills": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "cloud": [],
    "databases": [],
    "other": []
  },
  "extracurricular": [
    {
      "organization": "",
      "title": "",
      "location": "",
      "startMonth": "",
      "startYear": "",
      "endMonth": "",
      "endYear": "",
      "bullets": []
    }
  ]
}`

function stripCodeFences(content: string) {
  return content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
}

export async function parseResumeWithLlm(resumeText: string): Promise<ProfileDraft> {
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
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: PROFILE_PARSER_PROMPT,
        },
        {
          role: "user",
          content: `Resume text:\n${resumeText}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`openai_profile_parse_failed:${response.status}:${errorText}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("openai_profile_parse_empty")
  }

  const parsed = JSON.parse(stripCodeFences(content))
  return normalizeProfileDraft(parsed)
}
