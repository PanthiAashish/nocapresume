import type { BaseResumeSource } from "@/lib/baseResumeSource"

function compact(values: Array<string | undefined>) {
  return values.map((value) => value?.trim() ?? "").filter(Boolean)
}

export function buildTailoringPrompt(source: BaseResumeSource) {
  const sourcePayload = {
    basics: source.basics,
    education: source.education.map((entry) => ({
      id: entry.id,
      school: entry.school,
      college: entry.college,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy,
      minor: entry.minor,
      dates: compact([
        `${entry.startMonth} ${entry.startYear}`.trim(),
        `${entry.endMonth} ${entry.endYear}`.trim(),
      ]).join(" - "),
      sourceText: entry.sourceText,
    })),
    skills: source.skills.map((category) => ({
      id: category.id,
      label: category.label,
      items: category.items,
      sourceText: category.sourceText,
    })),
    experience: source.experience.map((entry) => ({
      id: entry.id,
      company: entry.company,
      title: entry.title,
      employmentType: entry.employmentType,
      location: entry.location,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      bullets: entry.bullets,
      sourceText: entry.sourceText,
    })),
    projects: source.projects.map((entry) => ({
      id: entry.id,
      name: entry.name,
      role: entry.role,
      technologies: entry.technologies,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth,
      endYear: entry.endYear,
      currentlyWorking: entry.currentlyWorking,
      bullets: entry.bullets,
      sourceText: entry.sourceText,
    })),
  }

  return `You are an expert resume tailoring AI that aggressively optimizes resumes to match the job description.

Core Philosophy:
- Create the strongest possible resume to help the candidate get interviews.
- Aggressively enhance and reframe existing experience to fill important skill gaps (especially ML, DevOps, Full Stack, Java/Spring Boot, Cloud, Docker, Kubernetes, AWS, etc.).
- All enhancements must be integrated into the candidate’s existing roles and projects — never invent new job entries, new sections, or fake titles.
- Enhancements should feel like natural career progression, not forced or obviously AI-generated.

Hard Rules:
- Do NOT change dates, job titles, company names, or create new experience/project entries.
- Only modify, expand, rewrite, or replace bullets inside the existing "experience" and "projects" sections.
- Keep the resume concise. You are allowed to shorten or consolidate bullets to preserve space.
- When rewriting or replacing a bullet, maintain semantic similarity to the original content.
  - Example: If the original work was on "search history", any added ML work should relate to search, recommendations, personalization, data pipelines, or user behavior — not completely unrelated topics.
- If the job description already matches the user’s existing experience well, make only light changes or no changes to those bullets.
- Prioritize enhancing the most recent and relevant roles (especially Amazon and Apple internships).

Style Guidelines:
- Use professional, confident, achievement-oriented language with metrics whenever possible.
- Make enhancements subtle and seamless.
- Keep total bullets per role reasonable (4–7 maximum).

Output Format:
Return ONLY valid JSON in exactly this structure:


Return exactly this JSON shape:
{
  "finalResume": {
    "basics": {
      "fullName": "",
      "email": "",
      "phone": "",
      "location": "",
      "linkedIn": "",
      "github": ""
    },
    "education": {
      "entries": [
        {
          "id": "",
          "school": "",
          "college": "",
          "degree": "",
          "fieldOfStudy": "",
          "minor": "",
          "schoolYear": "",
          "startMonth": "",
          "startYear": "",
          "endMonth": "",
          "endYear": "",
          "currentlyAttending": false,
          "gpa": "",
          "departmentGpa": "",
          "coursework": []
        }
      ]
    },
    "skills": {
      "categories": [
        {
          "id": "",
          "label": "",
          "items": [
            { "label": "" }
          ]
        }
      ]
    },
    "experience": {
      "entries": [
        {
          "id": "",
          "company": "",
          "title": "",
          "employmentType": "",
          "location": "",
          "startMonth": "",
          "startYear": "",
          "endMonth": "",
          "endYear": "",
          "currentlyWorking": false,
          "bullets": []
        }
      ]
    },
    "projects": {
      "entries": [
        {
          "id": "",
          "name": "",
          "role": "",
          "technologies": [],
          "githubUrl": "",
          "liveUrl": "",
          "startMonth": "",
          "startYear": "",
          "endMonth": "",
          "endYear": "",
          "currentlyWorking": false,
          "bullets": []
        }
      ]
    }
  },
  "enhancementReport": {
    "extractedRequirements": [
      {
        "keyword": "",
        "domain": "",
        "coverage": "covered"
      }
    ],
    "changes": [
      {
        "section": "experience",
        "entryId": "",
        "entryLabel": "",
        "originalText": "",
        "tailoredText": "",
        "trigger": "",
        "reason": ""
      }
    ],
    "studyGuide": [
      {
        "skill": "",
        "reason": "",
        "concepts": [],
        "questions": [
          {
            "question": "",
            "difficulty": "medium"
          }
        ],
        "resources": [
          {
            "label": "",
            "url": ""
          }
        ],
        "miniProject": ""
      }
    ],
    "matchedJobKeywords": [],
    "notes": []
  }
}

Rules for the enhancementReport:
- extractedRequirements: all major JD requirements with coverage set to one of covered, enhanced, or gap.
- changes: concrete original-to-tailored changes. Use originalText as "Newly added" when there was no direct prior bullet.
- studyGuide: only include skills/domains that were added or heavily enhanced.
- matchedJobKeywords: concise JD keywords and phrases.
- notes: short implementation notes or caveats.

Job description:
${source.jobDescriptionText}

Base resume text:
${source.baseResumeText}

Structured base resume source data:
${JSON.stringify(sourcePayload)}`
}
