import type { ProfileData } from "@/lib/profile"
import type { StructuredResume } from "@/lib/resumeSchema"

const longBullet =
  "Built a candidate scoring pipeline that ingested structured application events, ranked resume variants against job requirements, and shipped measurable conversion improvements across screening and interview stages."

export function createProfileFixture(): ProfileData {
  return {
    basics: {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-111-2222",
      location: "Chicago, IL",
      linkedIn: "linkedin.com/in/adalovelace",
      github: "github.com/ada",
    },
    educationEntries: [
      {
        id: "edu-1",
        school: "University of Illinois Urbana-Champaign",
        college: "Grainger",
        degree: "B.S.",
        fieldOfStudy: "Computer Science",
        minor: "Statistics",
        schoolYear: "Senior",
        startMonth: "Aug",
        startYear: "2022",
        endMonth: "May",
        endYear: "2026",
        currentlyAttending: true,
        gpa: "3.9/4.0",
        departmentGpa: "4.0/4.0",
        description: "",
      },
    ],
    experienceEntries: Array.from({ length: 5 }, (_, index) => ({
      id: `exp-${index + 1}`,
      company: `Company ${index + 1}`,
      title: index === 3 ? "Machine Learning Engineer" : "Software Engineer",
      employmentType: "Internship",
      location: "Remote",
      startMonth: "May",
      startYear: String(2021 + index),
      endMonth: "Aug",
      endYear: String(2021 + index),
      currentlyWorking: false,
      description: "",
      bullets: [longBullet, longBullet, longBullet, longBullet].join("\n"),
    })),
    projectEntries: Array.from({ length: 4 }, (_, index) => ({
      id: `project-${index + 1}`,
      name: `Project ${index + 1}`,
      role: "Builder",
      startMonth: "Jan",
      startYear: "2024",
      endMonth: "Mar",
      endYear: "2024",
      currentlyWorking: false,
      description: "",
      bullets: [longBullet, longBullet, longBullet].join("\n"),
      technologies: "TypeScript, React, Node.js, PostgreSQL, Redis, Docker",
      githubUrl: `github.com/ada/project-${index + 1}`,
      liveUrl: `project-${index + 1}.example.com`,
    })),
    skills: {
      languages: "TypeScript, Python, Java, SQL, Go, Rust, C++, Kotlin",
      frameworks: "React, Next.js, Express, FastAPI, Tailwind CSS, Jest",
      tools: "Docker, GitHub Actions, Terraform, Kafka, Figma, Linux",
      cloud: "AWS, GCP, Vercel, Firebase",
      databases: "PostgreSQL, MySQL, Redis, MongoDB",
      other: "Leadership, mentoring, experimentation, analytics",
    },
    extracurricularEntries: [],
  }
}

export function createOverflowResumeFixture(): StructuredResume {
  return {
    basics: {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-111-2222",
      location: "Chicago, IL",
      linkedIn: "linkedin.com/in/adalovelace",
      github: "github.com/ada",
    },
    education: {
      limits: { maxEntries: 1 },
      entries: [
        {
          id: "edu-1",
          school: "University of Illinois Urbana-Champaign",
          college: "Grainger College of Engineering",
          degree: "B.S.",
          fieldOfStudy: "Computer Science",
          minor: "Statistics",
          schoolYear: "Senior",
          startMonth: "Aug",
          startYear: "2022",
          endMonth: "May",
          endYear: "2026",
          currentlyAttending: true,
          gpa: "3.9/4.0",
          departmentGpa: "4.0/4.0",
          coursework: [
            "Algorithms",
            "Distributed Systems",
            "Operating Systems",
            "Machine Learning",
            "Databases",
            "Computer Security",
          ],
          priority: { relevanceScore: 1, originalIndex: 0 },
        },
      ],
    },
    skills: {
      limits: {
        maxEntries: 6,
        maxItemsPerCategory: 6,
        maxTotalItems: 18,
      },
      categories: [
        {
          id: "languages",
          label: "Programming Languages",
          items: [
            "TypeScript",
            "Python",
            "Java",
            "SQL",
            "Go",
            "Rust",
          ].map((label, index) => ({
            label,
            priority: { relevanceScore: index === 0 ? 3 : 0, originalIndex: index },
          })),
          priority: { relevanceScore: 3, originalIndex: 0 },
        },
        {
          id: "frameworks",
          label: "Frameworks",
          items: ["React", "Next.js", "Node.js", "FastAPI", "Express", "Jest"].map(
            (label, index) => ({
              label,
              priority: { relevanceScore: index < 2 ? 2 : 0, originalIndex: index },
            })
          ),
          priority: { relevanceScore: 4, originalIndex: 1 },
        },
        {
          id: "tools",
          label: "Technologies",
          items: ["Docker", "Terraform", "Kafka", "Redis", "PostgreSQL", "Linux"].map(
            (label, index) => ({
              label,
              priority: { relevanceScore: index === 4 ? 2 : 0, originalIndex: index },
            })
          ),
          priority: { relevanceScore: 2, originalIndex: 2 },
        },
      ],
    },
    experience: {
      limits: {
        maxEntries: 4,
        maxBulletsPerEntry: 4,
        maxCharactersPerBullet: 160,
      },
      entries: Array.from({ length: 4 }, (_, index) => ({
        id: `exp-${index + 1}`,
        company: `Company ${index + 1}`,
        title: "Software Engineer",
        employmentType: "Internship",
        location: "Remote",
        startMonth: "May",
        startYear: "2024",
        endMonth: "Aug",
        endYear: "2024",
        currentlyWorking: false,
        bullets: [longBullet, longBullet, longBullet, longBullet],
        priority: { relevanceScore: index === 0 ? 3 : 1, originalIndex: index },
      })),
    },
    projects: {
      limits: {
        maxEntries: 3,
        maxBulletsPerEntry: 3,
        maxCharactersPerBullet: 140,
      },
      entries: Array.from({ length: 3 }, (_, index) => ({
        id: `project-${index + 1}`,
        name: `Project ${index + 1}`,
        role: "Builder",
        technologies: ["TypeScript", "React", "PostgreSQL", "Docker"],
        githubUrl: `github.com/ada/project-${index + 1}`,
        liveUrl: `project-${index + 1}.example.com`,
        startMonth: "Jan",
        startYear: "2024",
        endMonth: "Mar",
        endYear: "2024",
        currentlyWorking: false,
        bullets: [longBullet, longBullet, longBullet],
        priority: { relevanceScore: index === 0 ? 3 : 0, originalIndex: index },
      })),
    },
  }
}
