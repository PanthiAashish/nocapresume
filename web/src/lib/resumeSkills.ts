import { resumeLayoutConfig } from "@/lib/resumeLayoutConfig"
import { buildJobDescriptionProfile, scoreTextForJob, type JobDescriptionProfile } from "@/lib/resumeJobRelevance"
import type { ResumeSkillCategory } from "@/lib/resumeSchema"

type CanonicalSkillCategoryId = "languages" | "frameworks" | "tools" | "databases" | "cloud"

const CANONICAL_CATEGORY_ORDER: CanonicalSkillCategoryId[] = [
  "languages",
  "frameworks",
  "tools",
  "databases",
  "cloud",
]

const CANONICAL_CATEGORY_LABELS: Record<CanonicalSkillCategoryId, string> = {
  languages: "Programming Languages",
  frameworks: "Frameworks",
  tools: "Tools & Technologies",
  databases: "Databases",
  cloud: "Cloud",
}

const ITEM_CATEGORY_OVERRIDES: Record<string, CanonicalSkillCategoryId> = {
  python: "languages",
  java: "languages",
  javascript: "languages",
  typescript: "languages",
  kotlin: "languages",
  c: "languages",
  "c++": "languages",
  sql: "languages",
  react: "frameworks",
  "react.js": "frameworks",
  "next.js": "frameworks",
  next: "frameworks",
  express: "frameworks",
  "express.js": "frameworks",
  fastapi: "frameworks",
  jest: "frameworks",
  cypress: "tools",
  protobuf: "tools",
  git: "tools",
  "github actions": "tools",
  docker: "tools",
  postman: "tools",
  kafka: "tools",
  terraform: "tools",
  linux: "tools",
  etl: "tools",
  analytics: "tools",
  experimentation: "tools",
  mongodb: "databases",
  mysql: "databases",
  postgresql: "databases",
  dynamodb: "databases",
  redis: "databases",
  aws: "cloud",
  gcp: "cloud",
  firebase: "cloud",
  vercel: "cloud",
}

function normalizeComparable(text: string) {
  return text.toLowerCase().replace(/[^\w.+# ]+/g, " ").replace(/\s+/g, " ").trim()
}

function inferCanonicalCategory(id: string, label: string): CanonicalSkillCategoryId | null {
  const normalized = normalizeComparable(`${id} ${label}`)
  if (normalized.includes("language")) return "languages"
  if (normalized.includes("framework")) return "frameworks"
  if (normalized.includes("database")) return "databases"
  if (normalized.includes("cloud")) return "cloud"
  if (normalized.includes("tool") || normalized.includes("technolog")) return "tools"
  if (normalized.includes("other")) return "tools"
  return null
}

function categorizeSkillItem(
  item: string,
  fallbackCategory: CanonicalSkillCategoryId
): CanonicalSkillCategoryId {
  const normalized = normalizeComparable(item)
  return ITEM_CATEGORY_OVERRIDES[normalized] ?? fallbackCategory
}

function uniqueByLabel<T extends { label: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = normalizeComparable(item.label)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function normalizeSkillCategoriesForRendering(
  categories: ResumeSkillCategory[],
  jobDescriptionText: string
) {
  const profile = buildJobDescriptionProfile(jobDescriptionText)
  const merged = new Map<CanonicalSkillCategoryId, ResumeSkillCategory["items"]>()

  for (const category of categories) {
    const canonical = inferCanonicalCategory(category.id, category.label)
    if (!canonical) continue

    for (const item of category.items) {
      const mappedCategory = categorizeSkillItem(item.label, canonical)
      const current = merged.get(mappedCategory) ?? []
      current.push({
        label: item.label,
        priority: {
          relevanceScore:
            (item.priority?.relevanceScore ?? 0) + scoreSkillItemForJob(item.label, profile),
          originalIndex: item.priority?.originalIndex ?? current.length,
        },
      })
      merged.set(mappedCategory, current)
    }
  }

  const result = CANONICAL_CATEGORY_ORDER.flatMap((categoryId, orderIndex) => {
    const items = merged.get(categoryId)
    if (!items || items.length === 0) return []

    const deduped = uniqueByLabel(items)
      .sort((left, right) => {
        const scoreDelta = (right.priority?.relevanceScore ?? 0) - (left.priority?.relevanceScore ?? 0)
        if (scoreDelta !== 0) return scoreDelta
        return (left.priority?.originalIndex ?? 0) - (right.priority?.originalIndex ?? 0)
      })
      .slice(0, resumeLayoutConfig.limits.skills.maxItemsPerCategory)
      .sort((left, right) => {
        const scoreDelta = (right.priority?.relevanceScore ?? 0) - (left.priority?.relevanceScore ?? 0)
        if (scoreDelta !== 0) return scoreDelta
        return left.label.localeCompare(right.label)
      })

    return [
      {
        id: categoryId,
        label: CANONICAL_CATEGORY_LABELS[categoryId],
        items: deduped,
        priority: {
          relevanceScore: deduped.reduce((total, item) => total + (item.priority?.relevanceScore ?? 0), 0),
          originalIndex: orderIndex,
        },
      },
    ]
  })

  if (result.length > 4) {
    const tools = result.find((category) => category.id === "tools")
    const cloud = result.find((category) => category.id === "cloud")
    if (tools && cloud && totalSkillItems(result) > resumeLayoutConfig.limits.skills.maxTotalItems - 2) {
      tools.items = uniqueByLabel([...tools.items, ...cloud.items])
      return result.filter((category) => category.id !== "cloud")
    }
  }

  return result
}

function scoreSkillItemForJob(label: string, profile: JobDescriptionProfile) {
  let score = scoreTextForJob(label, profile)
  const normalized = normalizeComparable(label)

  if (profile.mlFocused) {
    if (["python", "sql", "etl", "analytics", "protobuf", "aws", "dynamodb"].includes(normalized)) {
      score += 10
    }
    if (["react", "react.js", "next.js"].includes(normalized)) {
      score -= 4
    }
  }

  if (profile.frontendFocused && ["react", "react.js", "next.js", "typescript", "javascript"].includes(normalized)) {
    score += 10
  }

  return score
}

function totalSkillItems(categories: ResumeSkillCategory[]) {
  return categories.reduce((total, category) => total + category.items.length, 0)
}
