import { resumeLayoutConfig } from "@/lib/resumeLayoutConfig"
import { normalizeBulletText } from "@/lib/resumeBullets"
import type { BaseResumeSource } from "@/lib/baseResumeSource"
import type {
  TailoredBullet,
  TailoredResumeDraft,
  TailoredSkillCategory,
  TailoredSkillItem,
} from "@/lib/resumeTailoringSchema"

export type TailoringValidationResult = {
  value: TailoredResumeDraft
  errors: string[]
  retryableErrors: string[]
  droppedBulletCount: number
  survivingBulletCount: number
}

export type EvidenceMatchKind = "exact" | "fuzzy" | "invalid"

function sanitizeText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function normalizeComparable(text: string) {
  return sanitizeText(text)
    .toLowerCase()
    .replace(/[^\w.+# ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
])

function tokens(text: string) {
  return normalizeComparable(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

function tokenOverlapRatio(left: string, right: string) {
  const leftTokens = new Set(tokens(left))
  const rightTokens = new Set(tokens(right))
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0

  let overlap = 0
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) overlap += 1
  })

  return overlap / leftTokens.size
}

function punctuationInsensitive(text: string) {
  return text.replace(/[^\w\s.+#]/g, " ").replace(/\s+/g, " ").trim().toLowerCase()
}

function extractNamedTerms(text: string) {
  const matches = text.match(/\b(?:[A-Z]{2,}|[A-Za-z]+\.[A-Za-z0-9]+|[A-Za-z]+\+\+|C#|TypeScript|JavaScript|Node\.js|Next\.js|React|AWS|GCP|SQL|PostgreSQL|MongoDB|Redis)\b/g)
  return new Set((matches ?? []).map((match) => match.trim()))
}

function numbersIn(text: string) {
  return new Set((text.match(/\b\d+(?:\.\d+)?%?\b/g) ?? []).map((match) => match.trim()))
}

function sourceMaps(source: BaseResumeSource) {
  return {
    education: new Map(source.education.map((entry) => [entry.id, entry])),
    skills: new Map(source.skills.map((entry) => [entry.id, entry])),
    experience: new Map(source.experience.map((entry) => [entry.id, entry])),
    projects: new Map(source.projects.map((entry) => [entry.id, entry])),
  }
}

function logEvidenceDebug(payload: Record<string, string>) {
  if (process.env.NODE_ENV !== "development") return
  console.info("[tailoring-validation]", payload)
}

function validateEvidencePresence(
  bullet: Pick<TailoredBullet, "text" | "sourceEvidence" | "sourceSection" | "sourceEntryId">,
  source: BaseResumeSource
):
  | {
      ok: true
      matchKind: EvidenceMatchKind
      strategy: string
      sourceEntry: { sourceText: string }
    }
  | {
      ok: false
      matchKind: EvidenceMatchKind
      strategy: string
      reason: string
    } {
  const maps = sourceMaps(source)
  const sectionMap = maps[bullet.sourceSection === "summary" ? "experience" : bullet.sourceSection]
  const sourceEntry = sectionMap.get(bullet.sourceEntryId)

  if (!sourceEntry) {
    return {
      ok: false,
      matchKind: "invalid",
      strategy: "missing-source-entry",
      reason: `missing source entry ${bullet.sourceSection}:${bullet.sourceEntryId}`,
    }
  }

  const sourceText = sourceEntry.sourceText
  const exactMatch =
    sourceText.includes(bullet.sourceEvidence) ||
    sourceText.toLowerCase().includes(bullet.sourceEvidence.toLowerCase())

  if (exactMatch) {
    return {
      ok: true,
      matchKind: "exact",
      strategy: "substring",
      sourceEntry,
    }
  }

  const normalizedSource = normalizeComparable(sourceText)
  const normalizedEvidence = normalizeComparable(bullet.sourceEvidence)
  if (normalizedEvidence && normalizedSource.includes(normalizedEvidence)) {
    return {
      ok: true,
      matchKind: "exact",
      strategy: "normalized-substring",
      sourceEntry,
    }
  }

  const punctuationSource = punctuationInsensitive(sourceText)
  const punctuationEvidence = punctuationInsensitive(bullet.sourceEvidence)
  if (punctuationEvidence && punctuationSource.includes(punctuationEvidence)) {
    return {
      ok: true,
      matchKind: "fuzzy",
      strategy: "punctuation-insensitive-substring",
      sourceEntry,
    }
  }

  const overlap = Math.max(
    tokenOverlapRatio(bullet.sourceEvidence, sourceText),
    tokenOverlapRatio(bullet.text, sourceText),
    tokenOverlapRatio(bullet.sourceEvidence, bullet.text)
  )
  if (overlap >= 0.4) {
    return {
      ok: true,
      matchKind: "fuzzy",
      strategy: `token-overlap:${overlap.toFixed(2)}`,
      sourceEntry,
    }
  }

  logEvidenceDebug({
    sourceEntryId: bullet.sourceEntryId,
    sourceEvidence: bullet.sourceEvidence,
    sourceEntryText: sourceText,
    strategy: `failed token-overlap:${overlap.toFixed(2)}`,
  })

  return {
    ok: false,
    matchKind: "invalid",
    strategy: `token-overlap:${overlap.toFixed(2)}`,
    reason: `evidence does not match base resume for ${bullet.sourceSection}:${bullet.sourceEntryId}`,
  }
}

function hasUnsupportedNamedTerms(
  text: string,
  evidence: string,
  allowedNamedTerms: string[]
) {
  const allowed = new Set(allowedNamedTerms.map((term) => term.toLowerCase()))
  const evidenceTerms = extractNamedTerms(evidence)
  const textTerms = extractNamedTerms(text)

  for (const term of textTerms) {
    const lower = term.toLowerCase()
    if (allowed.has(lower) || [...evidenceTerms].some((item) => item.toLowerCase() === lower)) continue
    return term
  }

  return null
}

function hasUnsupportedNumbers(text: string, evidence: string) {
  const evidenceNumbers = numbersIn(evidence)
  for (const value of numbersIn(text)) {
    if (!evidenceNumbers.has(value)) return value
  }
  return null
}

function normalizeBullet(
  bullet: TailoredBullet,
  options: {
    maxCharacters: number
  }
) {
  return {
    ...bullet,
    text: normalizeBulletText(bullet.text, {
      maxCharacters: options.maxCharacters,
      deterministicShorten: true,
    }),
    sourceEvidence: sanitizeText(bullet.sourceEvidence),
    reason: sanitizeText(bullet.reason),
    confidence: Math.max(0, Math.min(1, Number(bullet.confidence.toFixed(3)))),
    jobRelevanceScore: Math.max(0, Math.min(100, Math.round(bullet.jobRelevanceScore))),
  }
}

function dedupeBullets<T extends { text: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = normalizeComparable(item.text)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dedupeBySourceEntryId<T extends { sourceEntryId: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = sanitizeText(item.sourceEntryId)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function validateBullet(
  bullet: TailoredBullet,
  source: BaseResumeSource,
  errors: string[],
  retryableErrors: string[]
): EvidenceMatchKind {
  if (!bullet.text) {
    errors.push("bullet text is missing")
    return "invalid"
  }

  if (!bullet.sourceEvidence) {
    retryableErrors.push(`missing evidence for bullet "${bullet.text}"`)
    return "invalid"
  }

  const evidenceCheck = validateEvidencePresence(bullet, source)
  if (!evidenceCheck.ok) {
    retryableErrors.push(evidenceCheck.reason)
    return "invalid"
  }

  const unsupportedNamedTerm = hasUnsupportedNamedTerms(
    bullet.text,
    bullet.sourceEvidence,
    source.allowedNamedTerms
  )
  if (unsupportedNamedTerm) {
    retryableErrors.push(`unsupported named term "${unsupportedNamedTerm}" in bullet "${bullet.text}"`)
    return "invalid"
  }

  const unsupportedNumber = hasUnsupportedNumbers(bullet.text, bullet.sourceEvidence)
  if (unsupportedNumber) {
    retryableErrors.push(`unsupported number "${unsupportedNumber}" in bullet "${bullet.text}"`)
    return "invalid"
  }

  const overlap = Math.max(
    tokenOverlapRatio(bullet.text, bullet.sourceEvidence),
    tokenOverlapRatio(bullet.text, evidenceCheck.sourceEntry.sourceText)
  )
  if (overlap < 0.2) {
    retryableErrors.push(`weak grounding for bullet "${bullet.text}"`)
    return "invalid"
  }

  return evidenceCheck.matchKind
}

function validateSkillItem(
  item: TailoredSkillItem,
  source: BaseResumeSource,
  errors: string[],
  retryableErrors: string[]
) {
  return validateBullet(
    {
      ...item,
      sourceSection: item.sourceSection,
    },
    source,
    errors,
    retryableErrors
  )
}

function normalizeSkillCategory(category: TailoredSkillCategory) {
  return {
    ...category,
    categoryId: sanitizeText(category.categoryId),
    items: dedupeBullets(
      category.items.map((item) => ({
        ...item,
        text: sanitizeText(item.text),
        sourceEvidence: sanitizeText(item.sourceEvidence),
        reason: sanitizeText(item.reason),
      }))
    ),
  }
}

export function validateAndRepairTailoredResumeDraft(
  draft: TailoredResumeDraft,
  source: BaseResumeSource
): TailoringValidationResult {
  const errors: string[] = []
  const retryableErrors: string[] = []
  const experienceBulletLimit = resumeLayoutConfig.limits.experience.maxBulletsPerEntry
  const projectBulletLimit = resumeLayoutConfig.limits.projects.maxBulletsPerEntry
  let droppedBulletCount = 0

  const repaired: TailoredResumeDraft = {
    ...draft,
    basics: {
      fullName: source.basics.fullName,
      email: source.basics.email,
      phone: source.basics.phone,
      location: source.basics.location,
      linkedIn: source.basics.linkedIn,
      github: source.basics.github,
    },
    summary:
      draft.summary && draft.summary.text && draft.summary.sourceEvidence
        ? {
            ...draft.summary,
            text: sanitizeText(draft.summary.text),
            sourceEvidence: sanitizeText(draft.summary.sourceEvidence),
            reason: sanitizeText(draft.summary.reason),
          }
        : null,
    education: dedupeBySourceEntryId(
      draft.education.map((entry) => ({
        ...entry,
        sourceEntryId: sanitizeText(entry.sourceEntryId),
        sourceEvidence: sanitizeText(entry.sourceEvidence),
        reason: sanitizeText(entry.reason),
      }))
    ),
    skills: draft.skills.map(normalizeSkillCategory),
    experience: draft.experience.map((entry) => ({
      ...entry,
      sourceEntryId: sanitizeText(entry.sourceEntryId),
      bullets: dedupeBullets(
        entry.bullets
          .map((bullet) =>
            normalizeBullet(bullet, {
              maxCharacters: resumeLayoutConfig.limits.experience.maxCharactersPerBullet,
            })
          )
          .slice(0, experienceBulletLimit)
      ),
    })),
    projects: draft.projects.map((entry) => ({
      ...entry,
      sourceEntryId: sanitizeText(entry.sourceEntryId),
      bullets: dedupeBullets(
        entry.bullets
          .map((bullet) =>
            normalizeBullet(bullet, {
              maxCharacters: resumeLayoutConfig.limits.projects.maxCharactersPerBullet,
            })
          )
          .slice(0, projectBulletLimit)
      ),
    })),
    analysis: {
      matchedJobKeywords: [...new Set(draft.analysis.matchedJobKeywords.map(sanitizeText).filter(Boolean))],
      notes: [...new Set(draft.analysis.notes.map(sanitizeText).filter(Boolean))],
    },
  }

  if (repaired.summary) {
    const summaryBullet: TailoredBullet = {
      ...repaired.summary,
      sourceSection: repaired.summary.sourceSection,
    }
    if (validateBullet(summaryBullet, source, errors, retryableErrors) === "invalid") {
      repaired.summary = null
      droppedBulletCount += 1
    }
  }

  repaired.education = repaired.education.filter((entry) => {
    const check = validateEvidencePresence(
      {
        text: entry.reason || entry.sourceEvidence,
        sourceEvidence: entry.sourceEvidence,
        sourceSection: "education",
        sourceEntryId: entry.sourceEntryId,
      },
      source
    )
    if (!entry.sourceEntryId) {
      retryableErrors.push("education item missing sourceEntryId")
      return false
    }
    if (!entry.sourceEvidence) {
      retryableErrors.push(`education item ${entry.sourceEntryId} missing evidence`)
      return false
    }
    if (!check.ok) {
      retryableErrors.push(check.reason)
      return false
    }
    return true
  })

  repaired.skills = repaired.skills
    .filter((category) => category.categoryId)
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        const result = validateSkillItem(item, source, errors, retryableErrors)
        if (result === "invalid") droppedBulletCount += 1
        return result !== "invalid"
      }),
    }))
    .filter((category) => category.items.length > 0)

  repaired.experience = repaired.experience
    .filter((entry) => entry.sourceEntryId)
    .map((entry) => ({
      ...entry,
      bullets: entry.bullets.filter((bullet) => {
        const result = validateBullet(bullet, source, errors, retryableErrors)
        if (result === "invalid") droppedBulletCount += 1
        return result !== "invalid"
      }),
    }))
    .filter((entry) => entry.bullets.length > 0)

  repaired.projects = repaired.projects
    .filter((entry) => entry.sourceEntryId)
    .map((entry) => ({
      ...entry,
      bullets: entry.bullets.filter((bullet) => {
        const result = validateBullet(bullet, source, errors, retryableErrors)
        if (result === "invalid") droppedBulletCount += 1
        return result !== "invalid"
      }),
    }))
    .filter((entry) => entry.bullets.length > 0)

  const survivingBulletCount =
    repaired.experience.reduce((total, entry) => total + entry.bullets.length, 0) +
    repaired.projects.reduce((total, entry) => total + entry.bullets.length, 0) +
    repaired.skills.reduce((total, category) => total + category.items.length, 0) +
    (repaired.summary ? 1 : 0)

  return {
    value: repaired,
    errors,
    retryableErrors,
    droppedBulletCount,
    survivingBulletCount,
  }
}
