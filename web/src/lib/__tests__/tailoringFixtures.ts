import { buildBaseResumeSource } from "@/lib/baseResumeSource"
import type { TailoredResumeDraft } from "@/lib/resumeTailoringSchema"
import { createProfileFixture } from "@/lib/__tests__/resumeFixtures"
import type { ResumeSkillCategory } from "@/lib/resumeSchema"

export function createTailoringSourceFixture() {
  return buildBaseResumeSource({
    jobDescriptionText:
      "Looking for a software engineer with React, TypeScript, PostgreSQL, experimentation, and ML platform experience.",
    baseResumeText: `
      Ada Lovelace
      Company 1 | Software Engineer | Remote
      Built a candidate scoring pipeline that ingested structured application events, ranked resume variants against job requirements, and shipped measurable conversion improvements across screening and interview stages.
      Project 1 | Builder | TypeScript, React, Node.js, PostgreSQL
    `,
    profile: createProfileFixture(),
  })
}

export function createTailoredDraftFixture(): TailoredResumeDraft {
  const experienceEvidence =
    "Built a candidate scoring pipeline that ingested structured application events, ranked resume variants against job requirements, and shipped measurable conversion improvements across screening and interview stages."

  return {
    basics: {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-111-2222",
      location: "Chicago, IL",
      linkedIn: "linkedin.com/in/adalovelace",
      github: "github.com/ada",
    },
    summary: {
      text: "Software engineer with experience building candidate scoring pipelines and experiment-driven screening improvements.",
      sourceEvidence: experienceEvidence,
      sourceSection: "experience",
      sourceEntryId: "exp-1",
      confidence: 0.88,
      jobRelevanceScore: 89,
      reason: "Matches experiment and ranking requirements from the job description.",
    },
    education: [
      {
        sourceEntryId: "edu-1",
        sourceEvidence: "University of Illinois Urbana-Champaign | Grainger | B.S. | Computer Science | Minor Statistics | GPA 3.9/4.0",
        confidence: 0.99,
        jobRelevanceScore: 60,
        reason: "Computer science degree supports the target software engineering role.",
      },
    ],
    skills: [
      {
        categoryId: "languages",
        items: [
          {
            text: "TypeScript",
            sourceEvidence: "TypeScript",
            sourceSection: "skills",
            sourceEntryId: "languages",
            confidence: 0.99,
            jobRelevanceScore: 95,
            reason: "The role explicitly asks for TypeScript.",
          },
          {
            text: "Python",
            sourceEvidence: "Python",
            sourceSection: "skills",
            sourceEntryId: "languages",
            confidence: 0.95,
            jobRelevanceScore: 82,
            reason: "The job mentions ML workflows.",
          },
        ],
      },
      {
        categoryId: "frameworks",
        items: [
          {
            text: "React",
            sourceEvidence: "React",
            sourceSection: "skills",
            sourceEntryId: "frameworks",
            confidence: 0.98,
            jobRelevanceScore: 94,
            reason: "The UI stack is React-based.",
          },
        ],
      },
    ],
    experience: [
      {
        sourceEntryId: "exp-1",
        bullets: [
          {
            text: "Built a candidate scoring pipeline for ranking resume variants against job requirements and improving screening workflows.",
            sourceEvidence: experienceEvidence,
            sourceSection: "experience",
            sourceEntryId: "exp-1",
            confidence: 0.93,
            jobRelevanceScore: 96,
            reason: "Directly matches ranking and workflow requirements.",
          },
          {
            text: "Shipped experiment-driven improvements across screening and interview stages using structured application events.",
            sourceEvidence: experienceEvidence,
            sourceSection: "experience",
            sourceEntryId: "exp-1",
            confidence: 0.9,
            jobRelevanceScore: 91,
            reason: "Aligns with experimentation and analytics responsibilities.",
          },
        ],
      },
      {
        sourceEntryId: "exp-4",
        bullets: [
          {
            text: "Built a candidate scoring pipeline with structured application events and resume ranking workflows.",
            sourceEvidence: experienceEvidence,
            sourceSection: "experience",
            sourceEntryId: "exp-4",
            confidence: 0.6,
            jobRelevanceScore: 70,
            reason: "ML alignment from the job description.",
          },
        ],
      },
    ],
    projects: [
      {
        sourceEntryId: "project-1",
        bullets: [
          {
            text: "Built a TypeScript and React project backed by PostgreSQL for production-style application workflows.",
            sourceEvidence: "Project 1 | Builder | TypeScript, React, Node.js, PostgreSQL",
            sourceSection: "projects",
            sourceEntryId: "project-1",
            confidence: 0.89,
            jobRelevanceScore: 92,
            reason: "Direct stack overlap with the target role.",
          },
        ],
      },
    ],
    analysis: {
      matchedJobKeywords: ["React", "TypeScript", "PostgreSQL", "experimentation"],
      notes: ["Kept bullets close to base resume evidence."],
    },
  }
}

export function createDuplicateSkillCategoriesFixture(): ResumeSkillCategory[] {
  return [
    {
      id: "languages",
      label: "Programming Languages",
      items: [
        { label: "Python", priority: { relevanceScore: 10, originalIndex: 0 } },
        { label: "TypeScript", priority: { relevanceScore: 8, originalIndex: 1 } },
      ],
    },
    {
      id: "languages-copy",
      label: "Programming Languages",
      items: [
        { label: "python", priority: { relevanceScore: 7, originalIndex: 2 } },
        { label: "Java", priority: { relevanceScore: 6, originalIndex: 3 } },
      ],
    },
    {
      id: "tools",
      label: "Technologies",
      items: [
        { label: "Docker", priority: { relevanceScore: 6, originalIndex: 0 } },
        { label: "AWS", priority: { relevanceScore: 10, originalIndex: 1 } },
      ],
    },
    {
      id: "cloud-copy",
      label: "Cloud",
      items: [
        { label: "aws", priority: { relevanceScore: 9, originalIndex: 0 } },
        { label: "Firebase", priority: { relevanceScore: 5, originalIndex: 1 } },
      ],
    },
  ]
}

export function createMlTailoringSourceFixture() {
  return buildBaseResumeSource({
    jobDescriptionText:
      "Machine learning engineer focused on recommendation systems, personalization, ranking, experimentation, model evaluation, large-scale data pipelines, and backend infrastructure for intelligent products.",
    baseResumeText: `
      Ada Lovelace
      Amazon Prime Video | Backend Engineer | Seattle
      Built CRUD services for user profiles in Amazon Prime Video using Kotlin, AWS CDK, and DynamoDB.
      Validated rollout through A/B testing on live traffic and monitored metrics during regional replication.
      Apple | Software Engineer | Cupertino
      Built ETL and logging pipelines for user activity APIs and analytics dashboards.
      Frontend Startup | Frontend Engineer | Remote
      Built responsive React landing pages and UI components.
    `,
    profile: {
      ...createProfileFixture(),
      experienceEntries: [
        {
          id: "exp-prime-video",
          company: "Amazon Prime Video",
          title: "Backend Engineer",
          employmentType: "Internship",
          location: "Seattle, WA",
          startMonth: "May",
          startYear: "2024",
          endMonth: "Aug",
          endYear: "2024",
          currentlyWorking: false,
          description: "",
          bullets: [
            "Built CRUD services for user profiles in Amazon Prime Video using Kotlin, AWS CDK, and DynamoDB.",
            "Validated rollout through A/B testing on live traffic and monitored metrics during regional replication.",
          ].join("\n"),
        },
        {
          id: "exp-apple",
          company: "Apple",
          title: "Software Engineer",
          employmentType: "Internship",
          location: "Cupertino, CA",
          startMonth: "May",
          startYear: "2023",
          endMonth: "Aug",
          endYear: "2023",
          currentlyWorking: false,
          description: "",
          bullets: [
            "Built ETL and logging pipelines for user activity APIs and analytics dashboards.",
            "Improved backend services that processed user behavior events and system metrics.",
          ].join("\n"),
        },
        {
          id: "exp-frontend",
          company: "Frontend Startup",
          title: "Frontend Engineer",
          employmentType: "Internship",
          location: "Remote",
          startMonth: "May",
          startYear: "2022",
          endMonth: "Aug",
          endYear: "2022",
          currentlyWorking: false,
          description: "",
          bullets: [
            "Built responsive React landing pages and reusable UI components.",
          ].join("\n"),
        },
      ],
      projectEntries: [
        {
          id: "project-ml-adjacent",
          name: "Experiment Dashboard",
          role: "Builder",
          startMonth: "Jan",
          startYear: "2024",
          endMonth: "Mar",
          endYear: "2024",
          currentlyWorking: false,
          description: "",
          bullets: [
            "Built internal dashboards for experiment metrics and rollout evaluation.",
          ].join("\n"),
          technologies: "TypeScript, React, PostgreSQL, Protobuf",
          githubUrl: "",
          liveUrl: "",
        },
      ],
      skills: {
        languages: "Python, Java, JavaScript, TypeScript, Kotlin, SQL",
        frameworks: "React, Next.js, Express",
        tools: "Git, GitHub Actions, Docker, Postman, Protobuf, ETL, analytics, experimentation",
        cloud: "AWS, Firebase",
        databases: "MongoDB, PostgreSQL, DynamoDB",
        other: "",
      },
    },
  })
}

export function createMlTailoredDraftFixture(): TailoredResumeDraft {
  return {
    basics: {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-111-2222",
      location: "Chicago, IL",
      linkedIn: "linkedin.com/in/adalovelace",
      github: "github.com/ada",
    },
    summary: null,
    education: [],
    skills: [
      {
        categoryId: "tools",
        items: [
          {
            text: "ETL",
            sourceEvidence: "ETL",
            sourceSection: "skills",
            sourceEntryId: "tools",
            confidence: 0.95,
            jobRelevanceScore: 90,
            reason: "Relevant for ML data pipelines.",
          },
          {
            text: "Protobuf",
            sourceEvidence: "Protobuf",
            sourceSection: "skills",
            sourceEntryId: "tools",
            confidence: 0.93,
            jobRelevanceScore: 84,
            reason: "Useful in model/data infrastructure.",
          },
        ],
      },
      {
        categoryId: "frameworks",
        items: [
          {
            text: "React",
            sourceEvidence: "React",
            sourceSection: "skills",
            sourceEntryId: "frameworks",
            confidence: 0.9,
            jobRelevanceScore: 25,
            reason: "Lower-priority for ML job.",
          },
        ],
      },
    ],
    experience: [
      {
        sourceEntryId: "exp-prime-video",
        bullets: [
          {
            text: "Built CRUD services for user profiles in Amazon Prime Video using Kotlin, AWS CDK, and DynamoDB.",
            sourceEvidence: "Built CRUD services for user profiles in Amazon Prime Video using Kotlin, AWS CDK, and DynamoDB.",
            sourceSection: "experience",
            sourceEntryId: "exp-prime-video",
            confidence: 0.96,
            jobRelevanceScore: 70,
            reason: "Backend services with user data.",
          },
          {
            text: "Validated rollout through A/B testing on live traffic and monitored metrics during regional replication.",
            sourceEvidence: "Validated rollout through A/B testing on live traffic and monitored metrics during regional replication.",
            sourceSection: "experience",
            sourceEntryId: "exp-prime-video",
            confidence: 0.98,
            jobRelevanceScore: 88,
            reason: "Strong experimentation signal for ML-focused role.",
          },
        ],
      },
      {
        sourceEntryId: "exp-apple",
        bullets: [
          {
            text: "Built ETL and logging pipelines for user activity APIs and analytics dashboards.",
            sourceEvidence: "Built ETL and logging pipelines for user activity APIs and analytics dashboards.",
            sourceSection: "experience",
            sourceEntryId: "exp-apple",
            confidence: 0.97,
            jobRelevanceScore: 86,
            reason: "Directly relevant to data pipelines and analytics.",
          },
        ],
      },
      {
        sourceEntryId: "exp-frontend",
        bullets: [
          {
            text: "Built responsive React landing pages and reusable UI components.",
            sourceEvidence: "Built responsive React landing pages and reusable UI components.",
            sourceSection: "experience",
            sourceEntryId: "exp-frontend",
            confidence: 0.97,
            jobRelevanceScore: 20,
            reason: "Less relevant to ML infrastructure role.",
          },
        ],
      },
    ],
    projects: [
      {
        sourceEntryId: "project-ml-adjacent",
        bullets: [
          {
            text: "Built internal dashboards for experiment metrics and rollout evaluation.",
            sourceEvidence: "Built internal dashboards for experiment metrics and rollout evaluation.",
            sourceSection: "projects",
            sourceEntryId: "project-ml-adjacent",
            confidence: 0.96,
            jobRelevanceScore: 82,
            reason: "Experimentation and evaluation relevance.",
          },
        ],
      },
    ],
    analysis: {
      matchedJobKeywords: ["recommendation", "ranking", "personalization", "experimentation", "data pipelines"],
      notes: ["Prime Video and Apple roles should surface ML-adjacent framing."],
    },
  }
}
