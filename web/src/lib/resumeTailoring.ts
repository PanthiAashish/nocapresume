import { resumeLayoutConfig, createDefaultStructuredResumeLimits } from "@/lib/resumeLayoutConfig"
import { normalizeBulletText } from "@/lib/resumeBullets"
import { buildBaseResumeSource, type BaseResumeSource } from "@/lib/baseResumeSource"
import {
  buildJobDescriptionProfile,
  matchedTermsForText,
  maybeRewriteBulletForJob,
  scoreMlCompanyContext,
  scoreTextForJob,
} from "@/lib/resumeJobRelevance"
import { normalizeSkillCategoriesForRendering } from "@/lib/resumeSkills"
import { buildTailoringPrompt, buildTailoringRepairPrompt } from "@/lib/resumeTailoringPrompt"
import {
  normalizeTailoredResumeDraft,
  type TailoredBullet,
  type TailoredResumeDraft,
} from "@/lib/resumeTailoringSchema"
import { validateAndRepairTailoredResumeDraft } from "@/lib/resumeTailoringValidation"
import type { StructuredResume } from "@/lib/resumeSchema"
import type { ProfileData } from "@/lib/profile"

const DEFAULT_MODEL = process.env.OPENAI_RESUME_TAILOR_MODEL || "gpt-4.1-mini"

type TailoringAuditBullet = {
  sourceEntryId: string
  sourceSection: string
  sourceEvidence: string
  originalText?: string
  tailoredText: string
  reason: string
  confidence: number
  jobRelevanceScore: number
  matchedTerms: string[]
  groundingStrength: "exact" | "fuzzy" | "base"
}

export type TailoredResumeAudit = {
  summary: TailoredResumeDraft["summary"]
  education: Array<{
    sourceEntryId: string
    sourceEvidence: string
    reason: string
    confidence: number
    jobRelevanceScore: number
  }>
  skills: Array<{
    categoryId: string
    text: string
    sourceEvidence: string
    reason: string
    confidence: number
    jobRelevanceScore: number
  }>
  experience: TailoringAuditBullet[]
  projects: TailoringAuditBullet[]
  matchedJobKeywords: string[]
  notes: string[]
}

export type TailoringResult = {
  source: BaseResumeSource
  tailoredDraft: TailoredResumeDraft
  finalResume: StructuredResume
  audit: TailoredResumeAudit
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

function buildSourceMaps(source: BaseResumeSource) {
  return {
    education: new Map(source.education.map((entry) => [entry.id, entry])),
    skills: new Map(source.skills.map((entry) => [entry.id, entry])),
    experience: new Map(source.experience.map((entry) => [entry.id, entry])),
    projects: new Map(source.projects.map((entry) => [entry.id, entry])),
  }
}

function normalizeComparable(text: string) {
  return text.toLowerCase().replace(/[^\w.+# ]+/g, " ").replace(/\s+/g, " ").trim()
}

function uniqueBy<T>(items: T[], toKey: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = toKey(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sectionWeight(section: "education" | "skills" | "experience" | "projects") {
  switch (section) {
    case "experience":
      return 400
    case "projects":
      return 250
    case "skills":
      return 150
    case "education":
      return 100
  }
}

function itemScore(
  section: "education" | "skills" | "experience" | "projects",
  jobRelevanceScore: number,
  confidence: number
) {
  return sectionWeight(section) + jobRelevanceScore * 2 + confidence * 25
}

function sortBullets<T extends TailoredBullet>(items: T[]) {
  return [...items].sort((left, right) => {
    const scoreDelta =
      itemScore("experience", right.jobRelevanceScore, right.confidence) -
      itemScore("experience", left.jobRelevanceScore, left.confidence)
    if (scoreDelta !== 0) return scoreDelta
    return left.text.localeCompare(right.text)
  })
}

function selectSkillLabel(categoryItems: string[], text: string, sourceEvidence: string) {
  const normalizedText = normalizeComparable(text)
  const normalizedEvidence = normalizeComparable(sourceEvidence)
  return (
    categoryItems.find((item) => normalizeComparable(item) === normalizedText) ??
    categoryItems.find((item) => normalizedText.includes(normalizeComparable(item))) ??
    categoryItems.find((item) => normalizedEvidence.includes(normalizeComparable(item))) ??
    null
  )
}

function buildFallbackSkillCategories(source: BaseResumeSource) {
  return normalizeSkillCategoriesForRendering(
    source.skills
    .slice(0, resumeLayoutConfig.limits.skills.maxEntries)
    .map((category) => ({
      id: category.id,
      label: category.label,
      items: category.items
        .slice(0, resumeLayoutConfig.limits.skills.maxItemsPerCategory)
        .map((label, index) => ({
          label,
          priority: {
            relevanceScore: Math.max(1, category.items.length - index),
            originalIndex: index,
          },
        })),
      priority: { relevanceScore: 1, originalIndex: category.sortOrder },
    })),
    source.jobDescriptionText
  )
}

function buildFallbackExperience(source: BaseResumeSource) {
  return source.experience
    .slice(0, resumeLayoutConfig.limits.experience.maxEntries)
    .map((entry) => ({
      id: entry.id,
      company: entry.company,
      title: entry.title,
      employmentType: entry.employmentType || undefined,
      location: entry.location,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      bullets: entry.bullets.slice(0, resumeLayoutConfig.limits.experience.compressedBulletsPerEntry),
      priority: { relevanceScore: 1, originalIndex: entry.sortOrder },
    }))
}

function buildFallbackProjects(source: BaseResumeSource) {
  return source.projects
    .slice(0, resumeLayoutConfig.limits.projects.maxEntries)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      role: entry.role || undefined,
      technologies: entry.technologies,
      githubUrl: entry.githubUrl || undefined,
      liveUrl: entry.liveUrl || undefined,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      bullets: entry.bullets.slice(0, resumeLayoutConfig.limits.projects.maxBulletsPerEntry),
      priority: { relevanceScore: 1, originalIndex: entry.sortOrder },
    }))
}

export function buildFinalResumeFromTailoredDraft(
  source: BaseResumeSource,
  tailoredDraft: TailoredResumeDraft
): { resume: StructuredResume; audit: TailoredResumeAudit } {
  const defaults = createDefaultStructuredResumeLimits()
  const maps = buildSourceMaps(source)
  const jobProfile = buildJobDescriptionProfile(source.jobDescriptionText)

  const selectedEducation = tailoredDraft.education
    .map((entry) => ({
      entry,
      source: maps.education.get(entry.sourceEntryId),
      score: itemScore("education", entry.jobRelevanceScore, entry.confidence),
    }))
    .filter((item): item is { entry: TailoredResumeDraft["education"][number]; source: NonNullable<(typeof item)["source"]>; score: number } => Boolean(item.source))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.source.sortOrder - right.source.sortOrder
    })
    .slice(0, resumeLayoutConfig.limits.education.maxEntries)
    .map(({ source }) => ({
      id: source.id,
      school: source.school,
      college: source.college,
      degree: source.degree,
      fieldOfStudy: source.fieldOfStudy,
      minor: source.minor || undefined,
      schoolYear: undefined,
      startMonth: source.startMonth,
      startYear: source.startYear,
      endMonth: source.endMonth,
      endYear: source.endYear,
      currentlyAttending: source.currentlyAttending,
      gpa: source.gpa || undefined,
      departmentGpa: source.departmentGpa || undefined,
      coursework: [],
      priority: { relevanceScore: 1, originalIndex: source.sortOrder },
    }))

  const selectedSkills = tailoredDraft.skills
    .map((category) => {
      const sourceCategory = maps.skills.get(category.categoryId)
      if (!sourceCategory) return null

      const items = uniqueBy(
        category.items
          .map((item) => ({
            label: selectSkillLabel(sourceCategory.items, item.text, item.sourceEvidence),
            raw: item,
          }))
          .filter((item): item is { label: string; raw: TailoredResumeDraft["skills"][number]["items"][number] } => Boolean(item.label))
          .sort((left, right) => {
            const scoreDelta =
              itemScore("skills", right.raw.jobRelevanceScore, right.raw.confidence) -
              itemScore("skills", left.raw.jobRelevanceScore, left.raw.confidence)
            if (scoreDelta !== 0) return scoreDelta
            return sourceCategory.items.indexOf(left.label) - sourceCategory.items.indexOf(right.label)
          }),
        (item) => normalizeComparable(item.label)
      )
        .slice(0, resumeLayoutConfig.limits.skills.maxItemsPerCategory)
        .map((item, index) => ({
          label: item.label,
          priority: {
            relevanceScore: item.raw.jobRelevanceScore,
            originalIndex: index,
          },
        }))

      if (items.length === 0) return null

      return {
        id: sourceCategory.id,
        label: sourceCategory.label,
        items,
        priority: { relevanceScore: items[0]?.priority?.relevanceScore ?? 0, originalIndex: sourceCategory.sortOrder },
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const normalizedSkills = normalizeSkillCategoriesForRendering(
    selectedSkills,
    source.jobDescriptionText
  )

  const selectedExperience = tailoredDraft.experience
    .map((entry) => {
      const sourceEntry = maps.experience.get(entry.sourceEntryId)
      if (!sourceEntry) return null

      const bullets = sortBullets(
        entry.bullets.map((bullet) => {
          const deterministicScore =
            scoreTextForJob(`${bullet.text} ${sourceEntry.sourceText}`, jobProfile) +
            (jobProfile.mlFocused
              ? scoreTextForJob(sourceEntry.company, jobProfile) +
                scoreMlCompanyContext(sourceEntry.sourceText, jobProfile)
              : 0)
          const rewritten = maybeRewriteBulletForJob({
            text: bullet.text,
            sourceText: sourceEntry.sourceText,
            profile: jobProfile,
          })

          return {
            ...bullet,
            originalText: bullet.text,
            text: rewritten.text,
            jobRelevanceScore: bullet.jobRelevanceScore + deterministicScore,
            matchedTerms: rewritten.matchedTerms,
            groundingStrength: bullet.confidence >= 0.85 ? "exact" as const : "fuzzy" as const,
          }
        })
      )
        .slice(0, resumeLayoutConfig.limits.experience.maxBulletsPerEntry)
        .map((bullet) => ({
          ...bullet,
          text: normalizeBulletText(bullet.text, {
            maxCharacters: resumeLayoutConfig.limits.experience.maxCharactersPerBullet,
            deterministicShorten: true,
          }),
        }))
        .filter((bullet) => bullet.text)

      if (bullets.length === 0) return null

      const averageScore =
        entry.bullets.reduce((total, bullet) => total + bullet.jobRelevanceScore, 0) /
        entry.bullets.length
      const averageConfidence =
        entry.bullets.reduce((total, bullet) => total + bullet.confidence, 0) / entry.bullets.length

      return {
        sourceEntry,
        bullets,
        score:
          itemScore("experience", averageScore, averageConfidence) +
          scoreTextForJob(sourceEntry.sourceText, jobProfile) +
          scoreMlCompanyContext(sourceEntry.sourceText, jobProfile),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.sourceEntry.sortOrder - right.sourceEntry.sortOrder
    })
    .slice(0, resumeLayoutConfig.limits.experience.maxEntries)
    .map(({ sourceEntry, bullets, score }) => ({
      id: sourceEntry.id,
      company: sourceEntry.company,
      title: sourceEntry.title,
      employmentType: sourceEntry.employmentType || undefined,
      location: sourceEntry.location,
      startMonth: sourceEntry.startMonth,
      startYear: sourceEntry.startYear,
      endMonth: sourceEntry.endMonth,
      endYear: sourceEntry.endYear,
      currentlyWorking: sourceEntry.currentlyWorking,
      bullets: bullets.map((bullet) => bullet.text),
      priority: { relevanceScore: Math.round(score), originalIndex: sourceEntry.sortOrder },
    }))

  const selectedProjects = tailoredDraft.projects
    .map((entry) => {
      const sourceEntry = maps.projects.get(entry.sourceEntryId)
      if (!sourceEntry) return null

      const bullets = sortBullets(
        entry.bullets.map((bullet) => {
          const deterministicScore = scoreTextForJob(
            `${bullet.text} ${sourceEntry.sourceText}`,
            jobProfile
          ) + scoreMlCompanyContext(sourceEntry.sourceText, jobProfile)
          const rewritten = maybeRewriteBulletForJob({
            text: bullet.text,
            sourceText: sourceEntry.sourceText,
            profile: jobProfile,
          })

          return {
            ...bullet,
            originalText: bullet.text,
            text: rewritten.text,
            jobRelevanceScore: bullet.jobRelevanceScore + deterministicScore,
            matchedTerms: rewritten.matchedTerms,
            groundingStrength: bullet.confidence >= 0.85 ? "exact" as const : "fuzzy" as const,
          }
        })
      )
        .slice(0, resumeLayoutConfig.limits.projects.maxBulletsPerEntry)
        .map((bullet) => ({
          ...bullet,
          text: normalizeBulletText(bullet.text, {
            maxCharacters: resumeLayoutConfig.limits.projects.maxCharactersPerBullet,
            deterministicShorten: true,
          }),
        }))
        .filter((bullet) => bullet.text)

      if (bullets.length === 0) return null

      const averageScore =
        entry.bullets.reduce((total, bullet) => total + bullet.jobRelevanceScore, 0) /
        entry.bullets.length
      const averageConfidence =
        entry.bullets.reduce((total, bullet) => total + bullet.confidence, 0) / entry.bullets.length

      return {
        sourceEntry,
        bullets,
        score:
          itemScore("projects", averageScore, averageConfidence) +
          scoreTextForJob(sourceEntry.sourceText, jobProfile) +
          scoreMlCompanyContext(sourceEntry.sourceText, jobProfile),
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.sourceEntry.sortOrder - right.sourceEntry.sortOrder
    })
    .slice(0, resumeLayoutConfig.limits.projects.maxEntries)
    .map(({ sourceEntry, bullets, score }) => ({
      id: sourceEntry.id,
      name: sourceEntry.name,
      role: sourceEntry.role || undefined,
      technologies: sourceEntry.technologies,
      githubUrl: sourceEntry.githubUrl || undefined,
      liveUrl: sourceEntry.liveUrl || undefined,
      startMonth: sourceEntry.startMonth,
      startYear: sourceEntry.startYear,
      endMonth: sourceEntry.endMonth,
      endYear: sourceEntry.endYear,
      currentlyWorking: sourceEntry.currentlyWorking,
      bullets: bullets.map((bullet) => bullet.text),
      priority: { relevanceScore: Math.round(score), originalIndex: sourceEntry.sortOrder },
    }))

  return {
    resume: {
      basics: source.basics,
      education: {
        ...defaults.education,
        entries: selectedEducation.length ? selectedEducation : source.education.slice(0, 1).map((entry) => ({
          id: entry.id,
          school: entry.school,
          college: entry.college,
          degree: entry.degree,
          fieldOfStudy: entry.fieldOfStudy,
          minor: entry.minor || undefined,
          schoolYear: undefined,
          startMonth: entry.startMonth,
          startYear: entry.startYear,
          endMonth: entry.endMonth,
          endYear: entry.endYear,
          currentlyAttending: entry.currentlyAttending,
          gpa: entry.gpa || undefined,
          departmentGpa: entry.departmentGpa || undefined,
          coursework: [],
          priority: { relevanceScore: 1, originalIndex: entry.sortOrder },
        })),
      },
      skills: {
        ...defaults.skills,
        categories: normalizedSkills.length ? normalizedSkills : buildFallbackSkillCategories(source),
      },
      experience: {
        ...defaults.experience,
        entries: selectedExperience.length ? selectedExperience : buildFallbackExperience(source),
      },
      projects: {
        ...defaults.projects,
        entries: selectedProjects.length ? selectedProjects : buildFallbackProjects(source),
      },
    },
    audit: {
      summary: tailoredDraft.summary,
      education: tailoredDraft.education.map((entry) => ({
        sourceEntryId: entry.sourceEntryId,
        sourceEvidence: entry.sourceEvidence,
        reason: entry.reason,
        confidence: entry.confidence,
        jobRelevanceScore: entry.jobRelevanceScore,
      })),
      skills: tailoredDraft.skills.flatMap((category) =>
        category.items.map((item) => ({
          categoryId: category.categoryId,
          text: item.text,
          sourceEvidence: item.sourceEvidence,
          reason: item.reason,
          confidence: item.confidence,
          jobRelevanceScore: item.jobRelevanceScore,
        }))
      ),
      experience: tailoredDraft.experience.flatMap((entry) =>
        entry.bullets.map((bullet) => ({
          sourceEntryId: entry.sourceEntryId,
          sourceSection: bullet.sourceSection,
          sourceEvidence: bullet.sourceEvidence,
          originalText: bullet.text,
          tailoredText: bullet.text,
          reason: bullet.reason,
          confidence: bullet.confidence,
          jobRelevanceScore: bullet.jobRelevanceScore,
          matchedTerms: matchedTermsForText(`${bullet.text} ${bullet.sourceEvidence}`, jobProfile),
          groundingStrength: bullet.confidence >= 0.85 ? "exact" : "fuzzy",
        }))
      ),
      projects: tailoredDraft.projects.flatMap((entry) =>
        entry.bullets.map((bullet) => ({
          sourceEntryId: entry.sourceEntryId,
          sourceSection: bullet.sourceSection,
          sourceEvidence: bullet.sourceEvidence,
          originalText: bullet.text,
          tailoredText: bullet.text,
          reason: bullet.reason,
          confidence: bullet.confidence,
          jobRelevanceScore: bullet.jobRelevanceScore,
          matchedTerms: matchedTermsForText(`${bullet.text} ${bullet.sourceEvidence}`, jobProfile),
          groundingStrength: bullet.confidence >= 0.85 ? "exact" : "fuzzy",
        }))
      ),
      matchedJobKeywords: tailoredDraft.analysis.matchedJobKeywords,
      notes: tailoredDraft.analysis.notes,
    },
  }
}

export async function tailorResumeFromProfile(input: {
  jobDescriptionText: string
  baseResumeText?: string | null
  profile: ProfileData
}) : Promise<TailoringResult> {
  const source = buildBaseResumeSource(input)
  const prompt = buildTailoringPrompt(source)
  const rawResponse = await requestJsonFromOpenAi(prompt)
  let parsed = normalizeTailoredResumeDraft(JSON.parse(rawResponse))
  let validation = validateAndRepairTailoredResumeDraft(parsed, source)

  if (validation.retryableErrors.length > 0 && validation.survivingBulletCount < 4) {
    const repairPrompt = buildTailoringRepairPrompt({
      source,
      invalidJson: rawResponse,
      errors: validation.retryableErrors,
    })
    const repairedResponse = await requestJsonFromOpenAi(repairPrompt)
    parsed = normalizeTailoredResumeDraft(JSON.parse(repairedResponse))
    validation = validateAndRepairTailoredResumeDraft(parsed, source)
  }

  if (validation.survivingBulletCount < 2) {
    throw new Error(`resume_tailoring_validation_failed:${validation.retryableErrors.join(" | ")}`)
  }

  const selected = buildFinalResumeFromTailoredDraft(source, validation.value)

  return {
    source,
    tailoredDraft: validation.value,
    finalResume: selected.resume,
    audit: selected.audit,
  }
}
