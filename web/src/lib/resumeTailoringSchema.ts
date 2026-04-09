export type TailoredBullet = {
  text: string
  sourceEvidence: string
  sourceSection: "experience" | "projects" | "skills" | "education" | "summary"
  sourceEntryId: string
  confidence: number
  jobRelevanceScore: number
  reason: string
}

export type TailoredSummary = {
  text: string
  sourceEvidence: string
  sourceSection: "experience" | "projects" | "education" | "skills"
  sourceEntryId: string
  confidence: number
  jobRelevanceScore: number
  reason: string
} | null

export type TailoredEducationSelection = {
  sourceEntryId: string
  sourceEvidence: string
  confidence: number
  jobRelevanceScore: number
  reason: string
}

export type TailoredSkillItem = {
  text: string
  sourceEvidence: string
  sourceSection: "skills" | "experience" | "projects"
  sourceEntryId: string
  confidence: number
  jobRelevanceScore: number
  reason: string
}

export type TailoredSkillCategory = {
  categoryId: string
  items: TailoredSkillItem[]
}

export type TailoredExperienceEntry = {
  sourceEntryId: string
  bullets: TailoredBullet[]
}

export type TailoredProjectEntry = {
  sourceEntryId: string
  bullets: TailoredBullet[]
}

export type TailoredResumeDraft = {
  basics: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedIn: string
    github: string
  }
  summary: TailoredSummary
  education: TailoredEducationSelection[]
  skills: TailoredSkillCategory[]
  experience: TailoredExperienceEntry[]
  projects: TailoredProjectEntry[]
  analysis: {
    matchedJobKeywords: string[]
    notes: string[]
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function clampUnitInterval(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))))
}

function clampRelevance(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => asString(item)).filter(Boolean)
    : []
}

function parseBullet(value: unknown): TailoredBullet {
  const record = asRecord(value)

  return {
    text: asString(record.text),
    sourceEvidence: asString(record.sourceEvidence),
    sourceSection: (asString(record.sourceSection) || "experience") as TailoredBullet["sourceSection"],
    sourceEntryId: asString(record.sourceEntryId),
    confidence: clampUnitInterval(asNumber(record.confidence)),
    jobRelevanceScore: clampRelevance(asNumber(record.jobRelevanceScore)),
    reason: asString(record.reason),
  }
}

function parseSkillItem(value: unknown): TailoredSkillItem {
  const bullet = parseBullet(value)
  const sourceSection =
    bullet.sourceSection === "projects" || bullet.sourceSection === "experience"
      ? bullet.sourceSection
      : "skills"

  return {
    ...bullet,
    sourceSection,
  }
}

function parseSummary(value: unknown): TailoredSummary {
  if (value == null) return null
  const record = asRecord(value)

  return {
    text: asString(record.text),
    sourceEvidence: asString(record.sourceEvidence),
    sourceSection: (asString(record.sourceSection) || "experience") as NonNullable<
      TailoredSummary
    >["sourceSection"],
    sourceEntryId: asString(record.sourceEntryId),
    confidence: clampUnitInterval(asNumber(record.confidence)),
    jobRelevanceScore: clampRelevance(asNumber(record.jobRelevanceScore)),
    reason: asString(record.reason),
  }
}

export function normalizeTailoredResumeDraft(value: unknown): TailoredResumeDraft {
  const record = asRecord(value)
  const basics = asRecord(record.basics)

  return {
    basics: {
      fullName: asString(basics.fullName),
      email: asString(basics.email),
      phone: asString(basics.phone),
      location: asString(basics.location),
      linkedIn: asString(basics.linkedIn),
      github: asString(basics.github),
    },
    summary: parseSummary(record.summary),
    education: Array.isArray(record.education)
      ? record.education.map((item) => {
          const education = asRecord(item)
          return {
            sourceEntryId: asString(education.sourceEntryId),
            sourceEvidence: asString(education.sourceEvidence),
            confidence: clampUnitInterval(asNumber(education.confidence)),
            jobRelevanceScore: clampRelevance(asNumber(education.jobRelevanceScore)),
            reason: asString(education.reason),
          }
        })
      : [],
    skills: Array.isArray(record.skills)
      ? record.skills.map((item) => {
          const category = asRecord(item)
          return {
            categoryId: asString(category.categoryId),
            items: Array.isArray(category.items) ? category.items.map(parseSkillItem) : [],
          }
        })
      : [],
    experience: Array.isArray(record.experience)
      ? record.experience.map((item) => {
          const entry = asRecord(item)
          return {
            sourceEntryId: asString(entry.sourceEntryId),
            bullets: Array.isArray(entry.bullets) ? entry.bullets.map(parseBullet) : [],
          }
        })
      : [],
    projects: Array.isArray(record.projects)
      ? record.projects.map((item) => {
          const entry = asRecord(item)
          return {
            sourceEntryId: asString(entry.sourceEntryId),
            bullets: Array.isArray(entry.bullets) ? entry.bullets.map(parseBullet) : [],
          }
        })
      : [],
    analysis: {
      matchedJobKeywords: asStringArray(asRecord(record.analysis).matchedJobKeywords),
      notes: asStringArray(asRecord(record.analysis).notes),
    },
  }
}
