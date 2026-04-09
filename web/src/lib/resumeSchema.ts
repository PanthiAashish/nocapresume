export type ResumePriority = {
  relevanceScore?: number
  originalIndex?: number
}

export type ResumeBasics = {
  fullName: string
  email: string
  phone: string
  location: string
  linkedIn: string
  github: string
}

export type ResumeSectionLimits = {
  maxEntries: number
  maxBulletsPerEntry?: number
  maxCharactersPerBullet?: number
}

export type ResumeEducationEntry = {
  id: string
  school: string
  college: string
  degree: string
  fieldOfStudy: string
  minor?: string
  schoolYear?: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyAttending: boolean
  gpa?: string
  departmentGpa?: string
  coursework?: string[]
  priority?: ResumePriority
  estimatedLineCount?: number
}

export type ResumeSkillItem = {
  label: string
  priority?: ResumePriority
}

export type ResumeSkillCategory = {
  id: string
  label: string
  items: ResumeSkillItem[]
  priority?: ResumePriority
  estimatedLineCount?: number
}

export type ResumeExperienceEntry = {
  id: string
  company: string
  title: string
  employmentType?: string
  location: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking: boolean
  bullets: string[]
  priority?: ResumePriority
  estimatedLineCount?: number
}

export type ResumeProjectEntry = {
  id: string
  name: string
  role?: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking: boolean
  bullets: string[]
  priority?: ResumePriority
  estimatedLineCount?: number
}

export type StructuredResume = {
  basics: ResumeBasics
  education: {
    limits: ResumeSectionLimits
    entries: ResumeEducationEntry[]
  }
  skills: {
    limits: ResumeSectionLimits & {
      maxItemsPerCategory: number
      maxTotalItems: number
    }
    categories: ResumeSkillCategory[]
  }
  experience: {
    limits: ResumeSectionLimits
    entries: ResumeExperienceEntry[]
  }
  projects: {
    limits: ResumeSectionLimits
    entries: ResumeProjectEntry[]
  }
}

export type ResumeCompressionStep =
  | "remove-coursework"
  | "trim-skills"
  | "drop-project"
  | "reduce-role-bullets"
  | "shorten-bullet"
  | "reduce-spacing"
  | "reduce-font-size"

export type ResumeFitResult = {
  resume: StructuredResume
  metrics: {
    pageCount: number
    usedHeight: number
    availableHeight: number
    overflow: number
  }
  appliedSteps: ResumeCompressionStep[]
  layoutState: {
    spacingTightness: number
    fontScale: number
  }
}
