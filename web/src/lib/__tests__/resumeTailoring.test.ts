import test from "node:test"
import assert from "node:assert/strict"
import { isEnhancementReport } from "@/lib/enhancementReport"
import { normalizeLlmTailoringPayload } from "@/lib/resumeTailoringSchema"

test("normalizeLlmTailoringPayload returns the LLM-provided final resume and report shape", () => {
  const payload = normalizeLlmTailoringPayload(
    {
      finalResume: {
        basics: {
          fullName: "Ada Lovelace",
          email: "ada@example.com",
          phone: "555-111-2222",
          location: "Chicago, IL",
          linkedIn: "linkedin.com/in/adalovelace",
          github: "github.com/ada",
        },
        education: {
          entries: [
            {
              id: "edu-1",
              school: "University of Illinois",
              college: "Grainger",
              degree: "B.S.",
              fieldOfStudy: "Computer Science",
              startMonth: "Aug",
              startYear: "2021",
              endMonth: "May",
              endYear: "2025",
              currentlyAttending: false,
              coursework: ["ML", "Algorithms"],
            },
          ],
        },
        skills: {
          categories: [
            {
              id: "languages",
              label: "Programming Languages",
              items: [{ label: "Python" }, { label: "Java" }],
            },
          ],
        },
        experience: {
          entries: [
            {
              id: "exp-1",
              company: "Acme",
              title: "Software Engineer",
              location: "Remote",
              startMonth: "May",
              startYear: "2024",
              endMonth: "Aug",
              endYear: "2024",
              currentlyWorking: false,
              bullets: ["Built APIs", "Deployed services"],
            },
          ],
        },
        projects: {
          entries: [
            {
              id: "project-1",
              name: "Resume AI",
              role: "Builder",
              technologies: ["Next.js", "PostgreSQL"],
              startMonth: "Jan",
              startYear: "2024",
              endMonth: "Mar",
              endYear: "2024",
              currentlyWorking: false,
              bullets: ["Built a resume tailoring app"],
            },
          ],
        },
      },
      enhancementReport: {
        extractedRequirements: [
          { keyword: "Machine Learning", domain: "AI / ML", coverage: "enhanced" },
        ],
        changes: [
          {
            section: "experience",
            entryId: "exp-1",
            entryLabel: "Software Engineer",
            originalText: "Built APIs",
            tailoredText: "Built ML-backed APIs",
            trigger: "Machine Learning",
            reason: "Added ML emphasis",
          },
        ],
        studyGuide: [
          {
            skill: "Machine Learning",
            reason: "Added heavily",
            concepts: ["Supervised learning"],
            questions: [{ question: "Explain overfitting", difficulty: "medium" }],
            resources: [{ label: "scikit-learn", url: "https://scikit-learn.org/" }],
            miniProject: "Build a classifier",
          },
        ],
        matchedJobKeywords: ["Machine Learning", "Python"],
        notes: ["LLM-generated enhancement report"],
      },
    },
    {
      fullName: "Fallback",
      email: "fallback@example.com",
      phone: "",
      location: "",
      linkedIn: "",
      github: "",
    }
  )

  assert.equal(payload.finalResume.basics.fullName, "Ada Lovelace")
  assert.equal(payload.finalResume.experience.entries[0]?.bullets[0], "Built APIs")
  assert.equal(payload.enhancementReport.extractedRequirements[0]?.coverage, "enhanced")
  assert.equal(isEnhancementReport(payload.enhancementReport), true)
})

test("normalizeLlmTailoringPayload falls back to source basics when the LLM omits them", () => {
  const payload = normalizeLlmTailoringPayload(
    {
      finalResume: {
        basics: {},
        education: { entries: [] },
        skills: { categories: [] },
        experience: { entries: [] },
        projects: { entries: [] },
      },
      enhancementReport: {
        extractedRequirements: [],
        changes: [],
        studyGuide: [],
        matchedJobKeywords: [],
        notes: [],
      },
    },
    {
      fullName: "Fallback Name",
      email: "fallback@example.com",
      phone: "555-000-0000",
      location: "Chicago, IL",
      linkedIn: "linkedin.com/in/fallback",
      github: "github.com/fallback",
    }
  )

  assert.equal(payload.finalResume.basics.fullName, "Fallback Name")
  assert.equal(payload.finalResume.basics.email, "fallback@example.com")
})
