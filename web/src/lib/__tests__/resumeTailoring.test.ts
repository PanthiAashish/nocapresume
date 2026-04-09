import test from "node:test"
import assert from "node:assert/strict"
import { normalizeSkillCategoriesForRendering } from "@/lib/resumeSkills"
import { validateAndRepairTailoredResumeDraft } from "@/lib/resumeTailoringValidation"
import { buildFinalResumeFromTailoredDraft } from "@/lib/resumeTailoring"
import {
  createDuplicateSkillCategoriesFixture,
  createMlTailoredDraftFixture,
  createMlTailoringSourceFixture,
  createTailoredDraftFixture,
  createTailoringSourceFixture,
} from "@/lib/__tests__/tailoringFixtures"

test("validation accepts grounded structured tailored output", () => {
  const source = createTailoringSourceFixture()
  const draft = createTailoredDraftFixture()
  const validation = validateAndRepairTailoredResumeDraft(draft, source)

  assert.deepEqual(validation.errors, [])
  assert.equal(validation.survivingBulletCount > 0, true)
  assert.equal(validation.value.experience.length > 0, true)
})

test("duplicate skill categories are merged and duplicate items are removed", () => {
  const normalized = normalizeSkillCategoriesForRendering(
    createDuplicateSkillCategoriesFixture(),
    "Machine learning engineer with Python, AWS, ETL, and recommendation systems"
  )

  assert.deepEqual(normalized.map((category) => category.label), [
    "Programming Languages",
    "Tools & Technologies",
    "Cloud",
  ])
  assert.deepEqual(
    normalized[0]?.items.map((item) => item.label),
    ["Python", "TypeScript", "Java"]
  )
  assert.deepEqual(normalized[1]?.items.map((item) => item.label), ["Docker"])
  assert.deepEqual(normalized[2]?.items.map((item) => item.label), ["AWS", "Firebase"])
})

test("fuzzy evidence match passes after normalization", () => {
  const source = createTailoringSourceFixture()
  const draft = createTailoredDraftFixture()
  draft.experience[0].bullets[0].sourceEvidence =
    "built a candidate scoring pipeline, ranking resume variants against job requirements"

  const validation = validateAndRepairTailoredResumeDraft(draft, source)

  assert.equal(validation.value.experience[0]?.bullets.length > 0, true)
})

test("validation requires evidence for every tailored bullet", () => {
  const source = createTailoringSourceFixture()
  const draft = createTailoredDraftFixture()
  draft.experience[0].bullets[0].sourceEvidence = ""

  const validation = validateAndRepairTailoredResumeDraft(draft, source)

  assert.equal(validation.retryableErrors.some((error) => error.includes("missing evidence")), true)
})

test("validation rejects unsupported claims and technologies", () => {
  const source = createTailoringSourceFixture()
  const draft = createTailoredDraftFixture()
  draft.projects[0].bullets[0].text =
    "Built an AWS-based TypeScript and React platform that increased conversion by 40%."

  const validation = validateAndRepairTailoredResumeDraft(draft, source)

  assert.equal(
    validation.retryableErrors.some(
      (error) => error.includes("unsupported named term") || error.includes("unsupported number")
    ),
    true
  )
})

test("one invalid bullet is dropped without failing the whole tailored output", () => {
  const source = createTailoringSourceFixture()
  const draft = createTailoredDraftFixture()
  draft.experience[0].bullets.push({
    text: "Built an AWS platform that increased conversion by 40%.",
    sourceEvidence: "Built a candidate scoring pipeline that ingested structured application events.",
    sourceSection: "experience",
    sourceEntryId: "exp-1",
    confidence: 0.7,
    jobRelevanceScore: 80,
    reason: "Invalid demo bullet",
  })

  const validation = validateAndRepairTailoredResumeDraft(draft, source)

  assert.equal(validation.droppedBulletCount > 0, true)
  assert.equal(
    validation.value.experience.some((entry) =>
      entry.bullets.some((bullet) => bullet.text.includes("AWS platform"))
    ),
    false
  )
  assert.equal(validation.survivingBulletCount > 0, true)
})

test("deterministic ranking selects and orders final content the same way on repeated runs", () => {
  const source = createTailoringSourceFixture()
  const draft = createTailoredDraftFixture()

  const first = buildFinalResumeFromTailoredDraft(source, draft)
  const second = buildFinalResumeFromTailoredDraft(source, draft)

  assert.deepEqual(first.resume, second.resume)
  assert.deepEqual(
    first.resume.experience.entries.map((entry) => entry.id),
    second.resume.experience.entries.map((entry) => entry.id)
  )
  assert.deepEqual(
    first.resume.projects.entries.map((entry) => entry.id),
    second.resume.projects.entries.map((entry) => entry.id)
  )
})

test("realistic fixture produces job-aware final selection from base resume source", () => {
  const source = createTailoringSourceFixture()
  const draft = createTailoredDraftFixture()
  const selected = buildFinalResumeFromTailoredDraft(source, draft)

  assert.equal(selected.resume.basics.fullName, "Ada Lovelace")
  assert.equal(selected.resume.skills.categories[0]?.items[0]?.label, "TypeScript")
  assert.equal(selected.resume.experience.entries[0]?.id, "exp-1")
  assert.equal(selected.audit.matchedJobKeywords.includes("React"), true)
})

test("job-relevant skills survive trimming for ML-focused jobs", () => {
  const source = createMlTailoringSourceFixture()
  const draft = createMlTailoredDraftFixture()
  const selected = buildFinalResumeFromTailoredDraft(source, draft)

  const skillsLine = selected.resume.skills.categories.flatMap((category) =>
    category.items.map((item) => item.label)
  )

  assert.equal(skillsLine.includes("ETL"), true)
  assert.equal(skillsLine.includes("Protobuf"), true)
})

test("bullets are reordered by ML job relevance and Prime Video/Apple work ranks above weaker frontend work", () => {
  const source = createMlTailoringSourceFixture()
  const draft = createMlTailoredDraftFixture()
  const selected = buildFinalResumeFromTailoredDraft(source, draft)

  assert.deepEqual(
    selected.resume.experience.entries.map((entry) => entry.id).slice(0, 2),
    ["exp-prime-video", "exp-apple"]
  )
  assert.equal(
    selected.resume.experience.entries[0]?.bullets[0].includes("A/B testing") ||
      selected.resume.experience.entries[0]?.bullets[0].includes("experimentation"),
    true
  )
})

test("ML-focused JD adds grounded ML-adjacent framing for Prime Video work", () => {
  const source = createMlTailoringSourceFixture()
  const draft = createMlTailoredDraftFixture()
  const selected = buildFinalResumeFromTailoredDraft(source, draft)
  const primeVideoBullets =
    selected.resume.experience.entries.find((entry) => entry.id === "exp-prime-video")?.bullets ?? []

  assert.equal(
    primeVideoBullets.some(
      (bullet) =>
        bullet.includes("Prime Video recommendation") ||
        bullet.includes("personalization") ||
        bullet.includes("content-ranking")
    ),
    true
  )
})

test("unsupported fake ML claims are never introduced for weakly related frontend work", () => {
  const source = createMlTailoringSourceFixture()
  const draft = createMlTailoredDraftFixture()
  const selected = buildFinalResumeFromTailoredDraft(source, draft)
  const frontendBullets =
    selected.resume.experience.entries.find((entry) => entry.id === "exp-frontend")?.bullets ?? []

  assert.equal(
    frontendBullets.some(
      (bullet) =>
        bullet.includes("recommendation") ||
        bullet.includes("model training") ||
        bullet.includes("personalization")
    ),
    false
  )
})

test("fallback path reuses grounded base resume content when tailored bullets collapse", () => {
  const source = createTailoringSourceFixture()
  const draft = createTailoredDraftFixture()
  draft.experience = []
  draft.projects = []
  draft.skills = []

  const selected = buildFinalResumeFromTailoredDraft(source, draft)

  assert.equal(selected.resume.experience.entries.length > 0, true)
  assert.equal(selected.resume.projects.entries.length > 0, true)
  assert.equal(selected.resume.skills.categories.length > 0, true)
})
