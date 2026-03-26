import type { GeneratedResume } from "@/lib/resumeGeneration"

function compact(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim() ?? "").filter(Boolean)
}

function escapeLatex(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
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
  if (start && end) return `${start} -- ${end}`
  return start || end
}

function renderBulletItems(bullets: string[]) {
  const cleanBullets = bullets.map((bullet) => bullet.trim()).filter(Boolean)
  if (cleanBullets.length === 0) return ""

  return [
    "\\begin{itemize}",
    ...cleanBullets.map((bullet) => `  \\item ${escapeLatex(bullet)}`),
    "\\end{itemize}",
  ].join("\n")
}

function renderHeaderFragment(resume: GeneratedResume) {
  const contactLine = compact([
    resume.header.location,
    resume.header.phone,
    resume.header.email,
    resume.header.linkedIn,
    resume.header.github,
  ])
    .map(escapeLatex)
    .join(" \\enspace $\\vert$ \\enspace ")

  return [
    "\\begin{center}",
    `  {\\Huge \\scshape ${escapeLatex(resume.header.fullName || "Resume")}} \\\\`,
    "  \\vspace{3pt}",
    `  \\small ${contactLine}`,
    "\\end{center}",
  ].join("\n")
}

function renderSectionHeader(title: string) {
  return `\\sectionLine{${escapeLatex(title.toUpperCase())}}`
}

function renderEducationFragment(resume: GeneratedResume) {
  if (resume.education.length === 0) return ""

  return resume.education
    .map((entry) => {
      const leftPrimary = compact([entry.school]).join(" ")
      const rightPrimary = compact([entry.college]).join(" ")
      const leftSecondary = compact([
        entry.degree,
        entry.fieldOfStudy,
        entry.minor ? `Minor in ${entry.minor}` : "",
      ]).join(", ")
      const rightSecondary = renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyAttending ? "Present" : undefined
      )
      const support = compact([
        entry.schoolYear ? `Year ${entry.schoolYear}` : "",
        entry.gpa ? `GPA ${entry.gpa}` : "",
        entry.departmentGpa ? `Department GPA ${entry.departmentGpa}` : "",
      ]).join(" \\enspace $\\vert$ \\enspace ")
      const description = entry.description ? escapeLatex(entry.description) : ""

      return [
        "\\resumeEntryStart",
        `\\resumeHeadingLR{${escapeLatex(leftPrimary)}}{${escapeLatex(rightPrimary)}}`,
        `\\resumeSubheadingLR{${escapeLatex(leftSecondary)}}{${escapeLatex(rightSecondary)}}`,
        support ? `\\resumeSupportingLine{${support}}` : "",
        description ? `\\resumeSupportingLine{${description}}` : "",
        "\\resumeEntryEnd",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")
}

function renderSkillsFragment(resume: GeneratedResume) {
  const skillLines = [
    ["Programming Languages", resume.skills.languages],
    ["Frameworks", resume.skills.frameworks],
    ["Technologies", resume.skills.tools],
    ["Databases", resume.skills.databases],
    ["Cloud", resume.skills.cloud],
    ["Other", resume.skills.other],
  ].filter(([, value]) => value.trim())

  if (skillLines.length === 0) return ""

  return skillLines
    .map(
      ([label, value]) =>
        `\\skillLine{${escapeLatex(label)}}{${escapeLatex(value)}}`
    )
    .join("\n")
}

function renderExperienceFragment(resume: GeneratedResume) {
  if (resume.experience.length === 0) return ""

  return resume.experience
    .map((entry) => {
      const title = compact([entry.company]).join(" ")
      const date = renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyWorking ? "Present" : undefined
      )
      const subtitle = compact([entry.title, entry.employmentType]).join(" \\enspace $\\vert$ \\enspace ")
      const location = entry.location
      const description = entry.description ? `\\resumeSupportingLine{${escapeLatex(entry.description)}}` : ""
      const bullets = renderBulletItems(
        entry.bullets
          .split("\n")
          .map((bullet) => bullet.trim())
          .filter(Boolean)
      )

      return [
        "\\resumeEntryStart",
        `\\resumeHeadingLR{${escapeLatex(title)}}{${escapeLatex(date)}}`,
        `\\resumeSubheadingLR{${subtitle}}{${escapeLatex(location)}}`,
        description,
        bullets,
        "\\resumeEntryEnd",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")
}

function renderProjectsFragment(resume: GeneratedResume) {
  if (resume.projects.length === 0) return ""

  return resume.projects
    .map((entry) => {
      const title = entry.name
      const date = renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear,
        entry.currentlyWorking ? "Present" : undefined
      )
      const subtitle = compact([
        entry.role,
        entry.technologies ? `Tech: ${entry.technologies}` : "",
      ]).join(" \\enspace $\\vert$ \\enspace ")
      const links = compact([entry.githubUrl, entry.liveUrl]).join(" \\enspace $\\vert$ \\enspace ")
      const description = entry.description ? `\\resumeSupportingLine{${escapeLatex(entry.description)}}` : ""
      const bullets = renderBulletItems(
        entry.bullets
          .split("\n")
          .map((bullet) => bullet.trim())
          .filter(Boolean)
      )

      return [
        "\\resumeEntryStart",
        `\\resumeHeadingLR{${escapeLatex(title)}}{${escapeLatex(date)}}`,
        `\\resumeSubheadingLR{${subtitle}}{${escapeLatex(links)}}`,
        description,
        bullets,
        "\\resumeEntryEnd",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")
}

function renderLeadershipFragment(resume: GeneratedResume) {
  if (resume.leadership.length === 0) return ""

  return resume.leadership
    .map((entry) => {
      const title = entry.organization
      const date = renderDateRange(
        entry.startMonth,
        entry.startYear,
        entry.endMonth,
        entry.endYear
      )
      const subtitle = entry.title
      const location = entry.location
      const description = entry.description ? `\\resumeSupportingLine{${escapeLatex(entry.description)}}` : ""
      const bullets = renderBulletItems(
        entry.bullets
          .split("\n")
          .map((bullet) => bullet.trim())
          .filter(Boolean)
      )

      return [
        "\\resumeEntryStart",
        `\\resumeHeadingLR{${escapeLatex(title)}}{${escapeLatex(date)}}`,
        `\\resumeSubheadingLR{${escapeLatex(subtitle)}}{${escapeLatex(location)}}`,
        description,
        bullets,
        "\\resumeEntryEnd",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")
}

function renderOptionalSection(title: string, body: string) {
  return body ? `${renderSectionHeader(title)}\n${body}` : ""
}

export function renderResumeAsLatex(resume: GeneratedResume) {
  const education = renderEducationFragment(resume)
  const skills = renderSkillsFragment(resume)
  const experience = renderExperienceFragment(resume)
  const projects = renderProjectsFragment(resume)
  const leadership = renderLeadershipFragment(resume)

  return `\\documentclass[letterpaper,10pt]{article}
\\pagestyle{empty}
\\setlength{\\tabcolsep}{0pt}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\setlength{\\oddsidemargin}{-0.35in}
\\setlength{\\evensidemargin}{-0.35in}
\\setlength{\\textwidth}{7.2in}
\\setlength{\\topmargin}{-0.6in}
\\setlength{\\textheight}{10.0in}
\\raggedbottom
\\raggedright

\\newcommand{\\sectionLine}[1]{
  \\vspace{8pt}
  {\\large\\bfseries\\scshape #1}\\\\[-3pt]
  \\hrule
  \\vspace{4pt}
}

\\newcommand{\\resumeHeadingLR}[2]{
  \\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
    \\textbf{#1} & #2 \\\\
  \\end{tabular*}
}

\\newcommand{\\resumeSubheadingLR}[2]{
  \\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
    \\textit{#1} & \\textit{#2} \\\\
  \\end{tabular*}
  \\vspace{-4pt}
}

\\newcommand{\\resumeSupportingLine}[1]{
  {\\small #1}\\\\
}

\\newcommand{\\skillLine}[2]{
  \\textbf{#1}: #2\\\\
}

\\newcommand{\\resumeEntryStart}{\\vspace{1pt}}
\\newcommand{\\resumeEntryEnd}{\\vspace{-1pt}}

\\begin{document}

${renderHeaderFragment(resume)}
\\vspace{-6pt}

${renderOptionalSection("Education", education)}

${renderOptionalSection("Skills", skills)}

${renderOptionalSection("Experience", experience)}

${renderOptionalSection("Projects", projects)}

${renderOptionalSection("Leadership \\& Engagement", leadership)}

\\end{document}
`
}
