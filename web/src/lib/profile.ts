import type {
  Profile as PrismaProfile,
  ProfileEducation,
  ProfileExperience,
  ProfileExtracurricular,
  ProfileProject,
} from "@prisma/client"
import type { ProfileDraft } from "@/lib/profileDraft"

export type ProfileBasics = {
  fullName: string
  email: string
  phone: string
  location: string
  linkedIn: string
  github: string
}

export type ProfileEducationEntry = {
  id: string
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

export type ProfileExperienceEntry = {
  id: string
  company: string
  title: string
  employmentType: string
  location: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking: boolean
  description: string
  bullets: string
}

export type ProfileProjectEntry = {
  id: string
  name: string
  role: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking: boolean
  description: string
  bullets: string
  technologies: string
  githubUrl: string
  liveUrl: string
}

export type ProfileSkills = {
  languages: string
  frameworks: string
  tools: string
  cloud: string
  databases: string
  other: string
}

export type ProfileExtracurricularEntry = {
  id: string
  organization: string
  title: string
  location: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  description: string
  bullets: string
}

export type ProfileData = {
  basics: ProfileBasics
  educationEntries: ProfileEducationEntry[]
  experienceEntries: ProfileExperienceEntry[]
  projectEntries: ProfileProjectEntry[]
  skills: ProfileSkills
  extracurricularEntries: ProfileExtracurricularEntry[]
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

function asArray<T>(value: unknown, mapItem: (item: unknown, index: number) => T): T[] {
  return Array.isArray(value) ? value.map(mapItem) : []
}

function joinList(values: string[]) {
  return values.join(", ")
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

function normalizeBasics(value: unknown): ProfileBasics {
  const record = asRecord(value)

  return {
    fullName: asString(record.fullName),
    email: asString(record.email),
    phone: asString(record.phone),
    location: asString(record.location),
    linkedIn: asString(record.linkedIn),
    github: asString(record.github),
  }
}

function normalizeEducationEntry(value: unknown, index: number): ProfileEducationEntry {
  const record = asRecord(value)

  return {
    id: asString(record.id) || `education-${index}`,
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

function normalizeExperienceEntry(value: unknown, index: number): ProfileExperienceEntry {
  const record = asRecord(value)

  return {
    id: asString(record.id) || `experience-${index}`,
    company: asString(record.company),
    title: asString(record.title),
    employmentType: asString(record.employmentType),
    location: asString(record.location),
    startMonth: asString(record.startMonth),
    startYear: asString(record.startYear),
    endMonth: asString(record.endMonth),
    endYear: asString(record.endYear),
    currentlyWorking: asBoolean(record.currentlyWorking),
    description: asString(record.description),
    bullets: asString(record.bullets),
  }
}

function normalizeProjectEntry(value: unknown, index: number): ProfileProjectEntry {
  const record = asRecord(value)

  return {
    id: asString(record.id) || `project-${index}`,
    name: asString(record.name),
    role: asString(record.role),
    startMonth: asString(record.startMonth),
    startYear: asString(record.startYear),
    endMonth: asString(record.endMonth),
    endYear: asString(record.endYear),
    currentlyWorking: asBoolean(record.currentlyWorking),
    description: asString(record.description),
    bullets: asString(record.bullets),
    technologies: asString(record.technologies),
    githubUrl: asString(record.githubUrl),
    liveUrl: asString(record.liveUrl),
  }
}

function normalizeExtracurricularEntry(
  value: unknown,
  index: number
): ProfileExtracurricularEntry {
  const record = asRecord(value)

  return {
    id: asString(record.id) || `extracurricular-${index}`,
    organization: asString(record.organization),
    title: asString(record.title),
    location: asString(record.location),
    startMonth: asString(record.startMonth),
    startYear: asString(record.startYear),
    endMonth: asString(record.endMonth),
    endYear: asString(record.endYear),
    description: asString(record.description),
    bullets: asString(record.bullets),
  }
}

function normalizeSkills(value: unknown): ProfileSkills {
  const record = asRecord(value)

  return {
    languages: asString(record.languages),
    frameworks: asString(record.frameworks),
    tools: asString(record.tools),
    cloud: asString(record.cloud),
    databases: asString(record.databases),
    other: asString(record.other),
  }
}

export function emptyProfileData(): ProfileData {
  return {
    basics: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedIn: "",
      github: "",
    },
    educationEntries: [],
    experienceEntries: [],
    projectEntries: [],
    skills: {
      languages: "",
      frameworks: "",
      tools: "",
      cloud: "",
      databases: "",
      other: "",
    },
    extracurricularEntries: [],
  }
}

export function normalizeProfileData(value: unknown): ProfileData {
  const record = asRecord(value)

  return {
    basics: normalizeBasics(record.basics),
    educationEntries: asArray(record.educationEntries, normalizeEducationEntry),
    experienceEntries: asArray(record.experienceEntries, normalizeExperienceEntry),
    projectEntries: asArray(record.projectEntries, normalizeProjectEntry),
    skills: normalizeSkills(record.skills),
    extracurricularEntries: asArray(
      record.extracurricularEntries,
      normalizeExtracurricularEntry
    ),
  }
}

export function profileDataFromDraft(draft: ProfileDraft): ProfileData {
  return {
    basics: {
      fullName: draft.basics.fullName,
      email: draft.basics.email,
      phone: draft.basics.phone,
      location: draft.basics.location,
      linkedIn: draft.basics.linkedinUrl,
      github: draft.basics.githubUrl,
    },
    educationEntries: draft.education.map((entry, index) => ({
      id: `education-${index}`,
      ...entry,
    })),
    experienceEntries: draft.experience.map((entry, index) => ({
      id: `experience-${index}`,
      company: entry.company,
      title: entry.title,
      employmentType: "",
      location: entry.location,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      description: "",
      bullets: entry.bullets.join("\n"),
    })),
    projectEntries: draft.projects.map((entry, index) => ({
      id: `project-${index}`,
      name: entry.name,
      role: entry.role,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      description: "",
      bullets: entry.bullets.join("\n"),
      technologies: joinList(entry.technologies),
      githubUrl: entry.githubUrl,
      liveUrl: entry.liveUrl,
    })),
    skills: {
      languages: joinList(draft.skills.languages),
      frameworks: joinList(draft.skills.frameworks),
      tools: joinList(draft.skills.tools),
      cloud: joinList(draft.skills.cloud),
      databases: joinList(draft.skills.databases),
      other: joinList(draft.skills.other),
    },
    extracurricularEntries: draft.extracurricular.map((entry, index) => ({
      id: `extracurricular-${index}`,
      organization: entry.organization,
      title: entry.title,
      location: entry.location,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      description: "",
      bullets: entry.bullets.join("\n"),
    })),
  }
}

type ProfileRecord = PrismaProfile & {
  educationEntries: ProfileEducation[]
  experienceEntries: ProfileExperience[]
  projectEntries: ProfileProject[]
  extracurricularEntries: ProfileExtracurricular[]
}

export function profileDataFromRecord(profile: ProfileRecord): ProfileData {
  return {
    basics: {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      linkedIn: profile.linkedinUrl,
      github: profile.githubUrl,
    },
    educationEntries: profile.educationEntries.map((entry) => ({
      id: entry.id,
      school: entry.school,
      college: entry.college,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy,
      minor: entry.minor,
      schoolYear: entry.schoolYear,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyAttending: entry.currentlyAttending,
      gpa: entry.gpa,
      departmentGpa: entry.departmentGpa,
      description: entry.description,
    })),
    experienceEntries: profile.experienceEntries.map((entry) => ({
      id: entry.id,
      company: entry.company,
      title: entry.title,
      employmentType: entry.employmentType,
      location: entry.location,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      description: entry.description,
      bullets: entry.bullets.join("\n"),
    })),
    projectEntries: profile.projectEntries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      role: entry.role,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      description: entry.description,
      bullets: entry.bullets.join("\n"),
      technologies: joinList(entry.technologies),
      githubUrl: entry.githubUrl,
      liveUrl: entry.liveUrl,
    })),
    skills: {
      languages: joinList(profile.skillLanguages),
      frameworks: joinList(profile.skillFrameworks),
      tools: joinList(profile.skillTools),
      cloud: joinList(profile.skillCloud),
      databases: joinList(profile.skillDatabases),
      other: joinList(profile.skillOther),
    },
    extracurricularEntries: profile.extracurricularEntries.map((entry) => ({
      id: entry.id,
      organization: entry.organization,
      title: entry.title,
      location: entry.location,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      description: entry.description,
      bullets: entry.bullets.join("\n"),
    })),
  }
}

export function educationEntriesFromRecords(
  entries: ProfileEducation[]
): ProfileEducationEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    school: entry.school,
    college: entry.college,
    degree: entry.degree,
    fieldOfStudy: entry.fieldOfStudy,
    minor: entry.minor,
    schoolYear: entry.schoolYear,
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    currentlyAttending: entry.currentlyAttending,
    gpa: entry.gpa,
    departmentGpa: entry.departmentGpa,
    description: entry.description,
  }))
}

export function experienceEntriesFromRecords(
  entries: ProfileExperience[]
): ProfileExperienceEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    company: entry.company,
    title: entry.title,
    employmentType: entry.employmentType,
    location: entry.location,
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    currentlyWorking: entry.currentlyWorking,
    description: entry.description,
    bullets: entry.bullets.join("\n"),
  }))
}

export function projectEntriesFromRecords(entries: ProfileProject[]): ProfileProjectEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    role: entry.role,
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    currentlyWorking: entry.currentlyWorking,
    description: entry.description,
    bullets: entry.bullets.join("\n"),
    technologies: joinList(entry.technologies),
    githubUrl: entry.githubUrl,
    liveUrl: entry.liveUrl,
  }))
}

export function extracurricularEntriesFromRecords(
  entries: ProfileExtracurricular[]
): ProfileExtracurricularEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    organization: entry.organization,
    title: entry.title,
    location: entry.location,
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    description: entry.description,
    bullets: entry.bullets.join("\n"),
  }))
}

export function profileDataToPersistenceInput(profile: ProfileData) {
  return {
    basics: {
      fullName: profile.basics.fullName,
      email: profile.basics.email,
      phone: profile.basics.phone,
      location: profile.basics.location,
      linkedinUrl: profile.basics.linkedIn,
      githubUrl: profile.basics.github,
    },
    skills: {
      languages: splitCommaSeparated(profile.skills.languages),
      frameworks: splitCommaSeparated(profile.skills.frameworks),
      tools: splitCommaSeparated(profile.skills.tools),
      cloud: splitCommaSeparated(profile.skills.cloud),
      databases: splitCommaSeparated(profile.skills.databases),
      other: splitCommaSeparated(profile.skills.other),
    },
    educationEntries: profile.educationEntries.map((entry, index) => ({
      sortOrder: index,
      school: entry.school,
      college: entry.college,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy,
      minor: entry.minor,
      schoolYear: entry.schoolYear,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyAttending: entry.currentlyAttending,
      gpa: entry.gpa,
      departmentGpa: entry.departmentGpa,
      description: entry.description,
    })),
    experienceEntries: profile.experienceEntries.map((entry, index) => ({
      sortOrder: index,
      company: entry.company,
      title: entry.title,
      employmentType: entry.employmentType,
      location: entry.location,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      description: entry.description,
      bullets: splitLines(entry.bullets),
    })),
    projectEntries: profile.projectEntries.map((entry, index) => ({
      sortOrder: index,
      name: entry.name,
      role: entry.role,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      description: entry.description,
      bullets: splitLines(entry.bullets),
      technologies: splitCommaSeparated(entry.technologies),
      githubUrl: entry.githubUrl,
      liveUrl: entry.liveUrl,
    })),
    extracurricularEntries: profile.extracurricularEntries.map((entry, index) => ({
      sortOrder: index,
      organization: entry.organization,
      title: entry.title,
      location: entry.location,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      description: entry.description,
      bullets: splitLines(entry.bullets),
    })),
  }
}

export function educationEntriesToPersistenceInput(entries: ProfileEducationEntry[]) {
  return entries.map((entry, index) => ({
    sortOrder: index,
    school: entry.school,
    college: entry.college,
    degree: entry.degree,
    fieldOfStudy: entry.fieldOfStudy,
    minor: entry.minor,
    schoolYear: entry.schoolYear,
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    currentlyAttending: entry.currentlyAttending,
    gpa: entry.gpa,
    departmentGpa: entry.departmentGpa,
    description: entry.description,
  }))
}

export function experienceEntriesToPersistenceInput(entries: ProfileExperienceEntry[]) {
  return entries.map((entry, index) => ({
    sortOrder: index,
    company: entry.company,
    title: entry.title,
    employmentType: entry.employmentType,
    location: entry.location,
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    currentlyWorking: entry.currentlyWorking,
    description: entry.description,
    bullets: splitLines(entry.bullets),
  }))
}

export function projectEntriesToPersistenceInput(entries: ProfileProjectEntry[]) {
  return entries.map((entry, index) => ({
    sortOrder: index,
    name: entry.name,
    role: entry.role,
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    currentlyWorking: entry.currentlyWorking,
    description: entry.description,
    bullets: splitLines(entry.bullets),
    technologies: splitCommaSeparated(entry.technologies),
    githubUrl: entry.githubUrl,
    liveUrl: entry.liveUrl,
  }))
}

export function extracurricularEntriesToPersistenceInput(
  entries: ProfileExtracurricularEntry[]
) {
  return entries.map((entry, index) => ({
    sortOrder: index,
    organization: entry.organization,
    title: entry.title,
    location: entry.location,
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    description: entry.description,
    bullets: splitLines(entry.bullets),
  }))
}
