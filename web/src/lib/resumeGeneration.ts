import type {
  ProfileData,
  ProfileExperienceEntry,
  ProfileExtracurricularEntry,
  ProfileProjectEntry,
} from "@/lib/profile"

type ResumeHeader = {
  fullName: string
  email: string
  phone: string
  location: string
  linkedIn: string
  github: string
}

export type GeneratedResume = {
  header: ResumeHeader
  education: ProfileData["educationEntries"]
  skills: ProfileData["skills"]
  experience: ProfileExperienceEntry[]
  projects: ProfileProjectEntry[]
  leadership: ProfileExtracurricularEntry[]
  jobDescription: string
}

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

function selectRelevantEntries<T>(
  entries: T[],
  limit: number,
  toSearchText: (entry: T) => string,
  jobDescriptionTerms: Set<string>
) {
  return entries
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
    .map((item) => item.entry)
}

export function generateResumeFromProfile(
  profile: ProfileData,
  jobDescription: string
): GeneratedResume {
  const jobDescriptionTerms = new Set(tokenize(jobDescription))

  return {
    header: {
      fullName: profile.basics.fullName,
      email: profile.basics.email,
      phone: profile.basics.phone,
      location: profile.basics.location,
      linkedIn: profile.basics.linkedIn,
      github: profile.basics.github,
    },
    education: profile.educationEntries,
    skills: profile.skills,
    experience: selectRelevantEntries(
      profile.experienceEntries,
      4,
      (entry) =>
        [
          entry.company,
          entry.title,
          entry.employmentType,
          entry.location,
          entry.description,
          entry.bullets,
        ].join(" "),
      jobDescriptionTerms
    ),
    projects: selectRelevantEntries(
      profile.projectEntries,
      3,
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
      jobDescriptionTerms
    ),
    leadership: selectRelevantEntries(
      profile.extracurricularEntries,
      3,
      (entry) =>
        [
          entry.organization,
          entry.title,
          entry.location,
          entry.description,
          entry.bullets,
        ].join(" "),
      jobDescriptionTerms
    ),
    jobDescription,
  }
}
