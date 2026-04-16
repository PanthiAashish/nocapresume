import type { EnhancementReport } from "@/lib/enhancementReport"
import type { StructuredResume } from "@/lib/resumeSchema"

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

export type LlmTailoringPayload = {
  finalResume: StructuredResume
  enhancementReport: EnhancementReport
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : []
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false
}

function asCoverage(value: unknown): "covered" | "enhanced" | "gap" {
  const text = asString(value)
  return text === "covered" || text === "enhanced" || text === "gap" ? text : "gap"
}

function asDifficulty(value: unknown): "easy" | "medium" | "hard" {
  const text = asString(value)
  return text === "easy" || text === "medium" || text === "hard" ? text : "medium"
}

function asSection(
  value: unknown
): "experience" | "projects" | "skills" | "summary" | "education" {
  const text = asString(value)
  return text === "experience" ||
    text === "projects" ||
    text === "skills" ||
    text === "summary" ||
    text === "education"
    ? text
    : "experience"
}

function normalizeResume(value: unknown, fallbackBasics: StructuredResume["basics"]): StructuredResume {
  const record = asRecord(value)
  const basics = asRecord(record.basics)
  const education = asRecord(record.education)
  const skills = asRecord(record.skills)
  const experience = asRecord(record.experience)
  const projects = asRecord(record.projects)

  return {
    basics: {
      fullName: asString(basics.fullName) || fallbackBasics.fullName,
      email: asString(basics.email) || fallbackBasics.email,
      phone: asString(basics.phone) || fallbackBasics.phone,
      location: asString(basics.location) || fallbackBasics.location,
      linkedIn: asString(basics.linkedIn) || fallbackBasics.linkedIn,
      github: asString(basics.github) || fallbackBasics.github,
    },
    education: {
      limits: {
        maxEntries: 1,
      },
      entries: Array.isArray(education.entries)
        ? education.entries.map((entry, index) => {
            const item = asRecord(entry)
            return {
              id: asString(item.id) || `education-${index + 1}`,
              school: asString(item.school),
              college: asString(item.college),
              degree: asString(item.degree),
              fieldOfStudy: asString(item.fieldOfStudy),
              minor: asString(item.minor) || undefined,
              schoolYear: asString(item.schoolYear) || undefined,
              startMonth: asString(item.startMonth),
              startYear: asString(item.startYear),
              endMonth: asString(item.endMonth),
              endYear: asString(item.endYear),
              currentlyAttending: asBoolean(item.currentlyAttending),
              gpa: asString(item.gpa) || undefined,
              departmentGpa: asString(item.departmentGpa) || undefined,
              coursework: asStringArray(item.coursework),
              priority: undefined,
              estimatedLineCount: undefined,
            }
          })
        : [],
    },
    skills: {
      limits: {
        maxEntries: 6,
        maxItemsPerCategory: 6,
        maxTotalItems: 18,
      },
      categories: Array.isArray(skills.categories)
        ? skills.categories.map((category, index) => {
            const item = asRecord(category)
            return {
              id: asString(item.id) || `skill-category-${index + 1}`,
              label: asString(item.label),
              items: Array.isArray(item.items)
                ? item.items.map((skill, skillIndex) => {
                    const skillItem = asRecord(skill)
                    return {
                      label: asString(skillItem.label) || `Skill ${skillIndex + 1}`,
                      priority: undefined,
                    }
                  })
                : [],
              priority: undefined,
              estimatedLineCount: undefined,
            }
          })
        : [],
    },
    experience: {
      limits: {
        maxEntries: 4,
        maxBulletsPerEntry: 4,
        maxCharactersPerBullet: 180,
      },
      entries: Array.isArray(experience.entries)
        ? experience.entries.map((entry, index) => {
            const item = asRecord(entry)
            return {
              id: asString(item.id) || `experience-${index + 1}`,
              company: asString(item.company),
              title: asString(item.title),
              employmentType: asString(item.employmentType) || undefined,
              location: asString(item.location),
              startMonth: asString(item.startMonth),
              startYear: asString(item.startYear),
              endMonth: asString(item.endMonth),
              endYear: asString(item.endYear),
              currentlyWorking: asBoolean(item.currentlyWorking),
              bullets: asStringArray(item.bullets),
              priority: undefined,
              estimatedLineCount: undefined,
            }
          })
        : [],
    },
    projects: {
      limits: {
        maxEntries: 3,
        maxBulletsPerEntry: 3,
        maxCharactersPerBullet: 180,
      },
      entries: Array.isArray(projects.entries)
        ? projects.entries.map((entry, index) => {
            const item = asRecord(entry)
            return {
              id: asString(item.id) || `project-${index + 1}`,
              name: asString(item.name),
              role: asString(item.role) || undefined,
              technologies: asStringArray(item.technologies),
              githubUrl: asString(item.githubUrl) || undefined,
              liveUrl: asString(item.liveUrl) || undefined,
              startMonth: asString(item.startMonth),
              startYear: asString(item.startYear),
              endMonth: asString(item.endMonth),
              endYear: asString(item.endYear),
              currentlyWorking: asBoolean(item.currentlyWorking),
              bullets: asStringArray(item.bullets),
              priority: undefined,
              estimatedLineCount: undefined,
            }
          })
        : [],
    },
  }
}

function normalizeEnhancementReport(value: unknown): EnhancementReport {
  const record = asRecord(value)

  return {
    extractedRequirements: Array.isArray(record.extractedRequirements)
      ? record.extractedRequirements.map((item) => {
          const requirement = asRecord(item)
          return {
            keyword: asString(requirement.keyword),
            domain: asString(requirement.domain),
            coverage: asCoverage(requirement.coverage),
          }
        })
      : [],
    changes: Array.isArray(record.changes)
      ? record.changes.map((item, index) => {
          const change = asRecord(item)
          return {
            section: asSection(change.section),
            entryId: asString(change.entryId) || `change-${index + 1}`,
            entryLabel: asString(change.entryLabel),
            originalText: asString(change.originalText) || null,
            tailoredText: asString(change.tailoredText),
            trigger: asString(change.trigger),
            reason: asString(change.reason),
          }
        })
      : [],
    studyGuide: Array.isArray(record.studyGuide)
      ? record.studyGuide.map((item) => {
          const topic = asRecord(item)
          return {
            skill: asString(topic.skill),
            reason: asString(topic.reason),
            concepts: asStringArray(topic.concepts),
            questions: Array.isArray(topic.questions)
              ? topic.questions.map((question) => {
                  const item = asRecord(question)
                  return {
                    question: asString(item.question),
                    difficulty: asDifficulty(item.difficulty),
                  }
                })
              : [],
            resources: Array.isArray(topic.resources)
              ? topic.resources.map((resource) => {
                  const item = asRecord(resource)
                  return {
                    label: asString(item.label),
                    url: asString(item.url),
                  }
                })
              : [],
            miniProject: asString(topic.miniProject),
          }
        })
      : [],
    matchedJobKeywords: asStringArray(record.matchedJobKeywords),
    notes: asStringArray(record.notes),
  }
}

export function normalizeLlmTailoringPayload(
  value: unknown,
  fallbackBasics: StructuredResume["basics"]
): LlmTailoringPayload {
  const record = asRecord(value)

  return {
    finalResume: normalizeResume(record.finalResume, fallbackBasics),
    enhancementReport: normalizeEnhancementReport(record.enhancementReport),
  }
}
