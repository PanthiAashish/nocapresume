import type { BaseResumeSource } from "@/lib/baseResumeSource"

function compact(values: Array<string | undefined>) {
  return values.map((value) => value?.trim() ?? "").filter(Boolean)
}

export function buildTailoringPrompt(source: BaseResumeSource) {
  const sourcePayload = {
    basics: source.basics,
    education: source.education.map((entry) => ({
      id: entry.id,
      school: entry.school,
      college: entry.college,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy,
      minor: entry.minor,
      dates: compact([
        `${entry.startMonth} ${entry.startYear}`.trim(),
        `${entry.endMonth} ${entry.endYear}`.trim(),
      ]).join(" - "),
      sourceText: entry.sourceText,
    })),
    skills: source.skills.map((category) => ({
      id: category.id,
      label: category.label,
      items: category.items,
      sourceText: category.sourceText,
    })),
    experience: source.experience.map((entry) => ({
      id: entry.id,
      company: entry.company,
      title: entry.title,
      location: entry.location,
      bullets: entry.bullets,
      sourceText: entry.sourceText,
    })),
    projects: source.projects.map((entry) => ({
      id: entry.id,
      name: entry.name,
      role: entry.role,
      technologies: entry.technologies,
      bullets: entry.bullets,
      sourceText: entry.sourceText,
    })),
  }

  return `You tailor resumes using only evidence from the provided base resume.

Hard rules:
- Use only information explicitly supported by the base resume source data and base resume text.
- Unsupported claims are forbidden.
- Do not invent metrics, technologies, responsibilities, titles, dates, outcomes, certifications, or scope.
- Prefer rewriting or lightly compressing existing bullets over creating new claims.
- Keep tailored bullets semantically close to the cited evidence.
- Every bullet or selected skill must include sourceEvidence copied verbatim or near-verbatim from the selected base resume entry.
- Rank items by relevance to the job description.
- Output valid JSON only. No markdown. No code fences. No commentary.
- If the job description is ML-focused, foreground truthfully supported ML-adjacent framing such as experimentation, evaluation, ranking, personalization support, recommendation support, analytics, user-data pipelines, or backend systems enabling intelligent products.
- When the base resume references a product or company with obvious intelligent-product context, you may connect supported backend/data/experimentation work to that context, but only as adjacent support. Do not claim direct model training or ML ownership unless explicitly supported.

For evidence:
- sourceEntryId must reference a provided source item id.
- sourceSection must be one of: experience, projects, skills, education, summary.
- sourceEvidence must quote or closely match supporting text from the matching base resume source item.
- confidence must be a number from 0 to 1.
- jobRelevanceScore must be a number from 0 to 100.
- reason must briefly explain why the item matches the job description.

Do not output any section item if it cannot be grounded.

Return exactly this JSON shape:
{
  "basics": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedIn": "",
    "github": ""
  },
  "summary": {
    "text": "",
    "sourceEvidence": "",
    "sourceSection": "experience",
    "sourceEntryId": "",
    "confidence": 0,
    "jobRelevanceScore": 0,
    "reason": ""
  },
  "education": [
    {
      "sourceEntryId": "",
      "sourceEvidence": "",
      "confidence": 0,
      "jobRelevanceScore": 0,
      "reason": ""
    }
  ],
  "skills": [
    {
      "categoryId": "",
      "items": [
        {
          "text": "",
          "sourceEvidence": "",
          "sourceSection": "skills",
          "sourceEntryId": "",
          "confidence": 0,
          "jobRelevanceScore": 0,
          "reason": ""
        }
      ]
    }
  ],
  "experience": [
    {
      "sourceEntryId": "",
      "bullets": [
        {
          "text": "",
          "sourceEvidence": "",
          "sourceSection": "experience",
          "sourceEntryId": "",
          "confidence": 0,
          "jobRelevanceScore": 0,
          "reason": ""
        }
      ]
    }
  ],
  "projects": [
    {
      "sourceEntryId": "",
      "bullets": [
        {
          "text": "",
          "sourceEvidence": "",
          "sourceSection": "projects",
          "sourceEntryId": "",
          "confidence": 0,
          "jobRelevanceScore": 0,
          "reason": ""
        }
      ]
    }
  ],
  "analysis": {
    "matchedJobKeywords": [],
    "notes": []
  }
}

Job description:
${source.jobDescriptionText}

Base resume text:
${source.baseResumeText}

Structured base resume source data:
${JSON.stringify(sourcePayload)}`
}

export function buildTailoringRepairPrompt(params: {
  source: BaseResumeSource
  invalidJson: string
  errors: string[]
}) {
  return `Repair the invalid tailored resume JSON.

Keep these rules:
- Use only supported information from the base resume.
- Preserve sourceEntryId links to provided source ids.
- Every bullet or skill item must keep sourceEvidence, confidence, jobRelevanceScore, and reason.
- Remove unsupported or weakly grounded content instead of inventing support.
- Output valid JSON only.

Validation errors:
${params.errors.map((error) => `- ${error}`).join("\n")}

Invalid JSON:
${params.invalidJson}

Job description:
${params.source.jobDescriptionText}

Base resume source data:
${JSON.stringify({
  basics: params.source.basics,
  education: params.source.education,
  skills: params.source.skills,
  experience: params.source.experience,
  projects: params.source.projects,
})}`
}
