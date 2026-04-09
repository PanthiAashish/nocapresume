import type { StructuredResume } from "@/lib/resumeSchema"

export const resumeLayoutConfig = {
  page: {
    width: 612,
    height: 792,
    marginTop: 42,
    marginRight: 40,
    marginBottom: 40,
    marginLeft: 40,
  },
  typography: {
    headerNameSize: 21,
    headerContactSize: 9,
    sectionTitleSize: 10,
    primaryRowSize: 10,
    secondaryRowSize: 9,
    bodySize: 8.8,
    bulletSize: 8.8,
    minFontScale: 0.94,
    fontScaleStep: 0.02,
    lineHeightMultiplier: 1.18,
  },
  spacing: {
    headerGap: 4,
    sectionTop: 11,
    sectionBottom: 6,
    rowGap: 2,
    entryGap: 8,
    bulletGap: 2,
    bulletIndent: 11,
    minTightness: 2,
  },
  limits: {
    education: {
      maxEntries: 1,
    },
    skills: {
      maxEntries: 6,
      maxItemsPerCategory: 6,
      maxTotalItems: 18,
      minTotalItems: 10,
    },
    experience: {
      maxEntries: 4,
      maxBulletsPerEntry: 4,
      compressedBulletsPerEntry: 3,
      maxCharactersPerBullet: 160,
      minCharactersPerBullet: 95,
      bulletShortenStep: 12,
    },
    projects: {
      maxEntries: 3,
      maxBulletsPerEntry: 3,
      maxCharactersPerBullet: 140,
    },
  },
  fitting: {
    maxCompressionPasses: 80,
  },
} as const

export type ResumeLayoutConfig = typeof resumeLayoutConfig

export function createDefaultStructuredResumeLimits(): Pick<
  StructuredResume,
  "education" | "skills" | "experience" | "projects"
> {
  return {
    education: {
      limits: {
        maxEntries: resumeLayoutConfig.limits.education.maxEntries,
      },
      entries: [],
    },
    skills: {
      limits: {
        maxEntries: resumeLayoutConfig.limits.skills.maxEntries,
        maxItemsPerCategory: resumeLayoutConfig.limits.skills.maxItemsPerCategory,
        maxTotalItems: resumeLayoutConfig.limits.skills.maxTotalItems,
      },
      categories: [],
    },
    experience: {
      limits: {
        maxEntries: resumeLayoutConfig.limits.experience.maxEntries,
        maxBulletsPerEntry: resumeLayoutConfig.limits.experience.maxBulletsPerEntry,
        maxCharactersPerBullet: resumeLayoutConfig.limits.experience.maxCharactersPerBullet,
      },
      entries: [],
    },
    projects: {
      limits: {
        maxEntries: resumeLayoutConfig.limits.projects.maxEntries,
        maxBulletsPerEntry: resumeLayoutConfig.limits.projects.maxBulletsPerEntry,
        maxCharactersPerBullet: resumeLayoutConfig.limits.projects.maxCharactersPerBullet,
      },
      entries: [],
    },
  }
}
