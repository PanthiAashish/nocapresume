import { resumeLayoutConfig, createDefaultStructuredResumeLimits } from "@/lib/resumeLayoutConfig"
import { normalizeBulletList } from "@/lib/resumeBullets"
import type {
  ResumeEducationEntry,
  ResumeExperienceEntry,
  ResumePriority,
  ResumeProjectEntry,
  ResumeSkillCategory,
  StructuredResume,
} from "@/lib/resumeSchema"
import type { ProfileData } from "@/lib/profile"

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "your",
])

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

function scoreTextAgainstJobDescription(text: string, jobDescriptionTerms: Set<string>) {
  const terms = tokenize(text)
  let score = 0
  const seen = new Set<string>()

  for (const term of terms) {
    if (jobDescriptionTerms.has(term) && !seen.has(term)) {
      score += 1
      seen.add(term)
    }
  }

  return score
}

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function priority(score: number, originalIndex: number): ResumePriority {
  return {
    relevanceScore: score,
    originalIndex,
  }
}

function estimateLineCountFromText(text: string, widthHint = 75) {
  return Math.max(1, Math.ceil(text.trim().length / widthHint))
}

function estimateLineCountFromBullets(bullets: string[], widthHint = 85) {
  return bullets.reduce((total, bullet) => total + estimateLineCountFromText(bullet, widthHint), 0)
}

function selectRelevantEntries<TInput, TOutput>(
  entries: TInput[],
  limit: number,
  toSearchText: (entry: TInput) => string,
  toStructuredEntry: (entry: TInput, meta: ResumePriority) => TOutput
) {
  return (jobDescriptionTerms: Set<string>) =>
    entries
      .map((entry, index) => ({
        entry,
        index,
        score: scoreTextAgainstJobDescription(toSearchText(entry), jobDescriptionTerms),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score
        return left.index - right.index
      })
      .slice(0, Math.min(limit, entries.length))
      .sort((left, right) => left.index - right.index)
      .map(({ entry, score, index }) => toStructuredEntry(entry, priority(score, index)))
}

function normalizeSkillItems(
  values: string,
  jobDescriptionTerms: Set<string>,
  maxItemsPerCategory: number
) {
  return splitCommaSeparated(values)
    .map((label, index) => ({
      label,
      priority: priority(scoreTextAgainstJobDescription(label, jobDescriptionTerms), index),
    }))
    .sort((left, right) => {
      const leftScore = left.priority?.relevanceScore ?? 0
      const rightScore = right.priority?.relevanceScore ?? 0
      if (rightScore !== leftScore) return rightScore - leftScore
      return (left.priority?.originalIndex ?? 0) - (right.priority?.originalIndex ?? 0)
    })
    .slice(0, maxItemsPerCategory)
    .sort((left, right) => {
      return (left.priority?.originalIndex ?? 0) - (right.priority?.originalIndex ?? 0)
    })
}

function createSkillCategory(
  id: string,
  label: string,
  values: string,
  jobDescriptionTerms: Set<string>,
  originalIndex: number
): ResumeSkillCategory | null {
  const items = normalizeSkillItems(
    values,
    jobDescriptionTerms,
    resumeLayoutConfig.limits.skills.maxItemsPerCategory
  )
  if (items.length === 0) return null

  return {
    id,
    label,
    items,
    priority: priority(
      items.reduce((total, item) => total + (item.priority?.relevanceScore ?? 0), 0),
      originalIndex
    ),
    estimatedLineCount: estimateLineCountFromText(items.map((item) => item.label).join(", "), 68),
  }
}

function trimSkillCategoriesToTotalLimit(categories: ResumeSkillCategory[]) {
  const totalLimit = resumeLayoutConfig.limits.skills.maxTotalItems
  const allItems = categories.flatMap((category) =>
    category.items.map((item, index) => ({
      categoryId: category.id,
      item,
      index,
      categoryIndex: category.priority?.originalIndex ?? 0,
      score: item.priority?.relevanceScore ?? 0,
    }))
  )

  if (allItems.length <= totalLimit) return categories

  const itemsToRemove = new Set(
    allItems
      .sort((left, right) => {
        if (left.score !== right.score) return left.score - right.score
        if (left.categoryIndex !== right.categoryIndex) return right.categoryIndex - left.categoryIndex
        return right.index - left.index
      })
      .slice(0, allItems.length - totalLimit)
      .map((item) => `${item.categoryId}:${item.index}`)
  )

  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((_, index) => !itemsToRemove.has(`${category.id}:${index}`)),
    }))
    .filter((category) => category.items.length > 0)
}

function withEducationEstimate(entry: ResumeEducationEntry) {
  const academicInfo = [entry.degree, entry.fieldOfStudy, entry.minor]
    .filter(Boolean)
    .join(", ")
  const coursework = entry.coursework?.join(", ") ?? ""

  return {
    ...entry,
    estimatedLineCount:
      estimateLineCountFromText(entry.school, 34) +
      estimateLineCountFromText(academicInfo, 46) +
      (coursework ? estimateLineCountFromText(coursework, 58) : 0),
  }
}

function withExperienceEstimate(entry: ResumeExperienceEntry) {
  return {
    ...entry,
    estimatedLineCount:
      2 + estimateLineCountFromBullets(entry.bullets) + estimateLineCountFromText(entry.location, 28),
  }
}

function withProjectEstimate(entry: ResumeProjectEntry) {
  return {
    ...entry,
    estimatedLineCount:
      2 +
      estimateLineCountFromBullets(entry.bullets) +
      estimateLineCountFromText(entry.technologies.join(", "), 48),
  }
}

export function enforceResumeSectionLimits(resume: StructuredResume): StructuredResume {
  return {
    ...resume,
    education: {
      ...resume.education,
      entries: resume.education.entries.slice(0, resume.education.limits.maxEntries),
    },
    skills: {
      ...resume.skills,
      categories: trimSkillCategoriesToTotalLimit(
        resume.skills.categories.slice(0, resume.skills.limits.maxEntries).map((category) => ({
          ...category,
          items: category.items.slice(0, resume.skills.limits.maxItemsPerCategory),
        }))
      ),
    },
    experience: {
      ...resume.experience,
      entries: resume.experience.entries
        .slice(0, resume.experience.limits.maxEntries)
        .map((entry) => ({
          ...entry,
          bullets: entry.bullets.slice(0, resume.experience.limits.maxBulletsPerEntry ?? entry.bullets.length),
        })),
    },
    projects: {
      ...resume.projects,
      entries: resume.projects.entries
        .slice(0, resume.projects.limits.maxEntries)
        .map((entry) => ({
          ...entry,
          bullets: entry.bullets.slice(0, resume.projects.limits.maxBulletsPerEntry ?? entry.bullets.length),
        })),
    },
  }
}

export function generateResumeFromProfile(
  profile: ProfileData,
  jobDescription: string
): StructuredResume {
  const jobDescriptionTerms = new Set(tokenize(jobDescription))
  const defaults = createDefaultStructuredResumeLimits()

  const education = profile.educationEntries
    .map((entry, index) =>
      withEducationEstimate({
        id: entry.id,
        school: entry.school,
        college: entry.college,
        degree: entry.degree,
        fieldOfStudy: entry.fieldOfStudy,
        minor: entry.minor || undefined,
        schoolYear: entry.schoolYear || undefined,
        startMonth: entry.startMonth,
        startYear: entry.startYear,
        endMonth: entry.endMonth,
        endYear: entry.endYear,
        currentlyAttending: entry.currentlyAttending,
        gpa: entry.gpa || undefined,
        departmentGpa: entry.departmentGpa || undefined,
        coursework: [],
        priority: priority(index === 0 ? 1 : 0, index),
      })
    )
    .slice(0, resumeLayoutConfig.limits.education.maxEntries)

  const selectExperience = selectRelevantEntries(
    profile.experienceEntries,
    resumeLayoutConfig.limits.experience.maxEntries,
    (entry) =>
      [
        entry.company,
        entry.title,
        entry.employmentType,
        entry.location,
        entry.description,
        entry.bullets,
      ].join(" "),
    (entry, meta) =>
      withExperienceEstimate({
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
        bullets: normalizeBulletList(splitLines(entry.bullets), {
          maxCharacters: resumeLayoutConfig.limits.experience.maxCharactersPerBullet,
          deterministicShorten: true,
          maxItems: resumeLayoutConfig.limits.experience.maxBulletsPerEntry,
        }),
        priority: meta,
      })
  )

  const selectProjects = selectRelevantEntries(
    profile.projectEntries,
    resumeLayoutConfig.limits.projects.maxEntries,
    (entry) =>
      [
        entry.name,
        entry.role,
        entry.description,
        entry.technologies,
        entry.githubUrl,
        entry.liveUrl,
        entry.bullets,
      ].join(" "),
    (entry, meta) =>
      withProjectEstimate({
        id: entry.id,
        name: entry.name,
        role: entry.role || undefined,
        startMonth: entry.startMonth,
        startYear: entry.startYear,
        endMonth: entry.endMonth,
        endYear: entry.endYear,
        currentlyWorking: entry.currentlyWorking,
        technologies: splitCommaSeparated(entry.technologies),
        githubUrl: entry.githubUrl || undefined,
        liveUrl: entry.liveUrl || undefined,
        bullets: normalizeBulletList(splitLines(entry.bullets), {
          maxCharacters: resumeLayoutConfig.limits.projects.maxCharactersPerBullet,
          deterministicShorten: true,
          maxItems: resumeLayoutConfig.limits.projects.maxBulletsPerEntry,
        }),
        priority: meta,
      })
  )

  const categories = [
    createSkillCategory("languages", "Programming Languages", profile.skills.languages, jobDescriptionTerms, 0),
    createSkillCategory("frameworks", "Frameworks", profile.skills.frameworks, jobDescriptionTerms, 1),
    createSkillCategory("tools", "Technologies", profile.skills.tools, jobDescriptionTerms, 2),
    createSkillCategory("databases", "Databases", profile.skills.databases, jobDescriptionTerms, 3),
    createSkillCategory("cloud", "Cloud", profile.skills.cloud, jobDescriptionTerms, 4),
    createSkillCategory("other", "Other", profile.skills.other, jobDescriptionTerms, 5),
  ].filter((category): category is ResumeSkillCategory => Boolean(category))

  return enforceResumeSectionLimits({
    basics: {
      fullName: profile.basics.fullName,
      email: profile.basics.email,
      phone: profile.basics.phone,
      location: profile.basics.location,
      linkedIn: profile.basics.linkedIn,
      github: profile.basics.github,
    },
    education: {
      ...defaults.education,
      entries: education,
    },
    skills: {
      ...defaults.skills,
      categories: trimSkillCategoriesToTotalLimit(categories),
    },
    experience: {
      ...defaults.experience,
      entries: selectExperience(jobDescriptionTerms),
    },
    projects: {
      ...defaults.projects,
      entries: selectProjects(jobDescriptionTerms),
    },
  })
}

export function totalSkillItems(categories: ResumeSkillCategory[]) {
  return categories.reduce((total, category) => total + category.items.length, 0)
}

export function sortEntriesByPriority<T extends { priority?: ResumePriority }>(entries: T[]) {
  return [...entries].sort((left, right) => {
    const leftScore = left.priority?.relevanceScore ?? 0
    const rightScore = right.priority?.relevanceScore ?? 0
    if (rightScore !== leftScore) return rightScore - leftScore
    return (left.priority?.originalIndex ?? 0) - (right.priority?.originalIndex ?? 0)
  })
}

export function sortSkillItemsByRemovalPriority(categories: ResumeSkillCategory[]) {
  return categories.flatMap((category) =>
    category.items.map((item, index) => ({
      categoryId: category.id,
      itemIndex: index,
      relevanceScore: item.priority?.relevanceScore ?? 0,
      categoryOriginalIndex: category.priority?.originalIndex ?? 0,
      itemOriginalIndex: item.priority?.originalIndex ?? 0,
    }))
  )
}
