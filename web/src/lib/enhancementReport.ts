import type { StructuredResume } from "@/lib/resumeSchema"

export type EnhancementRequirement = {
  keyword: string
  domain: string
  coverage: "covered" | "enhanced" | "gap"
}

export type EnhancementChange = {
  section: "experience" | "projects" | "skills" | "summary" | "education"
  entryId: string
  entryLabel: string
  originalText: string | null
  tailoredText: string
  trigger: string
  reason: string
}

export type StudyGuideQuestion = {
  question: string
  difficulty: "easy" | "medium" | "hard"
}

export type StudyGuideResource = {
  label: string
  url: string
}

export type StudyGuideTopic = {
  skill: string
  reason: string
  concepts: string[]
  questions: StudyGuideQuestion[]
  resources: StudyGuideResource[]
  miniProject: string
}

export type EnhancementReport = {
  extractedRequirements: EnhancementRequirement[]
  changes: EnhancementChange[]
  studyGuide: StudyGuideTopic[]
  matchedJobKeywords: string[]
  notes: string[]
}

export function isStructuredResume(value: unknown): value is StructuredResume {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return Boolean(record.basics && record.education && record.skills && record.experience && record.projects)
}

export function isEnhancementReport(value: unknown): value is EnhancementReport {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    Array.isArray(record.extractedRequirements) &&
    Array.isArray(record.changes) &&
    Array.isArray(record.studyGuide) &&
    Array.isArray(record.matchedJobKeywords) &&
    Array.isArray(record.notes)
  )
}
