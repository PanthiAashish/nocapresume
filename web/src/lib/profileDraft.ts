import type { Prisma } from "@prisma/client"

export type ProfileBasicsDraft = {
  fullName: string
  email: string
  phone: string
  location: string
  linkedinUrl: string
  githubUrl: string
}

export type ProfileEducationDraft = {
  school: string
  college: string
  degree: string
  fieldOfStudy: string
  minor: string
  schoolYear: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyAttending: boolean
  gpa: string
  departmentGpa: string
  description: string
}

export type ProfileExperienceDraft = {
  company: string
  title: string
  location: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking: boolean
  bullets: string[]
}

export type ProfileProjectDraft = {
  name: string
  role: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking: boolean
  bullets: string[]
  technologies: string[]
  githubUrl: string
  liveUrl: string
}

export type ProfileSkillsDraft = {
  languages: string[]
  frameworks: string[]
  tools: string[]
  cloud: string[]
  databases: string[]
  other: string[]
}

export type ProfileExtracurricularDraft = {
  organization: string
  title: string
  location: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  bullets: string[]
}

export type ProfileDraft = {
  basics: ProfileBasicsDraft
  education: ProfileEducationDraft[]
  experience: ProfileExperienceDraft[]
  projects: ProfileProjectDraft[]
  skills: ProfileSkillsDraft
  extracurricular: ProfileExtracurricularDraft[]
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
}

function parseBasics(value: unknown): ProfileBasicsDraft {
  const record = asRecord(value)

  return {
    fullName: asString(record.fullName),
    email: asString(record.email),
    phone: asString(record.phone),
    location: asString(record.location),
    linkedinUrl: asString(record.linkedinUrl),
    githubUrl: asString(record.githubUrl),
  }
}

function parseEducationEntry(value: unknown): ProfileEducationDraft {
  const record = asRecord(value)

  return {
    school: asString(record.school),
    college: asString(record.college),
    degree: asString(record.degree),
    fieldOfStudy: asString(record.fieldOfStudy),
    minor: asString(record.minor),
    schoolYear: asString(record.schoolYear),
    startMonth: asString(record.startMonth),
    startYear: asString(record.startYear),
    endMonth: asString(record.endMonth),
    endYear: asString(record.endYear),
    currentlyAttending: asBoolean(record.currentlyAttending),
    gpa: asString(record.gpa),
    departmentGpa: asString(record.departmentGpa),
    description: asString(record.description),
  }
}

function parseExperienceEntry(value: unknown): ProfileExperienceDraft {
  const record = asRecord(value)

  return {
    company: asString(record.company),
    title: asString(record.title),
    location: asString(record.location),
    startMonth: asString(record.startMonth),
    startYear: asString(record.startYear),
    endMonth: asString(record.endMonth),
    endYear: asString(record.endYear),
    currentlyWorking: asBoolean(record.currentlyWorking),
    bullets: asStringArray(record.bullets),
  }
}

function parseProjectEntry(value: unknown): ProfileProjectDraft {
  const record = asRecord(value)

  return {
    name: asString(record.name),
    role: asString(record.role),
    startMonth: asString(record.startMonth),
    startYear: asString(record.startYear),
    endMonth: asString(record.endMonth),
    endYear: asString(record.endYear),
    currentlyWorking: asBoolean(record.currentlyWorking),
    bullets: asStringArray(record.bullets),
    technologies: asStringArray(record.technologies),
    githubUrl: asString(record.githubUrl),
    liveUrl: asString(record.liveUrl),
  }
}

function parseSkills(value: unknown): ProfileSkillsDraft {
  const record = asRecord(value)

  return {
    languages: asStringArray(record.languages),
    frameworks: asStringArray(record.frameworks),
    tools: asStringArray(record.tools),
    cloud: asStringArray(record.cloud),
    databases: asStringArray(record.databases),
    other: asStringArray(record.other),
  }
}

function parseExtracurricularEntry(value: unknown): ProfileExtracurricularDraft {
  const record = asRecord(value)

  return {
    organization: asString(record.organization),
    title: asString(record.title),
    location: asString(record.location),
    startMonth: asString(record.startMonth),
    startYear: asString(record.startYear),
    endMonth: asString(record.endMonth),
    endYear: asString(record.endYear),
    bullets: asStringArray(record.bullets),
  }
}

export function normalizeProfileDraft(value: unknown): ProfileDraft {
  const record = asRecord(value)

  return {
    basics: parseBasics(record.basics),
    education: Array.isArray(record.education)
      ? record.education.map(parseEducationEntry)
      : [],
    experience: Array.isArray(record.experience)
      ? record.experience.map(parseExperienceEntry)
      : [],
    projects: Array.isArray(record.projects)
      ? record.projects.map(parseProjectEntry)
      : [],
    skills: parseSkills(record.skills),
    extracurricular: Array.isArray(record.extracurricular)
      ? record.extracurricular.map(parseExtracurricularEntry)
      : [],
  }
}

export function toPrismaProfileDraftJson(
  draft: ProfileDraft
): Prisma.InputJsonValue {
  return draft as unknown as Prisma.InputJsonValue
}

export function fromPrismaProfileDraftJson(value: Prisma.JsonValue | null) {
  return value ? normalizeProfileDraft(value) : null
}
