import { normalizeBulletList, normalizeBulletText } from "@/lib/resumeBullets"
import { profileDataFromDraft, type ProfileData } from "@/lib/profile"
import type { ProfileDraft } from "@/lib/profileDraft"

export type BaseResumeSource = {
  basics: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedIn: string
    github: string
  }
  jobDescriptionText: string
  baseResumeText: string
  education: Array<{
    id: string
    sortOrder: number
    school: string
    college: string
    degree: string
    fieldOfStudy: string
    minor: string
    startMonth: string
    startYear: string
    endMonth: string
    endYear: string
    currentlyAttending: boolean
    gpa: string
    departmentGpa: string
    sourceText: string
  }>
  skills: Array<{
    id: string
    label: string
    items: string[]
    sourceText: string
    sortOrder: number
  }>
  experience: Array<{
    id: string
    sortOrder: number
    company: string
    title: string
    employmentType: string
    location: string
    startMonth: string
    startYear: string
    endMonth: string
    endYear: string
    currentlyWorking: boolean
    bullets: string[]
    sourceText: string
  }>
  projects: Array<{
    id: string
    sortOrder: number
    name: string
    role: string
    technologies: string[]
    githubUrl: string
    liveUrl: string
    startMonth: string
    startYear: string
    endMonth: string
    endYear: string
    currentlyWorking: boolean
    bullets: string[]
    sourceText: string
  }>
  allowedNamedTerms: string[]
}

function sanitizeText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function compact(values: Array<string | undefined>) {
  return values.map((value) => sanitizeText(value ?? "")).filter(Boolean)
}

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => sanitizeText(item))
    .filter(Boolean)
}

function renderProfileAsResumeText(profile: ProfileData) {
  const lines: string[] = []
  lines.push(
    compact([
      profile.basics.fullName,
      profile.basics.email,
      profile.basics.phone,
      profile.basics.location,
      profile.basics.linkedIn,
      profile.basics.github,
    ]).join(" | ")
  )

  profile.educationEntries.forEach((entry) => {
    lines.push(
      compact([
        entry.school,
        entry.college,
        entry.degree,
        entry.fieldOfStudy,
        entry.minor ? `Minor ${entry.minor}` : "",
        entry.gpa ? `GPA ${entry.gpa}` : "",
      ]).join(" | ")
    )
  })

  profile.experienceEntries.forEach((entry) => {
    lines.push(compact([entry.company, entry.title, entry.location]).join(" | "))
    splitLines(entry.bullets).forEach((bullet) => lines.push(bullet))
  })

  profile.projectEntries.forEach((entry) => {
    lines.push(compact([entry.name, entry.role, entry.technologies]).join(" | "))
    splitLines(entry.bullets).forEach((bullet) => lines.push(bullet))
  })

  ;[
    profile.skills.languages,
    profile.skills.frameworks,
    profile.skills.tools,
    profile.skills.cloud,
    profile.skills.databases,
    profile.skills.other,
  ]
    .filter(Boolean)
    .forEach((line) => lines.push(line))

  return lines.filter(Boolean).join("\n")
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => sanitizeText(item))
    .filter(Boolean)
}

function extractNamedTerms(text: string) {
  const matches = text.match(/\b(?:[A-Z]{2,}|[A-Z][a-z]+(?:\.[A-Z][a-z]+)?|[A-Za-z]+(?:\.[A-Za-z0-9]+)+|[A-Za-z]+\+\+|C#|Node\.js|Next\.js|React|AWS|GCP|SQL|NoSQL|TypeScript|JavaScript|PostgreSQL|MongoDB|Redis)\b/g)
  if (!matches) return []
  return matches.map((match) => match.trim()).filter(Boolean)
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

export function profileDataFromDraftOrProfile(
  profile: ProfileData | null,
  draft: ProfileDraft | null
) {
  if (profile) return profile
  return draft ? profileDataFromDraft(draft) : null
}

export function buildBaseResumeSource(input: {
  jobDescriptionText: string
  baseResumeText?: string | null
  profile: ProfileData
}): BaseResumeSource {
  const { profile } = input
  const normalizedBaseResumeText = sanitizeText(
    (input.baseResumeText && input.baseResumeText.trim()) || renderProfileAsResumeText(profile)
  )
  const normalizedJobDescriptionText = sanitizeText(input.jobDescriptionText)

  const skills = [
    { id: "languages", label: "Programming Languages", value: profile.skills.languages, sortOrder: 0 },
    { id: "frameworks", label: "Frameworks", value: profile.skills.frameworks, sortOrder: 1 },
    { id: "tools", label: "Technologies", value: profile.skills.tools, sortOrder: 2 },
    { id: "cloud", label: "Cloud", value: profile.skills.cloud, sortOrder: 3 },
    { id: "databases", label: "Databases", value: profile.skills.databases, sortOrder: 4 },
    { id: "other", label: "Other", value: profile.skills.other, sortOrder: 5 },
  ]
    .map((category) => ({
      id: category.id,
      label: category.label,
      items: splitCommaSeparated(category.value),
      sortOrder: category.sortOrder,
    }))
    .filter((category) => category.items.length > 0)
    .map((category) => ({
      ...category,
      sourceText: `${category.label}: ${category.items.join(", ")}`,
    }))

  const allowedNamedTerms = uniqueSorted([
    ...extractNamedTerms(normalizedBaseResumeText),
    ...skills.flatMap((category) => category.items),
    ...profile.projectEntries.flatMap((entry) => splitCommaSeparated(entry.technologies)),
  ])

  return {
    basics: {
      fullName: sanitizeText(profile.basics.fullName),
      email: sanitizeText(profile.basics.email),
      phone: sanitizeText(profile.basics.phone),
      location: sanitizeText(profile.basics.location),
      linkedIn: sanitizeText(profile.basics.linkedIn),
      github: sanitizeText(profile.basics.github),
    },
    jobDescriptionText: normalizedJobDescriptionText,
    baseResumeText: normalizedBaseResumeText,
    education: profile.educationEntries.map((entry, index) => ({
      id: entry.id,
      sortOrder: index,
      school: sanitizeText(entry.school),
      college: sanitizeText(entry.college),
      degree: sanitizeText(entry.degree),
      fieldOfStudy: sanitizeText(entry.fieldOfStudy),
      minor: sanitizeText(entry.minor),
      startMonth: sanitizeText(entry.startMonth),
      startYear: sanitizeText(entry.startYear),
      endMonth: sanitizeText(entry.endMonth),
      endYear: sanitizeText(entry.endYear),
      currentlyAttending: entry.currentlyAttending,
      gpa: sanitizeText(entry.gpa),
      departmentGpa: sanitizeText(entry.departmentGpa),
      sourceText: compact([
        entry.school,
        entry.college,
        entry.degree,
        entry.fieldOfStudy,
        entry.minor ? `Minor ${entry.minor}` : undefined,
        entry.gpa ? `GPA ${entry.gpa}` : undefined,
        entry.departmentGpa ? `Department GPA ${entry.departmentGpa}` : undefined,
      ]).join(" | "),
    })),
    skills,
    experience: profile.experienceEntries.map((entry, index) => {
      const bullets = normalizeBulletList(splitLines(entry.bullets), {
        deterministicShorten: false,
      })

      return {
        id: entry.id,
        sortOrder: index,
        company: sanitizeText(entry.company),
        title: sanitizeText(entry.title),
        employmentType: sanitizeText(entry.employmentType),
        location: sanitizeText(entry.location),
        startMonth: sanitizeText(entry.startMonth),
        startYear: sanitizeText(entry.startYear),
        endMonth: sanitizeText(entry.endMonth),
        endYear: sanitizeText(entry.endYear),
        currentlyWorking: entry.currentlyWorking,
        bullets,
        sourceText: compact([
          entry.company,
          entry.title,
          entry.location,
          ...bullets,
        ]).join(" | "),
      }
    }),
    projects: profile.projectEntries.map((entry, index) => {
      const bullets = normalizeBulletList(splitLines(entry.bullets), {
        deterministicShorten: false,
      })
      const technologies = splitCommaSeparated(entry.technologies)

      return {
        id: entry.id,
        sortOrder: index,
        name: sanitizeText(entry.name),
        role: sanitizeText(entry.role),
        technologies,
        githubUrl: sanitizeText(entry.githubUrl),
        liveUrl: sanitizeText(entry.liveUrl),
        startMonth: sanitizeText(entry.startMonth),
        startYear: sanitizeText(entry.startYear),
        endMonth: sanitizeText(entry.endMonth),
        endYear: sanitizeText(entry.endYear),
        currentlyWorking: entry.currentlyWorking,
        bullets,
        sourceText: compact([
          entry.name,
          entry.role,
          technologies.join(", "),
          ...bullets,
        ]).join(" | "),
      }
    }),
    allowedNamedTerms,
  }
}

export function normalizeTailoringTextInput(value: string) {
  return sanitizeText(value)
}

export function normalizeEvidenceSnippet(value: string) {
  return normalizeBulletText(value, {
    deterministicShorten: false,
  })
}
