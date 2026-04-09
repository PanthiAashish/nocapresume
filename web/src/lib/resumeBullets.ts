function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function dedupeTerminalPunctuation(value: string) {
  return value.replace(/([.!?;,])(?:\s*[.!?;,])+$/g, "$1")
}

function trimAtWordBoundary(value: string, maxCharacters: number) {
  if (value.length <= maxCharacters) return value

  const sliced = value.slice(0, maxCharacters + 1)
  const lastBoundary = Math.max(
    sliced.lastIndexOf(" "),
    sliced.lastIndexOf(","),
    sliced.lastIndexOf(";")
  )
  const trimmed = (lastBoundary > 40 ? sliced.slice(0, lastBoundary) : sliced.slice(0, maxCharacters))
    .trim()
    .replace(/[,:;.\-]+$/g, "")

  return trimmed || value.slice(0, maxCharacters).trim()
}

function shortenByClause(value: string, maxCharacters: number) {
  if (value.length <= maxCharacters) return value

  const clause = value.split(/[;:]/)[0]?.trim() ?? value
  if (clause.length <= maxCharacters) return clause

  const withoutTrailingClause = value.split(",").slice(0, -1).join(",").trim()
  if (withoutTrailingClause && withoutTrailingClause.length <= maxCharacters) {
    return withoutTrailingClause
  }

  return trimAtWordBoundary(value, maxCharacters)
}

export function normalizeBulletText(
  value: string,
  options: {
    maxCharacters?: number
    deterministicShorten?: boolean
  } = {}
) {
  let normalized = collapseWhitespace(value.replace(/^[•*\-\s]+/, ""))
  normalized = dedupeTerminalPunctuation(normalized)

  if (!normalized) return ""

  if (options.maxCharacters && normalized.length > options.maxCharacters) {
    normalized = options.deterministicShorten
      ? shortenByClause(normalized, options.maxCharacters)
      : trimAtWordBoundary(normalized, options.maxCharacters)
  }

  return dedupeTerminalPunctuation(normalized)
}

export function shortenBulletDeterministically(value: string, maxCharacters: number) {
  return normalizeBulletText(value, {
    maxCharacters,
    deterministicShorten: true,
  })
}

export function normalizeBulletList(
  bullets: string[],
  options: {
    maxCharacters?: number
    deterministicShorten?: boolean
    maxItems?: number
  } = {}
) {
  const normalized = bullets
    .map((bullet) => normalizeBulletText(bullet, options))
    .filter(Boolean)

  return typeof options.maxItems === "number"
    ? normalized.slice(0, options.maxItems)
    : normalized
}
