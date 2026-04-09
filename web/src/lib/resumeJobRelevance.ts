const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
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
])

const CONCEPT_MAP = {
  machine_learning: [
    "machine learning",
    "ml",
    "model",
    "inference",
    "evaluation",
    "experimentation",
    "recommendation",
    "personalization",
    "ranking",
    "search relevance",
    "data pipeline",
    "analytics",
    "prediction",
    "statistics",
    "a/b testing",
    "ab testing",
    "metrics",
  ],
  backend_infrastructure: [
    "backend",
    "infrastructure",
    "api",
    "service",
    "data pipeline",
    "database",
    "scaling",
    "auth",
    "performance",
    "etl",
    "logging",
    "user data",
    "event",
    "telemetry",
  ],
  frontend: ["frontend", "react", "next.js", "javascript", "typescript", "ui", "web"],
} as const

type ConceptKey = keyof typeof CONCEPT_MAP

export type JobDescriptionProfile = {
  text: string
  normalizedText: string
  tokens: string[]
  tokenSet: Set<string>
  concepts: Set<ConceptKey>
  repeatedTerms: Map<string, number>
  mlFocused: boolean
  frontendFocused: boolean
  backendFocused: boolean
}

function normalizeComparable(text: string) {
  return text.toLowerCase().replace(/[^\w.+# ]+/g, " ").replace(/\s+/g, " ").trim()
}

function tokenize(text: string) {
  return normalizeComparable(text)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

function countRepeatedTerms(tokens: string[]) {
  const counts = new Map<string, number>()
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }
  return counts
}

function hasPhrase(text: string, phrase: string) {
  return normalizeComparable(text).includes(normalizeComparable(phrase))
}

export function buildJobDescriptionProfile(text: string): JobDescriptionProfile {
  const tokens = tokenize(text)
  const repeatedTerms = countRepeatedTerms(tokens)
  const concepts = new Set<ConceptKey>()
  const normalizedText = normalizeComparable(text)

  ;(Object.keys(CONCEPT_MAP) as ConceptKey[]).forEach((concept) => {
    if (CONCEPT_MAP[concept].some((term) => hasPhrase(normalizedText, term))) {
      concepts.add(concept)
    }
  })

  const mlFocused =
    concepts.has("machine_learning") ||
    ["machine", "learning", "model", "ranking", "recommendation", "personalization", "inference"].some(
      (term) => normalizedText.includes(term)
    )
  const frontendFocused =
    concepts.has("frontend") ||
    ["react", "next.js", "frontend", "ui", "typescript"].some((term) => normalizedText.includes(term))
  const backendFocused =
    concepts.has("backend_infrastructure") ||
    ["backend", "api", "service", "database", "pipeline", "etl", "scalability"].some((term) =>
      normalizedText.includes(term)
    )

  return {
    text,
    normalizedText,
    tokens,
    tokenSet: new Set(tokens),
    concepts,
    repeatedTerms,
    mlFocused,
    frontendFocused,
    backendFocused,
  }
}

export function matchedTermsForText(text: string, profile: JobDescriptionProfile) {
  const normalized = normalizeComparable(text)
  const matched = new Set<string>()

  profile.tokenSet.forEach((term) => {
    if (normalized.includes(term)) matched.add(term)
  })

  ;(Object.keys(CONCEPT_MAP) as ConceptKey[]).forEach((concept) => {
    if (CONCEPT_MAP[concept].some((term) => hasPhrase(normalized, term))) {
      matched.add(concept)
    }
  })

  return [...matched]
}

export function scoreTextForJob(text: string, profile: JobDescriptionProfile) {
  const normalized = normalizeComparable(text)
  let score = 0

  profile.tokenSet.forEach((term) => {
    if (normalized.includes(term)) {
      score += 4 + Math.min(3, (profile.repeatedTerms.get(term) ?? 1) - 1)
    }
  })

  ;(Object.keys(CONCEPT_MAP) as ConceptKey[]).forEach((concept) => {
    const matches = CONCEPT_MAP[concept].filter((term) => hasPhrase(normalized, term))
    if (matches.length === 0) return

    const conceptWeight =
      concept === "machine_learning" ? 12 : concept === "backend_infrastructure" ? 8 : 6
    score += conceptWeight + matches.length * 2
  })

  return score
}

type MlContext = {
  productLabel: string
  productTargets: string
}

function getMlCompanyContext(sourceText: string): MlContext | null {
  const normalized = normalizeComparable(sourceText)

  if (normalized.includes("prime video")) {
    return {
      productLabel: "Prime Video",
      productTargets: "recommendation, personalization, and content-ranking workflows",
    }
  }

  if (normalized.includes("apple")) {
    return {
      productLabel: "Apple",
      productTargets: "search relevance, experimentation, and user-behavior analytics workflows",
    }
  }

  if (normalized.includes("amazon")) {
    return {
      productLabel: "Amazon",
      productTargets: "ranking, personalization, and experimentation workflows",
    }
  }

  return null
}

function hasAny(normalizedText: string, terms: string[]) {
  return terms.some((term) => normalizedText.includes(normalizeComparable(term)))
}

export function maybeRewriteBulletForJob(params: {
  text: string
  sourceText: string
  profile: JobDescriptionProfile
}) {
  const current = params.text.trim().replace(/\.$/, "")
  const sourceNormalized = normalizeComparable(params.sourceText)
  const textNormalized = normalizeComparable(current)

  if (!params.profile.mlFocused) {
    return {
      text: current,
      matchedTerms: matchedTermsForText(`${current} ${params.sourceText}`, params.profile),
      mlAdjacent: false,
    }
  }

  const context = getMlCompanyContext(params.sourceText)
  const hasDataHooks = hasAny(sourceNormalized, [
    "user",
    "event",
    "data",
    "pipeline",
    "etl",
    "analytics",
    "logging",
    "metrics",
    "dynamodb",
    "postgres",
    "database",
  ])
  const hasExperimentHooks = hasAny(sourceNormalized, [
    "experiment",
    "a/b",
    "ab testing",
    "metrics",
    "evaluation",
    "rollout",
  ])
  const hasBackendHooks = hasAny(sourceNormalized, [
    "crud",
    "api",
    "service",
    "backend",
    "kotlin",
    "aws",
    "database",
    "scalable",
    "scaling",
  ])

  const alreadyMlAdjacent = hasAny(textNormalized, [
    "recommendation",
    "personalization",
    "ranking",
    "experimentation",
    "evaluation",
    "analytics",
  ])

  if (!context || alreadyMlAdjacent || (!hasDataHooks && !hasExperimentHooks && !hasBackendHooks)) {
    return {
      text: current,
      matchedTerms: matchedTermsForText(`${current} ${params.sourceText}`, params.profile),
      mlAdjacent: alreadyMlAdjacent,
    }
  }

  let suffix = ""
  if (hasDataHooks && hasExperimentHooks) {
    suffix = `supporting ${context.productLabel} ${context.productTargets} through user-data pipelines, experimentation, and analytics`
  } else if (hasDataHooks) {
    suffix = `supporting ${context.productLabel} ${context.productTargets} through user-data pipelines and analytics`
  } else if (hasExperimentHooks) {
    suffix = `supporting ${context.productLabel} ${context.productTargets} through experimentation and evaluation`
  } else if (hasBackendHooks) {
    suffix = `supporting backend infrastructure for ${context.productLabel} ${context.productTargets}`
  }

  if (!suffix) {
    return {
      text: current,
      matchedTerms: matchedTermsForText(`${current} ${params.sourceText}`, params.profile),
      mlAdjacent: false,
    }
  }

  const rewritten = `${current}, ${suffix}`
  return {
    text: rewritten,
    matchedTerms: matchedTermsForText(`${rewritten} ${params.sourceText}`, params.profile),
    mlAdjacent: true,
  }
}

export function scoreMlCompanyContext(sourceText: string, profile: JobDescriptionProfile) {
  if (!profile.mlFocused) return 0

  const normalized = normalizeComparable(sourceText)
  if (normalized.includes("prime video")) return 40
  if (normalized.includes("amazon")) return 18
  if (normalized.includes("apple")) return 8
  return 0
}
