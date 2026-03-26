import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib"
import type { GeneratedResume } from "@/lib/resumeGeneration"

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN_X = 44
const MARGIN_TOP = 46
const MARGIN_BOTTOM = 42
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
const HEADER_NAME_SIZE = 22
const HEADER_CONTACT_SIZE = 9.5
const SECTION_TITLE_SIZE = 10.5
const PRIMARY_ROW_SIZE = 10.5
const SECONDARY_ROW_SIZE = 9.5
const BODY_SIZE = 9
const BULLET_SIZE = 8.9
const ENTRY_GAP = 10
const SECTION_TOP_GAP = 14
const SECTION_BOTTOM_GAP = 8
const BULLET_INDENT = 11
const ROW_GAP = 2
const LINE_COLOR = rgb(0, 0, 0)
const TEXT_COLOR = rgb(0, 0, 0)
const PAGE_BACKGROUND = rgb(1, 1, 1)

type ResumeFonts = {
  regular: PDFFont
  bold: PDFFont
  italic: PDFFont
}

type RendererContext = {
  document: PDFDocument
  page: PDFPage
  fonts: ResumeFonts
  cursorY: number
}

type WrappedLine = {
  text: string
  width: number
}

type TextStyle = {
  font: PDFFont
  size: number
}

function compact(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim() ?? "").filter(Boolean)
}

function sanitizeText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function createPage(document: PDFDocument) {
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: PAGE_BACKGROUND,
  })
  return page
}

function createContext(document: PDFDocument, fonts: ResumeFonts): RendererContext {
  return {
    document,
    page: createPage(document),
    fonts,
    cursorY: PAGE_HEIGHT - MARGIN_TOP,
  }
}

function paginateIfNeeded(ctx: RendererContext, requiredHeight: number) {
  if (ctx.cursorY - requiredHeight >= MARGIN_BOTTOM) return
  ctx.page = createPage(ctx.document)
  ctx.cursorY = PAGE_HEIGHT - MARGIN_TOP
}

function moveCursor(ctx: RendererContext, amount: number) {
  ctx.cursorY -= amount
}

function drawEntrySpacing(ctx: RendererContext, amount = ENTRY_GAP) {
  moveCursor(ctx, amount)
}

function lineHeight(fontSize: number, multiplier = 1.18) {
  return fontSize * multiplier
}

function textWidth(text: string, style: TextStyle) {
  return style.font.widthOfTextAtSize(text, style.size)
}

function wrapText(text: string, style: TextStyle, maxWidth: number) {
  const normalized = sanitizeText(text)
  if (!normalized) return []

  const words = normalized.split(" ")
  const lines: WrappedLine[] = []
  let current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    const candidateWidth = textWidth(candidate, style)

    if (!current || candidateWidth <= maxWidth) {
      current = candidate
      continue
    }

    lines.push({ text: current, width: textWidth(current, style) })
    current = word
  }

  if (current) lines.push({ text: current, width: textWidth(current, style) })
  return lines
}

function drawText(
  ctx: RendererContext,
  text: string,
  x: number,
  y: number,
  style: TextStyle
) {
  ctx.page.drawText(text, {
    x,
    y,
    font: style.font,
    size: style.size,
    color: TEXT_COLOR,
  })
}

function drawCenteredText(
  ctx: RendererContext,
  text: string,
  style: TextStyle,
  spacingAfter: number
) {
  const normalized = sanitizeText(text)
  if (!normalized) return
  paginateIfNeeded(ctx, lineHeight(style.size))
  const width = textWidth(normalized, style)
  drawText(ctx, normalized, (PAGE_WIDTH - width) / 2, ctx.cursorY, style)
  moveCursor(ctx, lineHeight(style.size) + spacingAfter)
}

function measureCenteredTextBlock(text: string, style: TextStyle, spacingAfter: number) {
  if (!sanitizeText(text)) return 0
  return lineHeight(style.size) + spacingAfter
}

function drawSectionHeader(ctx: RendererContext, title: string) {
  const normalized = sanitizeText(title).toUpperCase()
  const style = { font: ctx.fonts.bold, size: SECTION_TITLE_SIZE }
  const ruleY = ctx.cursorY - lineHeight(style.size) + 2

  paginateIfNeeded(
    ctx,
    SECTION_TOP_GAP + lineHeight(style.size) + SECTION_BOTTOM_GAP + 4
  )
  moveCursor(ctx, SECTION_TOP_GAP)
  drawText(ctx, normalized, MARGIN_X, ctx.cursorY, style)
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: ruleY - 2 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: ruleY - 2 },
    thickness: 0.75,
    color: LINE_COLOR,
  })
  moveCursor(ctx, lineHeight(style.size) + SECTION_BOTTOM_GAP)
}

function drawWrappedLines(
  ctx: RendererContext,
  lines: WrappedLine[],
  x: number,
  style: TextStyle,
  spacingAfter = 0
) {
  if (lines.length === 0) return
  const step = lineHeight(style.size)
  paginateIfNeeded(ctx, lines.length * step + spacingAfter)
  for (const line of lines) {
    drawText(ctx, line.text, x, ctx.cursorY, style)
    moveCursor(ctx, step)
  }
  if (spacingAfter) moveCursor(ctx, spacingAfter)
}

function drawLeftRightTextRow(
  ctx: RendererContext,
  leftText: string,
  rightText: string,
  options: {
    leftStyle: TextStyle
    rightStyle: TextStyle
    spacingAfter?: number
    rightGap?: number
  }
) {
  const left = sanitizeText(leftText)
  const right = sanitizeText(rightText)
  if (!left && !right) return 0

  const rightGap = options.rightGap ?? 14
  const rightWidth = right ? textWidth(right, options.rightStyle) : 0
  const leftMaxWidth = right
    ? Math.max(120, CONTENT_WIDTH - rightWidth - rightGap)
    : CONTENT_WIDTH
  const wrappedLeft = left ? wrapText(left, options.leftStyle, leftMaxWidth) : []
  const rowHeight = Math.max(
    wrappedLeft.length || 1,
    1
  ) * lineHeight(options.leftStyle.size)

  paginateIfNeeded(ctx, rowHeight + (options.spacingAfter ?? 0))

  if (wrappedLeft.length === 0 && right) {
    drawText(
      ctx,
      right,
      PAGE_WIDTH - MARGIN_X - rightWidth,
      ctx.cursorY,
      options.rightStyle
    )
  } else {
    const leftStep = lineHeight(options.leftStyle.size)
    let lineY = ctx.cursorY

    wrappedLeft.forEach((line, index) => {
      drawText(ctx, line.text, MARGIN_X, lineY, options.leftStyle)
      if (index === 0 && right) {
        drawText(
          ctx,
          right,
          PAGE_WIDTH - MARGIN_X - rightWidth,
          lineY,
          options.rightStyle
        )
      }
      lineY -= leftStep
    })

    if (wrappedLeft.length === 0 && right) {
      drawText(
        ctx,
        right,
        PAGE_WIDTH - MARGIN_X - rightWidth,
        ctx.cursorY,
        options.rightStyle
      )
    }
  }

  moveCursor(ctx, rowHeight + (options.spacingAfter ?? 0))
  return rowHeight + (options.spacingAfter ?? 0)
}

function measureLeftRightTextRow(
  ctx: RendererContext,
  leftText: string,
  rightText: string,
  options: {
    leftStyle: TextStyle
    rightStyle: TextStyle
    spacingAfter?: number
    rightGap?: number
  }
) {
  const left = sanitizeText(leftText)
  const right = sanitizeText(rightText)
  if (!left && !right) return 0

  const rightGap = options.rightGap ?? 14
  const rightWidth = right ? textWidth(right, options.rightStyle) : 0
  const leftMaxWidth = right
    ? Math.max(120, CONTENT_WIDTH - rightWidth - rightGap)
    : CONTENT_WIDTH
  const wrappedLeft = left ? wrapText(left, options.leftStyle, leftMaxWidth) : []
  const rowHeight = Math.max(wrappedLeft.length || 1, 1) * lineHeight(options.leftStyle.size)
  return rowHeight + (options.spacingAfter ?? 0)
}

function drawWrappedBulletList(
  ctx: RendererContext,
  bullets: string[],
  style: TextStyle
) {
  const cleanBullets = bullets.map(sanitizeText).filter(Boolean)
  if (cleanBullets.length === 0) return 0

  const availableWidth = CONTENT_WIDTH - BULLET_INDENT - 6
  let totalHeight = 0

  cleanBullets.forEach((bullet) => {
    const wrapped = wrapText(bullet, style, availableWidth)
    const blockHeight = wrapped.length * lineHeight(style.size) + 2
    paginateIfNeeded(ctx, blockHeight)

    wrapped.forEach((line, index) => {
      if (index === 0) {
        drawText(ctx, "\u2022", MARGIN_X + 2, ctx.cursorY + 1, {
          font: ctx.fonts.regular,
          size: style.size,
        })
      }
      drawText(ctx, line.text, MARGIN_X + BULLET_INDENT, ctx.cursorY, style)
      moveCursor(ctx, lineHeight(style.size))
    })

    moveCursor(ctx, 2)
    totalHeight += blockHeight
  })

  return totalHeight
}

function measureWrappedBulletList(
  ctx: RendererContext,
  bullets: string[],
  style: TextStyle
) {
  const availableWidth = CONTENT_WIDTH - BULLET_INDENT - 6
  return bullets
    .map(sanitizeText)
    .filter(Boolean)
    .reduce((total, bullet) => {
      const wrapped = wrapText(bullet, style, availableWidth)
      return total + wrapped.length * lineHeight(style.size) + 2
    }, 0)
}

function drawWrappedLabelValueLine(
  ctx: RendererContext,
  label: string,
  value: string,
  styles: {
    label: TextStyle
    value: TextStyle
  }
) {
  const cleanLabel = sanitizeText(label)
  const cleanValue = sanitizeText(value)
  if (!cleanLabel || !cleanValue) return 0

  const labelWithColon = `${cleanLabel}: `
  const labelWidth = textWidth(labelWithColon, styles.label)
  const valueWidth = Math.max(40, CONTENT_WIDTH - labelWidth)
  const wrappedValue = wrapText(cleanValue, styles.value, valueWidth)
  const totalHeight = wrappedValue.length * lineHeight(styles.value.size)

  paginateIfNeeded(ctx, totalHeight)
  wrappedValue.forEach((line, index) => {
    if (index === 0) {
      drawText(ctx, labelWithColon, MARGIN_X, ctx.cursorY, styles.label)
      drawText(ctx, line.text, MARGIN_X + labelWidth, ctx.cursorY, styles.value)
    } else {
      drawText(ctx, line.text, MARGIN_X + labelWidth, ctx.cursorY, styles.value)
    }
    moveCursor(ctx, lineHeight(styles.value.size))
  })

  return totalHeight
}

function measureWrappedLabelValueLine(
  ctx: RendererContext,
  label: string,
  value: string,
  styles: {
    label: TextStyle
    value: TextStyle
  }
) {
  const cleanLabel = sanitizeText(label)
  const cleanValue = sanitizeText(value)
  if (!cleanLabel || !cleanValue) return 0
  const labelWithColon = `${cleanLabel}: `
  const labelWidth = textWidth(labelWithColon, styles.label)
  const valueWidth = Math.max(40, CONTENT_WIDTH - labelWidth)
  const wrappedValue = wrapText(cleanValue, styles.value, valueWidth)
  return wrappedValue.length * lineHeight(styles.value.size)
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

function educationEntryHeight(ctx: RendererContext, entry: GeneratedResume["education"][number]) {
  const bold = { font: ctx.fonts.bold, size: PRIMARY_ROW_SIZE }
  const italic = { font: ctx.fonts.italic, size: SECONDARY_ROW_SIZE }
  const regular = { font: ctx.fonts.regular, size: BODY_SIZE }

  let height = 0
  height += measureLeftRightTextRow(
    ctx,
    compact([entry.school]).join(""),
    entry.college,
    { leftStyle: bold, rightStyle: regular, spacingAfter: ROW_GAP }
  )
  height += measureLeftRightTextRow(
    ctx,
    compact([
      entry.degree,
      entry.fieldOfStudy,
      entry.minor ? `Minor in ${entry.minor}` : "",
    ]).join(", "),
    renderDateRange(
      entry.startMonth,
      entry.startYear,
      entry.endMonth,
      entry.endYear,
      entry.currentlyAttending ? "Present" : undefined
    ),
    { leftStyle: italic, rightStyle: italic, spacingAfter: ROW_GAP }
  )
  height += measureWrappedLabelValueLine(ctx, "Academic Info", compact([
    entry.schoolYear ? `Year ${entry.schoolYear}` : "",
    entry.gpa ? `GPA ${entry.gpa}` : "",
    entry.departmentGpa ? `Department GPA ${entry.departmentGpa}` : "",
  ]).join(" | "), { label: regular, value: regular })
  height += entry.description
    ? wrapText(entry.description, regular, CONTENT_WIDTH).length * lineHeight(BODY_SIZE)
    : 0
  return height + ENTRY_GAP
}

function drawEducationEntry(ctx: RendererContext, entry: GeneratedResume["education"][number]) {
  const bold = { font: ctx.fonts.bold, size: PRIMARY_ROW_SIZE }
  const italic = { font: ctx.fonts.italic, size: SECONDARY_ROW_SIZE }
  const regular = { font: ctx.fonts.regular, size: BODY_SIZE }

  paginateIfNeeded(ctx, educationEntryHeight(ctx, entry))
  drawLeftRightTextRow(ctx, entry.school, entry.college, {
    leftStyle: bold,
    rightStyle: regular,
    spacingAfter: ROW_GAP,
  })
  drawLeftRightTextRow(
    ctx,
    compact([
      entry.degree,
      entry.fieldOfStudy,
      entry.minor ? `Minor in ${entry.minor}` : "",
    ]).join(", "),
    renderDateRange(
      entry.startMonth,
      entry.startYear,
      entry.endMonth,
      entry.endYear,
      entry.currentlyAttending ? "Present" : undefined
    ),
    {
      leftStyle: italic,
      rightStyle: italic,
      spacingAfter: ROW_GAP,
    }
  )

  const academicInfo = compact([
    entry.schoolYear ? `Year ${entry.schoolYear}` : "",
    entry.gpa ? `GPA ${entry.gpa}` : "",
    entry.departmentGpa ? `Department GPA ${entry.departmentGpa}` : "",
  ]).join(" | ")

  if (academicInfo) {
    drawWrappedLabelValueLine(ctx, "Academic Info", academicInfo, {
      label: regular,
      value: regular,
    })
  }

  if (entry.description) {
    const wrapped = wrapText(entry.description, regular, CONTENT_WIDTH)
    drawWrappedLines(ctx, wrapped, MARGIN_X, regular)
  }

  drawEntrySpacing(ctx)
}

function drawSkillsSection(ctx: RendererContext, skills: GeneratedResume["skills"]) {
  const labelStyle = { font: ctx.fonts.bold, size: BODY_SIZE }
  const valueStyle = { font: ctx.fonts.regular, size: BODY_SIZE }
  ;[
    ["Programming Languages", skills.languages],
    ["Frameworks", skills.frameworks],
    ["Technologies", skills.tools],
    ["Databases", skills.databases],
    ["Cloud", skills.cloud],
    ["Other", skills.other],
  ]
    .filter(([, value]) => value.trim())
    .forEach(([label, value]) => {
      paginateIfNeeded(
        ctx,
        measureWrappedLabelValueLine(ctx, label, value, {
          label: labelStyle,
          value: valueStyle,
        })
      )
      drawWrappedLabelValueLine(ctx, label, value, {
        label: labelStyle,
        value: valueStyle,
      })
    })
  drawEntrySpacing(ctx, 6)
}

function genericEntryHeight(
  ctx: RendererContext,
  input: {
    title: string
    rightPrimary: string
    subtitle: string
    rightSecondary: string
    description?: string
    bullets: string[]
  }
) {
  const bold = { font: ctx.fonts.bold, size: PRIMARY_ROW_SIZE }
  const italic = { font: ctx.fonts.italic, size: SECONDARY_ROW_SIZE }
  const regular = { font: ctx.fonts.regular, size: BODY_SIZE }
  const bulletStyle = { font: ctx.fonts.regular, size: BULLET_SIZE }

  let height = 0
  height += measureLeftRightTextRow(ctx, input.title, input.rightPrimary, {
    leftStyle: bold,
    rightStyle: regular,
    spacingAfter: ROW_GAP,
  })
  height += measureLeftRightTextRow(ctx, input.subtitle, input.rightSecondary, {
    leftStyle: italic,
    rightStyle: regular,
    spacingAfter: ROW_GAP,
  })
  height += input.description
    ? wrapText(input.description, regular, CONTENT_WIDTH).length * lineHeight(BODY_SIZE)
    : 0
  height += measureWrappedBulletList(ctx, input.bullets, bulletStyle)
  return height + ENTRY_GAP
}

function drawGenericEntry(
  ctx: RendererContext,
  input: {
    title: string
    rightPrimary: string
    subtitle: string
    rightSecondary: string
    description?: string
    bullets: string[]
  }
) {
  const bold = { font: ctx.fonts.bold, size: PRIMARY_ROW_SIZE }
  const italic = { font: ctx.fonts.italic, size: SECONDARY_ROW_SIZE }
  const regular = { font: ctx.fonts.regular, size: BODY_SIZE }
  const bulletStyle = { font: ctx.fonts.regular, size: BULLET_SIZE }

  paginateIfNeeded(ctx, genericEntryHeight(ctx, input))
  drawLeftRightTextRow(ctx, input.title, input.rightPrimary, {
    leftStyle: bold,
    rightStyle: regular,
    spacingAfter: ROW_GAP,
  })
  drawLeftRightTextRow(ctx, input.subtitle, input.rightSecondary, {
    leftStyle: italic,
    rightStyle: regular,
    spacingAfter: ROW_GAP,
  })

  if (input.description) {
    const wrapped = wrapText(input.description, regular, CONTENT_WIDTH)
    drawWrappedLines(ctx, wrapped, MARGIN_X, regular)
  }

  drawWrappedBulletList(ctx, input.bullets, bulletStyle)
  drawEntrySpacing(ctx)
}

export async function renderResumeAsPdf(resume: GeneratedResume) {
  const document = await PDFDocument.create()
  const fonts: ResumeFonts = {
    regular: await document.embedFont(StandardFonts.Helvetica),
    bold: await document.embedFont(StandardFonts.HelveticaBold),
    italic: await document.embedFont(StandardFonts.HelveticaOblique),
  }
  const ctx = createContext(document, fonts)

  const headerNameStyle = { font: fonts.bold, size: HEADER_NAME_SIZE }
  const headerContactStyle = { font: fonts.regular, size: HEADER_CONTACT_SIZE }
  const contactLine = compact([
    resume.header.location,
    resume.header.phone,
    resume.header.email,
    resume.header.linkedIn,
    resume.header.github,
  ]).join("   |   ")

  paginateIfNeeded(
    ctx,
    measureCenteredTextBlock(resume.header.fullName || "Resume", headerNameStyle, 2) +
      measureCenteredTextBlock(contactLine, headerContactStyle, 4)
  )
  drawCenteredText(ctx, resume.header.fullName || "Resume", headerNameStyle, 2)
  drawCenteredText(ctx, contactLine, headerContactStyle, 4)

  drawSectionHeader(ctx, "Education")
  resume.education.forEach((entry) => drawEducationEntry(ctx, entry))

  drawSectionHeader(ctx, "Skills")
  drawSkillsSection(ctx, resume.skills)

  drawSectionHeader(ctx, "Experience")
  resume.experience.forEach((entry) =>
    drawGenericEntry(ctx, {
      title: entry.company,
      rightPrimary: renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyWorking ? "Present" : undefined
      ),
      subtitle: compact([entry.title, entry.employmentType]).join(" | "),
      rightSecondary: entry.location,
      description: entry.description,
      bullets: entry.bullets
        .split("\n")
        .map((bullet) => bullet.trim())
        .filter(Boolean),
    })
  )

  drawSectionHeader(ctx, "Projects")
  resume.projects.forEach((entry) =>
    drawGenericEntry(ctx, {
      title: entry.name,
      rightPrimary: renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyWorking ? "Present" : undefined
      ),
      subtitle: compact([
        entry.role,
        entry.technologies ? `Tech: ${entry.technologies}` : "",
      ]).join(" | "),
      rightSecondary: compact([entry.githubUrl, entry.liveUrl]).join(" | "),
      description: entry.description,
      bullets: entry.bullets
        .split("\n")
        .map((bullet) => bullet.trim())
        .filter(Boolean),
    })
  )

  drawSectionHeader(ctx, "Leadership & Engagement")
  resume.leadership.forEach((entry) =>
    drawGenericEntry(ctx, {
      title: entry.organization,
      rightPrimary: renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear
      ),
      subtitle: entry.title,
      rightSecondary: entry.location,
      description: entry.description,
      bullets: entry.bullets
        .split("\n")
        .map((bullet) => bullet.trim())
        .filter(Boolean),
    })
  )

  const bytes = await document.save()
  return Buffer.from(bytes)
}
