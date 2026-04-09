import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib"
import { resumeLayoutConfig } from "@/lib/resumeLayoutConfig"
import { shortenBulletDeterministically } from "@/lib/resumeBullets"
import {
  sortEntriesByPriority,
  sortSkillItemsByRemovalPriority,
  totalSkillItems,
} from "@/lib/resumeGeneration"
import type {
  ResumeCompressionStep,
  ResumeEducationEntry,
  ResumeExperienceEntry,
  ResumeFitResult,
  ResumeProjectEntry,
  ResumeSkillCategory,
  StructuredResume,
} from "@/lib/resumeSchema"

const PAGE_BACKGROUND = rgb(1, 1, 1)
const TEXT_COLOR = rgb(0.05, 0.05, 0.05)
const RULE_COLOR = rgb(0.12, 0.12, 0.12)

type ResumeFonts = {
  regular: PDFFont
  bold: PDFFont
  italic: PDFFont
}

type TextStyle = {
  font: PDFFont
  size: number
}

type LayoutSnapshot = {
  pageWidth: number
  pageHeight: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  contentWidth: number
  availableHeight: number
  typography: {
    headerNameSize: number
    headerContactSize: number
    sectionTitleSize: number
    primaryRowSize: number
    secondaryRowSize: number
    bodySize: number
    bulletSize: number
    lineHeightMultiplier: number
  }
  spacing: {
    headerGap: number
    sectionTop: number
    sectionBottom: number
    rowGap: number
    entryGap: number
    bulletGap: number
    bulletIndent: number
  }
}

type MeasurementResult = {
  fits: boolean
  usedHeight: number
  availableHeight: number
  overflow: number
}

type RenderCursor = {
  page: PDFPage
  y: number
}

function sanitizeText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function compact(values: Array<string | undefined>) {
  return values.map((value) => value?.trim() ?? "").filter(Boolean)
}

function lineHeight(snapshot: LayoutSnapshot, size: number) {
  return size * snapshot.typography.lineHeightMultiplier
}

function textWidth(text: string, style: TextStyle) {
  return style.font.widthOfTextAtSize(text, style.size)
}

function wrapText(text: string, style: TextStyle, maxWidth: number) {
  const normalized = sanitizeText(text)
  if (!normalized) return []

  const words = normalized.split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (!current || textWidth(candidate, style) <= maxWidth) {
      current = candidate
      continue
    }

    lines.push(current)
    current = word
  }

  if (current) lines.push(current)
  return lines
}

function renderDateRange(
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  currentLabel?: string
) {
  const start = compact([startMonth, startYear]).join(" ")
  const end = currentLabel ?? compact([endMonth, endYear]).join(" ")
  if (start && end) return `${start} - ${end}`
  return start || end
}

function createLayoutSnapshot(state: { spacingTightness: number; fontScale: number }): LayoutSnapshot {
  const spacing = resumeLayoutConfig.spacing
  const page = resumeLayoutConfig.page
  const scaled = resumeLayoutConfig.typography

  return {
    pageWidth: page.width,
    pageHeight: page.height,
    marginTop: page.marginTop,
    marginRight: page.marginRight,
    marginBottom: page.marginBottom,
    marginLeft: page.marginLeft,
    contentWidth: page.width - page.marginLeft - page.marginRight,
    availableHeight: page.height - page.marginTop - page.marginBottom,
    typography: {
      headerNameSize: scaled.headerNameSize * state.fontScale,
      headerContactSize: scaled.headerContactSize * state.fontScale,
      sectionTitleSize: scaled.sectionTitleSize * state.fontScale,
      primaryRowSize: scaled.primaryRowSize * state.fontScale,
      secondaryRowSize: scaled.secondaryRowSize * state.fontScale,
      bodySize: scaled.bodySize * state.fontScale,
      bulletSize: scaled.bulletSize * state.fontScale,
      lineHeightMultiplier: scaled.lineHeightMultiplier,
    },
    spacing: {
      headerGap: Math.max(2, spacing.headerGap - state.spacingTightness),
      sectionTop: Math.max(7, spacing.sectionTop - state.spacingTightness),
      sectionBottom: Math.max(4, spacing.sectionBottom - state.spacingTightness),
      rowGap: spacing.rowGap,
      entryGap: Math.max(5, spacing.entryGap - state.spacingTightness),
      bulletGap: Math.max(1, spacing.bulletGap - Math.min(state.spacingTightness, 1)),
      bulletIndent: spacing.bulletIndent,
    },
  }
}

async function loadFonts(document: PDFDocument): Promise<ResumeFonts> {
  return {
    regular: await document.embedFont(StandardFonts.Helvetica),
    bold: await document.embedFont(StandardFonts.HelveticaBold),
    italic: await document.embedFont(StandardFonts.HelveticaOblique),
  }
}

function measureTextLines(lines: string[], snapshot: LayoutSnapshot, size: number) {
  return lines.length * lineHeight(snapshot, size)
}

function measureHeader(
  resume: StructuredResume,
  snapshot: LayoutSnapshot
) {
  const contactLine = compact([
    resume.basics.location,
    resume.basics.phone,
    resume.basics.email,
    resume.basics.linkedIn,
    resume.basics.github,
  ]).join("   |   ")

  return (
    lineHeight(snapshot, snapshot.typography.headerNameSize) +
    snapshot.spacing.headerGap +
    (contactLine ? lineHeight(snapshot, snapshot.typography.headerContactSize) : 0)
  )
}

function measureSectionHeader(snapshot: LayoutSnapshot) {
  return (
    snapshot.spacing.sectionTop +
    lineHeight(snapshot, snapshot.typography.sectionTitleSize) +
    snapshot.spacing.sectionBottom
  )
}

function measureLeftRightRow(
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts,
  leftText: string,
  rightText: string,
  options: {
    leftSize: number
    rightSize: number
    leftFont?: PDFFont
    rightFont?: PDFFont
  }
) {
  const left = sanitizeText(leftText)
  const right = sanitizeText(rightText)
  if (!left && !right) return 0

  const leftStyle = { font: options.leftFont ?? fonts.regular, size: options.leftSize }
  const rightStyle = { font: options.rightFont ?? fonts.regular, size: options.rightSize }
  const rightWidth = right ? textWidth(right, rightStyle) : 0
  const maxLeftWidth = right ? Math.max(120, snapshot.contentWidth - rightWidth - 12) : snapshot.contentWidth
  const wrappedLeft = left ? wrapText(left, leftStyle, maxLeftWidth) : []
  const rowLines = Math.max(wrappedLeft.length || 1, 1)
  return rowLines * lineHeight(snapshot, Math.max(options.leftSize, options.rightSize))
}

function measureBulletList(
  bullets: string[],
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts
) {
  const style = { font: fonts.regular, size: snapshot.typography.bulletSize }
  const maxWidth = snapshot.contentWidth - snapshot.spacing.bulletIndent - 6

  return bullets
    .map((bullet) => wrapText(bullet, style, maxWidth))
    .reduce((total, lines) => {
      if (lines.length === 0) return total
      return total + measureTextLines(lines, snapshot, snapshot.typography.bulletSize) + snapshot.spacing.bulletGap
    }, 0)
}

function measureEducationEntry(
  entry: ResumeEducationEntry,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts
) {
  const academicInfo = compact([
    entry.degree,
    entry.fieldOfStudy,
    entry.minor ? `Minor in ${entry.minor}` : undefined,
  ]).join(", ")
  const supportLine = compact([
    entry.schoolYear ? `Year ${entry.schoolYear}` : undefined,
    entry.gpa ? `GPA ${entry.gpa}` : undefined,
    entry.departmentGpa ? `Department GPA ${entry.departmentGpa}` : undefined,
  ]).join(" | ")
  const courseworkLine = entry.coursework?.length ? `Coursework: ${entry.coursework.join(", ")}` : ""
  const bodyStyle = { font: fonts.regular, size: snapshot.typography.bodySize }

  return (
    measureLeftRightRow(snapshot, fonts, entry.school, entry.college, {
      leftSize: snapshot.typography.primaryRowSize,
      rightSize: snapshot.typography.bodySize,
      leftFont: fonts.bold,
    }) +
    snapshot.spacing.rowGap +
    measureLeftRightRow(
      snapshot,
      fonts,
      academicInfo,
      renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyAttending ? "Present" : undefined
      ),
      {
        leftSize: snapshot.typography.secondaryRowSize,
        rightSize: snapshot.typography.secondaryRowSize,
        leftFont: fonts.italic,
        rightFont: fonts.italic,
      }
    ) +
    (supportLine
      ? measureTextLines(wrapText(supportLine, bodyStyle, snapshot.contentWidth), snapshot, snapshot.typography.bodySize)
      : 0) +
    (courseworkLine
      ? measureTextLines(wrapText(courseworkLine, bodyStyle, snapshot.contentWidth), snapshot, snapshot.typography.bodySize)
      : 0) +
    snapshot.spacing.entryGap
  )
}

function measureExperienceEntry(
  entry: ResumeExperienceEntry,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts
) {
  return (
    measureLeftRightRow(snapshot, fonts, entry.company, renderDateRange(
      entry.startMonth,
      entry.startYear,
      entry.endMonth,
      entry.endYear,
      entry.currentlyWorking ? "Present" : undefined
    ), {
      leftSize: snapshot.typography.primaryRowSize,
      rightSize: snapshot.typography.bodySize,
      leftFont: fonts.bold,
    }) +
    snapshot.spacing.rowGap +
    measureLeftRightRow(
      snapshot,
      fonts,
      compact([entry.title, entry.employmentType]).join(" | "),
      entry.location,
      {
        leftSize: snapshot.typography.secondaryRowSize,
        rightSize: snapshot.typography.secondaryRowSize,
        leftFont: fonts.italic,
        rightFont: fonts.regular,
      }
    ) +
    snapshot.spacing.rowGap +
    measureBulletList(entry.bullets, snapshot, fonts) +
    snapshot.spacing.entryGap
  )
}

function measureProjectEntry(
  entry: ResumeProjectEntry,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts
) {
  return (
    measureLeftRightRow(snapshot, fonts, entry.name, renderDateRange(
      entry.startMonth,
      entry.startYear,
      entry.endMonth,
      entry.endYear,
      entry.currentlyWorking ? "Present" : undefined
    ), {
      leftSize: snapshot.typography.primaryRowSize,
      rightSize: snapshot.typography.bodySize,
      leftFont: fonts.bold,
    }) +
    snapshot.spacing.rowGap +
    measureLeftRightRow(
      snapshot,
      fonts,
      compact([
        entry.role,
        entry.technologies.length ? `Tech: ${entry.technologies.join(", ")}` : undefined,
      ]).join(" | "),
      compact([entry.githubUrl, entry.liveUrl]).join(" | "),
      {
        leftSize: snapshot.typography.secondaryRowSize,
        rightSize: snapshot.typography.secondaryRowSize,
        leftFont: fonts.italic,
        rightFont: fonts.regular,
      }
    ) +
    snapshot.spacing.rowGap +
    measureBulletList(entry.bullets, snapshot, fonts) +
    snapshot.spacing.entryGap
  )
}

function measureSkills(
  categories: ResumeSkillCategory[],
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts
) {
  const labelStyle = { font: fonts.bold, size: snapshot.typography.bodySize }
  const valueStyle = { font: fonts.regular, size: snapshot.typography.bodySize }

  return categories.reduce((total, category) => {
    const label = `${category.label}: `
    const labelWidth = textWidth(label, labelStyle)
    const valueLines = wrapText(
      category.items.map((item) => item.label).join(", "),
      valueStyle,
      Math.max(80, snapshot.contentWidth - labelWidth)
    )

    return total + measureTextLines(valueLines, snapshot, snapshot.typography.bodySize)
  }, 0) + snapshot.spacing.entryGap
}

async function measureResume(
  resume: StructuredResume,
  state: { spacingTightness: number; fontScale: number }
): Promise<MeasurementResult> {
  const document = await PDFDocument.create()
  const fonts = await loadFonts(document)
  const snapshot = createLayoutSnapshot(state)

  let usedHeight = 0
  usedHeight += measureHeader(resume, snapshot)

  if (resume.education.entries.length) {
    usedHeight += measureSectionHeader(snapshot)
    usedHeight += resume.education.entries.reduce(
      (total, entry) => total + measureEducationEntry(entry, snapshot, fonts),
      0
    )
  }

  if (resume.skills.categories.length) {
    usedHeight += measureSectionHeader(snapshot)
    usedHeight += measureSkills(resume.skills.categories, snapshot, fonts)
  }

  if (resume.experience.entries.length) {
    usedHeight += measureSectionHeader(snapshot)
    usedHeight += resume.experience.entries.reduce(
      (total, entry) => total + measureExperienceEntry(entry, snapshot, fonts),
      0
    )
  }

  if (resume.projects.entries.length) {
    usedHeight += measureSectionHeader(snapshot)
    usedHeight += resume.projects.entries.reduce(
      (total, entry) => total + measureProjectEntry(entry, snapshot, fonts),
      0
    )
  }

  const overflow = Math.max(0, usedHeight - snapshot.availableHeight)
  return {
    fits: overflow <= 0,
    usedHeight,
    availableHeight: snapshot.availableHeight,
    overflow,
  }
}

function cloneResume(resume: StructuredResume): StructuredResume {
  return {
    ...resume,
    education: {
      ...resume.education,
      entries: resume.education.entries.map((entry) => ({
        ...entry,
        coursework: entry.coursework ? [...entry.coursework] : [],
      })),
    },
    skills: {
      ...resume.skills,
      categories: resume.skills.categories.map((category) => ({
        ...category,
        items: category.items.map((item) => ({ ...item })),
      })),
    },
    experience: {
      ...resume.experience,
      entries: resume.experience.entries.map((entry) => ({
        ...entry,
        bullets: [...entry.bullets],
      })),
    },
    projects: {
      ...resume.projects,
      entries: resume.projects.entries.map((entry) => ({
        ...entry,
        technologies: [...entry.technologies],
        bullets: [...entry.bullets],
      })),
    },
  }
}

function removeCoursework(resume: StructuredResume) {
  let changed = false
  const entries = resume.education.entries.map((entry) => {
    if (!entry.coursework?.length) return entry
    changed = true
    return {
      ...entry,
      coursework: [],
    }
  })

  if (!changed) return false
  resume.education.entries = entries
  return true
}

function trimSkills(resume: StructuredResume) {
  if (totalSkillItems(resume.skills.categories) <= resumeLayoutConfig.limits.skills.minTotalItems) {
    return false
  }

  const target = sortSkillItemsByRemovalPriority(resume.skills.categories)
    .sort((left, right) => {
      if (left.relevanceScore !== right.relevanceScore) return left.relevanceScore - right.relevanceScore
      if (left.categoryOriginalIndex !== right.categoryOriginalIndex) {
        return right.categoryOriginalIndex - left.categoryOriginalIndex
      }
      return right.itemOriginalIndex - left.itemOriginalIndex
    })[0]

  if (!target) return false

  resume.skills.categories = resume.skills.categories
    .map((category) => {
      if (category.id !== target.categoryId) return category
      return {
        ...category,
        items: category.items.filter((_, index) => index !== target.itemIndex),
      }
    })
    .filter((category) => category.items.length > 0)

  return true
}

function dropLowestPriorityProject(resume: StructuredResume) {
  if (resume.projects.entries.length <= 1) return false

  const ordered = sortEntriesByPriority(resume.projects.entries)
  const toDrop = ordered[ordered.length - 1]
  resume.projects.entries = resume.projects.entries.filter((entry) => entry.id !== toDrop.id)
  return true
}

function reduceRoleBullets(resume: StructuredResume) {
  const maxBullets = resumeLayoutConfig.limits.experience.compressedBulletsPerEntry
  let changed = false
  resume.experience.entries = resume.experience.entries.map((entry) => {
    if (entry.bullets.length <= maxBullets) return entry
    changed = true
    return {
      ...entry,
      bullets: entry.bullets.slice(0, maxBullets),
    }
  })
  return changed
}

function shortenLowestPriorityBullet(resume: StructuredResume) {
  const minimum = resumeLayoutConfig.limits.experience.minCharactersPerBullet
  const step = resumeLayoutConfig.limits.experience.bulletShortenStep

  const candidates = [
    ...resume.experience.entries.flatMap((entry) =>
      entry.bullets.map((bullet, index) => ({
        kind: "experience" as const,
        entryId: entry.id,
        bulletIndex: index,
        bullet,
        score: entry.priority?.relevanceScore ?? 0,
      }))
    ),
    ...resume.projects.entries.flatMap((entry) =>
      entry.bullets.map((bullet, index) => ({
        kind: "project" as const,
        entryId: entry.id,
        bulletIndex: index,
        bullet,
        score: entry.priority?.relevanceScore ?? 0,
      }))
    ),
  ]
    .filter((candidate) => candidate.bullet.length > minimum)
    .sort((left, right) => {
      if (left.score !== right.score) return left.score - right.score
      return right.bullet.length - left.bullet.length
    })

  const target = candidates[0]
  if (!target) return false

  const nextLength = Math.max(minimum, target.bullet.length - step)
  const shortened = shortenBulletDeterministically(target.bullet, nextLength)

  if (!shortened || shortened === target.bullet) return false

  if (target.kind === "experience") {
    resume.experience.entries = resume.experience.entries.map((entry) => {
      if (entry.id !== target.entryId) return entry
      return {
        ...entry,
        bullets: entry.bullets.map((bullet, index) =>
          index === target.bulletIndex ? shortened : bullet
        ),
      }
    })
    return true
  }

  resume.projects.entries = resume.projects.entries.map((entry) => {
    if (entry.id !== target.entryId) return entry
    return {
      ...entry,
      bullets: entry.bullets.map((bullet, index) =>
        index === target.bulletIndex ? shortened : bullet
      ),
    }
  })
  return true
}

function advanceSpacingState(state: { spacingTightness: number; fontScale: number }) {
  if (state.spacingTightness >= resumeLayoutConfig.spacing.minTightness) return false
  state.spacingTightness += 1
  return true
}

function advanceFontState(state: { spacingTightness: number; fontScale: number }) {
  const next = Number(
    Math.max(
      resumeLayoutConfig.typography.minFontScale,
      state.fontScale - resumeLayoutConfig.typography.fontScaleStep
    ).toFixed(2)
  )
  if (next >= state.fontScale) return false
  state.fontScale = next
  return true
}

export async function fitResumeToOnePage(resume: StructuredResume): Promise<ResumeFitResult> {
  const working = cloneResume(resume)
  const state = {
    spacingTightness: 0,
    fontScale: 1,
  }
  const appliedSteps: ResumeCompressionStep[] = []

  for (let pass = 0; pass < resumeLayoutConfig.fitting.maxCompressionPasses; pass += 1) {
    const metrics = await measureResume(working, state)
    if (metrics.fits) {
      return {
        resume: working,
        metrics: {
          pageCount: 1,
          usedHeight: metrics.usedHeight,
          availableHeight: metrics.availableHeight,
          overflow: metrics.overflow,
        },
        appliedSteps,
        layoutState: state,
      }
    }

    if (removeCoursework(working)) {
      appliedSteps.push("remove-coursework")
      continue
    }

    if (trimSkills(working)) {
      appliedSteps.push("trim-skills")
      continue
    }

    if (dropLowestPriorityProject(working)) {
      appliedSteps.push("drop-project")
      continue
    }

    if (reduceRoleBullets(working)) {
      appliedSteps.push("reduce-role-bullets")
      continue
    }

    if (shortenLowestPriorityBullet(working)) {
      appliedSteps.push("shorten-bullet")
      continue
    }

    if (advanceSpacingState(state)) {
      appliedSteps.push("reduce-spacing")
      continue
    }

    if (advanceFontState(state)) {
      appliedSteps.push("reduce-font-size")
      continue
    }

    throw new Error(
      `resume_overflow_unresolved: content still exceeds one page by ${Math.ceil(metrics.overflow)}pt`
    )
  }

  throw new Error("resume_overflow_unresolved: compression pass limit reached")
}

function drawText(page: PDFPage, text: string, x: number, y: number, style: TextStyle) {
  page.drawText(text, {
    x,
    y,
    font: style.font,
    size: style.size,
    color: TEXT_COLOR,
  })
}

function drawWrappedText(
  page: PDFPage,
  cursor: RenderCursor,
  lines: string[],
  x: number,
  snapshot: LayoutSnapshot,
  style: TextStyle
) {
  for (const line of lines) {
    drawText(page, line, x, cursor.y, style)
    cursor.y -= lineHeight(snapshot, style.size)
  }
}

function drawHeader(
  page: PDFPage,
  cursor: RenderCursor,
  resume: StructuredResume,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts
) {
  const nameStyle = { font: fonts.bold, size: snapshot.typography.headerNameSize }
  const contactStyle = { font: fonts.regular, size: snapshot.typography.headerContactSize }
  const contactLine = compact([
    resume.basics.location,
    resume.basics.phone,
    resume.basics.email,
    resume.basics.linkedIn,
    resume.basics.github,
  ]).join("   |   ")
  const nameWidth = textWidth(resume.basics.fullName, nameStyle)

  drawText(
    page,
    resume.basics.fullName,
    (snapshot.pageWidth - nameWidth) / 2,
    cursor.y,
    nameStyle
  )
  cursor.y -= lineHeight(snapshot, snapshot.typography.headerNameSize) + snapshot.spacing.headerGap

  if (!contactLine) return
  const contactWidth = textWidth(contactLine, contactStyle)
  drawText(page, contactLine, (snapshot.pageWidth - contactWidth) / 2, cursor.y, contactStyle)
  cursor.y -= lineHeight(snapshot, snapshot.typography.headerContactSize)
}

function drawSectionHeader(
  page: PDFPage,
  cursor: RenderCursor,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts,
  title: string
) {
  cursor.y -= snapshot.spacing.sectionTop
  const style = { font: fonts.bold, size: snapshot.typography.sectionTitleSize }
  drawText(page, title.toUpperCase(), snapshot.marginLeft, cursor.y, style)
  const ruleY = cursor.y - 1.5
  page.drawLine({
    start: { x: snapshot.marginLeft, y: ruleY },
    end: { x: snapshot.pageWidth - snapshot.marginRight, y: ruleY },
    thickness: 0.75,
    color: RULE_COLOR,
  })
  cursor.y -= lineHeight(snapshot, snapshot.typography.sectionTitleSize) + snapshot.spacing.sectionBottom
}

function drawLeftRightRow(
  page: PDFPage,
  cursor: RenderCursor,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts,
  leftText: string,
  rightText: string,
  options: {
    leftSize: number
    rightSize: number
    leftFont?: PDFFont
    rightFont?: PDFFont
  }
) {
  const left = sanitizeText(leftText)
  const right = sanitizeText(rightText)
  if (!left && !right) return

  const leftStyle = { font: options.leftFont ?? fonts.regular, size: options.leftSize }
  const rightStyle = { font: options.rightFont ?? fonts.regular, size: options.rightSize }
  const rightWidth = right ? textWidth(right, rightStyle) : 0
  const maxLeftWidth = right ? Math.max(120, snapshot.contentWidth - rightWidth - 12) : snapshot.contentWidth
  const leftLines = left ? wrapText(left, leftStyle, maxLeftWidth) : []
  const step = lineHeight(snapshot, Math.max(options.leftSize, options.rightSize))
  let lineY = cursor.y

  leftLines.forEach((line, index) => {
    drawText(page, line, snapshot.marginLeft, lineY, leftStyle)
    if (index === 0 && right) {
      drawText(
        page,
        right,
        snapshot.pageWidth - snapshot.marginRight - rightWidth,
        lineY,
        rightStyle
      )
    }
    lineY -= step
  })

  if (leftLines.length === 0 && right) {
    drawText(
      page,
      right,
      snapshot.pageWidth - snapshot.marginRight - rightWidth,
      cursor.y,
      rightStyle
    )
  }

  cursor.y -= Math.max(leftLines.length || 1, 1) * step
}

function drawBulletList(
  page: PDFPage,
  cursor: RenderCursor,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts,
  bullets: string[]
) {
  const style = { font: fonts.regular, size: snapshot.typography.bulletSize }
  const bulletStyle = { font: fonts.regular, size: snapshot.typography.bulletSize }
  const maxWidth = snapshot.contentWidth - snapshot.spacing.bulletIndent - 6

  for (const bullet of bullets) {
    const lines = wrapText(bullet, style, maxWidth)
    lines.forEach((line, index) => {
      if (index === 0) {
        drawText(page, "\u2022", snapshot.marginLeft + 2, cursor.y, bulletStyle)
      }
      drawText(page, line, snapshot.marginLeft + snapshot.spacing.bulletIndent, cursor.y, style)
      cursor.y -= lineHeight(snapshot, snapshot.typography.bulletSize)
    })
    cursor.y -= snapshot.spacing.bulletGap
  }
}

function drawEducationSection(
  page: PDFPage,
  cursor: RenderCursor,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts,
  entries: ResumeEducationEntry[]
) {
  for (const entry of entries) {
    drawLeftRightRow(page, cursor, snapshot, fonts, entry.school, entry.college, {
      leftSize: snapshot.typography.primaryRowSize,
      rightSize: snapshot.typography.bodySize,
      leftFont: fonts.bold,
    })
    cursor.y -= snapshot.spacing.rowGap
    drawLeftRightRow(
      page,
      cursor,
      snapshot,
      fonts,
      compact([
        entry.degree,
        entry.fieldOfStudy,
        entry.minor ? `Minor in ${entry.minor}` : undefined,
      ]).join(", "),
      renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyAttending ? "Present" : undefined
      ),
      {
        leftSize: snapshot.typography.secondaryRowSize,
        rightSize: snapshot.typography.secondaryRowSize,
        leftFont: fonts.italic,
        rightFont: fonts.italic,
      }
    )

    const bodyStyle = { font: fonts.regular, size: snapshot.typography.bodySize }
    const supportLine = compact([
      entry.schoolYear ? `Year ${entry.schoolYear}` : undefined,
      entry.gpa ? `GPA ${entry.gpa}` : undefined,
      entry.departmentGpa ? `Department GPA ${entry.departmentGpa}` : undefined,
    ]).join(" | ")
    if (supportLine) {
      drawWrappedText(
        page,
        cursor,
        wrapText(supportLine, bodyStyle, snapshot.contentWidth),
        snapshot.marginLeft,
        snapshot,
        bodyStyle
      )
    }
    if (entry.coursework?.length) {
      drawWrappedText(
        page,
        cursor,
        wrapText(`Coursework: ${entry.coursework.join(", ")}`, bodyStyle, snapshot.contentWidth),
        snapshot.marginLeft,
        snapshot,
        bodyStyle
      )
    }
    cursor.y -= snapshot.spacing.entryGap
  }
}

function drawSkillsSection(
  page: PDFPage,
  cursor: RenderCursor,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts,
  categories: ResumeSkillCategory[]
) {
  const labelStyle = { font: fonts.bold, size: snapshot.typography.bodySize }
  const valueStyle = { font: fonts.regular, size: snapshot.typography.bodySize }

  for (const category of categories) {
    const label = `${category.label}: `
    const labelWidth = textWidth(label, labelStyle)
    const lines = wrapText(
      category.items.map((item) => item.label).join(", "),
      valueStyle,
      Math.max(80, snapshot.contentWidth - labelWidth)
    )

    lines.forEach((line, index) => {
      if (index === 0) {
        drawText(page, label, snapshot.marginLeft, cursor.y, labelStyle)
        drawText(page, line, snapshot.marginLeft + labelWidth, cursor.y, valueStyle)
      } else {
        drawText(page, line, snapshot.marginLeft + labelWidth, cursor.y, valueStyle)
      }
      cursor.y -= lineHeight(snapshot, snapshot.typography.bodySize)
    })
  }

  cursor.y -= snapshot.spacing.entryGap
}

function drawExperienceSection(
  page: PDFPage,
  cursor: RenderCursor,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts,
  entries: ResumeExperienceEntry[]
) {
  for (const entry of entries) {
    drawLeftRightRow(
      page,
      cursor,
      snapshot,
      fonts,
      entry.company,
      renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyWorking ? "Present" : undefined
      ),
      {
        leftSize: snapshot.typography.primaryRowSize,
        rightSize: snapshot.typography.bodySize,
        leftFont: fonts.bold,
      }
    )
    cursor.y -= snapshot.spacing.rowGap
    drawLeftRightRow(
      page,
      cursor,
      snapshot,
      fonts,
      compact([entry.title, entry.employmentType]).join(" | "),
      entry.location,
      {
        leftSize: snapshot.typography.secondaryRowSize,
        rightSize: snapshot.typography.secondaryRowSize,
        leftFont: fonts.italic,
        rightFont: fonts.regular,
      }
    )
    cursor.y -= snapshot.spacing.rowGap
    drawBulletList(page, cursor, snapshot, fonts, entry.bullets)
    cursor.y -= snapshot.spacing.entryGap
  }
}

function drawProjectSection(
  page: PDFPage,
  cursor: RenderCursor,
  snapshot: LayoutSnapshot,
  fonts: ResumeFonts,
  entries: ResumeProjectEntry[]
) {
  for (const entry of entries) {
    drawLeftRightRow(
      page,
      cursor,
      snapshot,
      fonts,
      entry.name,
      renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyWorking ? "Present" : undefined
      ),
      {
        leftSize: snapshot.typography.primaryRowSize,
        rightSize: snapshot.typography.bodySize,
        leftFont: fonts.bold,
      }
    )
    cursor.y -= snapshot.spacing.rowGap
    drawLeftRightRow(
      page,
      cursor,
      snapshot,
      fonts,
      compact([
        entry.role,
        entry.technologies.length ? `Tech: ${entry.technologies.join(", ")}` : undefined,
      ]).join(" | "),
      compact([entry.githubUrl, entry.liveUrl]).join(" | "),
      {
        leftSize: snapshot.typography.secondaryRowSize,
        rightSize: snapshot.typography.secondaryRowSize,
        leftFont: fonts.italic,
        rightFont: fonts.regular,
      }
    )
    cursor.y -= snapshot.spacing.rowGap
    drawBulletList(page, cursor, snapshot, fonts, entry.bullets)
    cursor.y -= snapshot.spacing.entryGap
  }
}

export async function renderResumeAsPdf(resume: StructuredResume) {
  const fit = await fitResumeToOnePage(resume)
  const snapshot = createLayoutSnapshot(fit.layoutState)
  const document = await PDFDocument.create()
  const fonts = await loadFonts(document)
  const page = document.addPage([snapshot.pageWidth, snapshot.pageHeight])
  page.drawRectangle({
    x: 0,
    y: 0,
    width: snapshot.pageWidth,
    height: snapshot.pageHeight,
    color: PAGE_BACKGROUND,
  })

  const cursor: RenderCursor = {
    page,
    y: snapshot.pageHeight - snapshot.marginTop,
  }

  drawHeader(page, cursor, fit.resume, snapshot, fonts)

  if (fit.resume.education.entries.length) {
    drawSectionHeader(page, cursor, snapshot, fonts, "Education")
    drawEducationSection(page, cursor, snapshot, fonts, fit.resume.education.entries)
  }

  if (fit.resume.skills.categories.length) {
    drawSectionHeader(page, cursor, snapshot, fonts, "Skills")
    drawSkillsSection(page, cursor, snapshot, fonts, fit.resume.skills.categories)
  }

  if (fit.resume.experience.entries.length) {
    drawSectionHeader(page, cursor, snapshot, fonts, "Experience")
    drawExperienceSection(page, cursor, snapshot, fonts, fit.resume.experience.entries)
  }

  if (fit.resume.projects.entries.length) {
    drawSectionHeader(page, cursor, snapshot, fonts, "Projects")
    drawProjectSection(page, cursor, snapshot, fonts, fit.resume.projects.entries)
  }

  const bytes = await document.save()
  return {
    pdf: Buffer.from(bytes),
    fit,
  }
}

export async function measureStructuredResume(resume: StructuredResume) {
  return measureResume(resume, {
    spacingTightness: 0,
    fontScale: 1,
  })
}
