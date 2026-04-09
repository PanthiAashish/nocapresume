import test from "node:test"
import assert from "node:assert/strict"
import { PDFDocument } from "pdf-lib"
import { normalizeBulletText } from "@/lib/resumeBullets"
import {
  enforceResumeSectionLimits,
  generateResumeFromProfile,
  totalSkillItems,
} from "@/lib/resumeGeneration"
import { fitResumeToOnePage, renderResumeAsPdf } from "@/lib/pdfResumeRenderer"
import { createOverflowResumeFixture, createProfileFixture } from "@/lib/__tests__/resumeFixtures"

test("normalizeBulletText trims whitespace, removes duplicate punctuation, and shortens deterministically", () => {
  const normalized = normalizeBulletText(
    "  • Built scoring pipeline for resume ranking, with experimentation hooks, analytics, and recruiter tooling....  ",
    {
      maxCharacters: 72,
      deterministicShorten: true,
    }
  )

  assert.equal(
    normalized,
    "Built scoring pipeline for resume ranking, with experimentation hooks"
  )
})

test("enforceResumeSectionLimits caps entries and bullets", () => {
  const resume = createOverflowResumeFixture()
  resume.education.entries.push({
    ...resume.education.entries[0],
    id: "edu-2",
  })
  resume.experience.entries.push({
    ...resume.experience.entries[0],
    id: "exp-5",
  })
  resume.projects.entries.push({
    ...resume.projects.entries[0],
    id: "project-4",
  })
  resume.skills.categories[0].items.push({
    label: "Elm",
    priority: { relevanceScore: 0, originalIndex: 99 },
  })

  const limited = enforceResumeSectionLimits(resume)

  assert.equal(limited.education.entries.length, 1)
  assert.equal(limited.experience.entries.length, 4)
  assert.equal(limited.projects.entries.length, 3)
  assert.equal(totalSkillItems(limited.skills.categories), 18)
  assert.ok(limited.experience.entries.every((entry) => entry.bullets.length <= 4))
})

test("generateResumeFromProfile applies deterministic selection and preserves stable ordering", () => {
  const profile = createProfileFixture()
  const resume = generateResumeFromProfile(
    profile,
    "Machine learning engineer with Python, React, PostgreSQL, Docker, and experimentation"
  )

  assert.equal(resume.experience.entries.length, 4)
  assert.deepEqual(
    resume.experience.entries.map((entry) => entry.id),
    ["exp-1", "exp-2", "exp-3", "exp-4"]
  )
  assert.ok(
    resume.experience.entries.some((entry) => entry.title === "Machine Learning Engineer")
  )
})

test("fitResumeToOnePage applies deterministic compression steps in priority order", async () => {
  const fit = await fitResumeToOnePage(createOverflowResumeFixture())

  assert.equal(fit.metrics.pageCount, 1)
  assert.equal(fit.metrics.overflow, 0)
  assert.equal(fit.appliedSteps[0], "remove-coursework")
  assert.equal(fit.appliedSteps[1], "trim-skills")
  assert.ok(fit.appliedSteps.includes("drop-project"))
  assert.ok(fit.appliedSteps.includes("reduce-role-bullets"))
})

test("renderResumeAsPdf returns a single-page PDF after fitting", async () => {
  const rendered = await renderResumeAsPdf(createOverflowResumeFixture())
  const pdf = await PDFDocument.load(rendered.pdf)

  assert.equal(pdf.getPageCount(), 1)
  assert.equal(rendered.fit.metrics.pageCount, 1)
  assert.equal(rendered.fit.metrics.overflow, 0)
})
