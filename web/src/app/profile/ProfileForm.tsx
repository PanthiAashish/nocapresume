"use client"

import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  emptyProfileData,
  normalizeProfileData,
  profileDataFromDraft,
  type ProfileBasics,
  type ProfileData,
  type ProfileEducationEntry,
  type ProfileExperienceEntry,
  type ProfileExtracurricularEntry,
  type ProfileProjectEntry,
  type ProfileSkills,
} from "@/lib/profile"
import type { ProfileDraft } from "@/lib/profileDraft"

type SectionKey = "education" | "experience" | "projects" | "extracurricular"

type ProfileFormProps = {
  initialProfile: ProfileData
}

const SECTION_CLASS_NAME =
  "rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
const INPUT_CLASS_NAME =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
const TEXTAREA_CLASS_NAME = `${INPUT_CLASS_NAME} min-h-[132px] resize-y`
const SMALL_LABEL_CLASS_NAME =
  "text-xs font-medium uppercase tracking-[0.18em] text-white/50"
const ACTION_BUTTON_CLASS_NAME =
  "rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
const PRIMARY_BUTTON_CLASS_NAME =
  "rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"

let localIdCounter = 0

function createLocalId(prefix: string) {
  localIdCounter += 1
  return `${prefix}-${Date.now()}-${localIdCounter}`
}

function createEducationEntry(): ProfileEducationEntry {
  return {
    id: createLocalId("education"),
    school: "",
    college: "",
    degree: "",
    fieldOfStudy: "",
    minor: "",
    schoolYear: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    currentlyAttending: false,
    gpa: "",
    departmentGpa: "",
    description: "",
  }
}

function createExperienceEntry(): ProfileExperienceEntry {
  return {
    id: createLocalId("experience"),
    company: "",
    title: "",
    employmentType: "",
    location: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    currentlyWorking: false,
    description: "",
    bullets: "",
  }
}

function createProjectEntry(): ProfileProjectEntry {
  return {
    id: createLocalId("project"),
    name: "",
    role: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    currentlyWorking: false,
    description: "",
    bullets: "",
    technologies: "",
    githubUrl: "",
    liveUrl: "",
  }
}

function createExtracurricularEntry(): ProfileExtracurricularEntry {
  return {
    id: createLocalId("extracurricular"),
    organization: "",
    title: "",
    location: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    description: "",
    bullets: "",
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className={SMALL_LABEL_CLASS_NAME}>{label}</div>
      {children}
    </label>
  )
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-2 text-sm text-white/65">{description}</p>
      </div>
      {action}
    </div>
  )
}

function EntryShell({
  title,
  subtitle,
  onEdit,
  onDelete,
}: {
  title: string
  subtitle?: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-white/60">{subtitle}</div> : null}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className={ACTION_BUTTON_CLASS_NAME}>
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/15"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-sm text-white/55">
      {text}
    </div>
  )
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter()
  const normalizedInitialProfile = normalizeProfileData(initialProfile ?? emptyProfileData())

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUploadStatus, setResumeUploadStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle")
  const [resumeUploadMessage, setResumeUploadMessage] = useState("")

  const [sectionSaveState, setSectionSaveState] = useState<{
    section: SectionKey | null
    status: "idle" | "saving" | "done" | "error"
    message: string
  }>({
    section: null,
    status: "idle",
    message: "",
  })

  const [basics, setBasics] = useState<ProfileBasics>(normalizedInitialProfile.basics)
  const [educationEntries, setEducationEntries] = useState<ProfileEducationEntry[]>(
    normalizedInitialProfile.educationEntries
  )
  const [editingEducation, setEditingEducation] = useState<ProfileEducationEntry | null>(null)
  const [experienceEntries, setExperienceEntries] = useState<ProfileExperienceEntry[]>(
    normalizedInitialProfile.experienceEntries
  )
  const [editingExperience, setEditingExperience] = useState<ProfileExperienceEntry | null>(null)
  const [projectEntries, setProjectEntries] = useState<ProfileProjectEntry[]>(
    normalizedInitialProfile.projectEntries
  )
  const [editingProject, setEditingProject] = useState<ProfileProjectEntry | null>(null)
  const [skills, setSkills] = useState<ProfileSkills>(normalizedInitialProfile.skills)
  const [extracurricularEntries, setExtracurricularEntries] = useState<
    ProfileExtracurricularEntry[]
  >(normalizedInitialProfile.extracurricularEntries)
  const [editingExtracurricular, setEditingExtracurricular] =
    useState<ProfileExtracurricularEntry | null>(null)

  function applyProfile(nextProfile: ProfileData) {
    const normalized = normalizeProfileData(nextProfile)
    setBasics(normalized.basics)
    setEducationEntries(normalized.educationEntries)
    setExperienceEntries(normalized.experienceEntries)
    setProjectEntries(normalized.projectEntries)
    setSkills(normalized.skills)
    setExtracurricularEntries(normalized.extracurricularEntries)
    setEditingEducation(null)
    setEditingExperience(null)
    setEditingProject(null)
    setEditingExtracurricular(null)
  }

  function applyParsedDraft(profileDraft: ProfileDraft) {
    applyProfile(profileDataFromDraft(profileDraft))
  }

  async function onUploadResume() {
    if (!resumeFile) return

    setResumeUploadStatus("uploading")
    setResumeUploadMessage("")

    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)

      const response = await fetch("/api/profile/base-resume", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setResumeUploadStatus("error")
        setResumeUploadMessage(data?.error || "Upload failed")
        return
      }

      if (data?.parsedProfileDraft) {
        applyParsedDraft(data.parsedProfileDraft as ProfileDraft)
      }

      setResumeUploadStatus("done")
      setResumeUploadMessage(
        data?.parsedProfileDraft
          ? `Saved draft and parsed: ${data.baseResume.fileName}`
          : `Saved base resume: ${data.baseResume.fileName}`
      )
    } catch {
      setResumeUploadStatus("error")
      setResumeUploadMessage("Upload failed")
    }
  }

  async function persistSection<TEntry>(
    section: SectionKey,
    entries: TEntry[],
    onSuccess: (savedEntries: TEntry[]) => void
  ) {
    setSectionSaveState({
      section,
      status: "saving",
      message: "",
    })

    try {
      const response = await fetch("/api/profile/section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          entries,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setSectionSaveState({
          section,
          status: "error",
          message: data?.error || "Section save failed",
        })
        return false
      }

      onSuccess((data?.entries as TEntry[]) ?? entries)
      setSectionSaveState({
        section,
        status: "done",
        message: "Saved to the database.",
      })
      router.refresh()
      return true
    } catch {
      setSectionSaveState({
        section,
        status: "error",
        message: "Section save failed",
      })
      return false
    }
  }

  async function saveEducationEntry() {
    if (!editingEducation) return
    const nextEntries = educationEntries.some((entry) => entry.id === editingEducation.id)
      ? educationEntries.map((entry) =>
          entry.id === editingEducation.id ? editingEducation : entry
        )
      : [...educationEntries, editingEducation]

    await persistSection("education", nextEntries, (savedEntries) => {
      setEducationEntries(savedEntries)
      setEditingEducation(null)
    })
  }

  async function saveExperienceEntry() {
    if (!editingExperience) return
    const nextEntries = experienceEntries.some((entry) => entry.id === editingExperience.id)
      ? experienceEntries.map((entry) =>
          entry.id === editingExperience.id ? editingExperience : entry
        )
      : [...experienceEntries, editingExperience]

    await persistSection("experience", nextEntries, (savedEntries) => {
      setExperienceEntries(savedEntries)
      setEditingExperience(null)
    })
  }

  async function saveProjectEntry() {
    if (!editingProject) return
    const nextEntries = projectEntries.some((entry) => entry.id === editingProject.id)
      ? projectEntries.map((entry) =>
          entry.id === editingProject.id ? editingProject : entry
        )
      : [...projectEntries, editingProject]

    await persistSection("projects", nextEntries, (savedEntries) => {
      setProjectEntries(savedEntries)
      setEditingProject(null)
    })
  }

  async function saveExtracurricularEntry() {
    if (!editingExtracurricular) return
    const nextEntries = extracurricularEntries.some(
      (entry) => entry.id === editingExtracurricular.id
    )
      ? extracurricularEntries.map((entry) =>
          entry.id === editingExtracurricular.id ? editingExtracurricular : entry
        )
      : [...extracurricularEntries, editingExtracurricular]

    await persistSection("extracurricular", nextEntries, (savedEntries) => {
      setExtracurricularEntries(savedEntries)
      setEditingExtracurricular(null)
    })
  }

  return (
    <div className="space-y-6">
      <section className={SECTION_CLASS_NAME}>
        <SectionHeader title="Base resume" description="" />

        <div className="mt-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 px-6 py-12 text-center hover:bg-black/30">
            <div className="text-sm text-white/80">
              {resumeFile ? resumeFile.name : "Click to choose a PDF"}
            </div>
            <div className="text-xs text-white/50">PDF only</div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onUploadResume}
              disabled={!resumeFile || resumeUploadStatus === "uploading"}
              className={PRIMARY_BUTTON_CLASS_NAME}
            >
              {resumeUploadStatus === "uploading" ? "Uploading and parsing..." : "Save base resume"}
            </button>
            {resumeUploadMessage ? (
              <div
                className={`text-sm ${
                  resumeUploadStatus === "error" ? "text-red-300" : "text-white/75"
                }`}
              >
                {resumeUploadMessage}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={SECTION_CLASS_NAME}>
        <SectionHeader
          title="Basics"
          description=""
        />
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Full name">
            <input
              type="text"
              value={basics.fullName}
              onChange={(event) =>
                setBasics((current) => ({ ...current, fullName: event.target.value }))
              }
              placeholder="Jane Doe"
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={basics.email}
              onChange={(event) =>
                setBasics((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="jane@example.com"
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={basics.phone}
              onChange={(event) =>
                setBasics((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="(555) 555-5555"
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="Location">
            <input
              type="text"
              value={basics.location}
              onChange={(event) =>
                setBasics((current) => ({ ...current, location: event.target.value }))
              }
              placeholder="Chicago, IL"
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="LinkedIn">
            <input
              type="text"
              value={basics.linkedIn}
              onChange={(event) =>
                setBasics((current) => ({ ...current, linkedIn: event.target.value }))
              }
              placeholder="linkedin.com/in/janedoe"
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="GitHub">
            <input
              type="text"
              value={basics.github}
              onChange={(event) =>
                setBasics((current) => ({ ...current, github: event.target.value }))
              }
              placeholder="github.com/janedoe"
              className={INPUT_CLASS_NAME}
            />
          </Field>
        </div>
      </section>

      <section className={SECTION_CLASS_NAME}>
        <SectionHeader
          title="Education"
          description=""
          action={
            <button
              type="button"
              onClick={() => setEditingEducation(createEducationEntry())}
              className={ACTION_BUTTON_CLASS_NAME}
            >
              + Add education
            </button>
          }
        />
        <div className="mt-6 space-y-4">
          {educationEntries.length ? (
            educationEntries.map((entry) => (
              <EntryShell
                key={entry.id}
                title={entry.school || "Untitled education"}
                subtitle={[entry.college, entry.degree, entry.fieldOfStudy]
                  .filter(Boolean)
                  .join(" • ")}
                onEdit={() => setEditingEducation({ ...entry })}
                onDelete={() =>
                  setEducationEntries((current) =>
                    current.filter((currentEntry) => currentEntry.id !== entry.id)
                  )
                }
              />
            ))
          ) : (
            <EmptyState text="No education entries yet." />
          )}
          {editingEducation ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-medium text-white">Education entry</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="School">
                  <input
                    type="text"
                    value={editingEducation.school}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, school: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="College">
                  <input
                    type="text"
                    value={editingEducation.college}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, college: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Degree">
                  <input
                    type="text"
                    value={editingEducation.degree}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, degree: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Field of study / major">
                  <input
                    type="text"
                    value={editingEducation.fieldOfStudy}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, fieldOfStudy: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Minor">
                  <input
                    type="text"
                    value={editingEducation.minor}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, minor: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="School year">
                  <input
                    type="text"
                    value={editingEducation.schoolYear}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, schoolYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Start month">
                  <input
                    type="text"
                    value={editingEducation.startMonth}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, startMonth: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Start year">
                  <input
                    type="text"
                    value={editingEducation.startYear}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, startYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="End month">
                  <input
                    type="text"
                    value={editingEducation.endMonth}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, endMonth: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="End year">
                  <input
                    type="text"
                    value={editingEducation.endYear}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, endYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="GPA">
                  <input
                    type="text"
                    value={editingEducation.gpa}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, gpa: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Department GPA">
                  <input
                    type="text"
                    value={editingEducation.departmentGpa}
                    onChange={(event) =>
                      setEditingEducation((current) =>
                        current ? { ...current, departmentGpa: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={editingEducation.currentlyAttending}
                  onChange={(event) =>
                    setEditingEducation((current) =>
                      current
                        ? { ...current, currentlyAttending: event.target.checked }
                        : current
                    )
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black/20"
                />
                Currently attending
              </label>
              <Field label="Description">
                <textarea
                  value={editingEducation.description}
                  onChange={(event) =>
                    setEditingEducation((current) =>
                      current ? { ...current, description: event.target.value } : current
                    )
                  }
                  className={TEXTAREA_CLASS_NAME}
                />
              </Field>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={saveEducationEntry}
                  disabled={
                    sectionSaveState.section === "education" &&
                    sectionSaveState.status === "saving"
                  }
                  className={PRIMARY_BUTTON_CLASS_NAME}
                >
                  {sectionSaveState.section === "education" &&
                  sectionSaveState.status === "saving"
                    ? "Saving education..."
                    : "Save education"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEducation(null)}
                  className={ACTION_BUTTON_CLASS_NAME}
                >
                  Cancel
                </button>
              </div>
              {sectionSaveState.section === "education" && sectionSaveState.message ? (
                <div
                  className={`mt-3 text-sm ${
                    sectionSaveState.status === "error" ? "text-red-300" : "text-white/75"
                  }`}
                >
                  {sectionSaveState.message}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className={SECTION_CLASS_NAME}>
        <SectionHeader
          title="Experience"
          description=""
          action={
            <button
              type="button"
              onClick={() => setEditingExperience(createExperienceEntry())}
              className={ACTION_BUTTON_CLASS_NAME}
            >
              + Add experience
            </button>
          }
        />
        <div className="mt-6 space-y-4">
          {experienceEntries.length ? (
            experienceEntries.map((entry) => (
              <EntryShell
                key={entry.id}
                title={entry.title || "Untitled experience"}
                subtitle={[entry.company, entry.location].filter(Boolean).join(" • ")}
                onEdit={() => setEditingExperience({ ...entry })}
                onDelete={() =>
                  setExperienceEntries((current) =>
                    current.filter((currentEntry) => currentEntry.id !== entry.id)
                  )
                }
              />
            ))
          ) : (
            <EmptyState text="No experience entries yet." />
          )}
          {editingExperience ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-medium text-white">Experience entry</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Company">
                  <input
                    type="text"
                    value={editingExperience.company}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, company: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Title">
                  <input
                    type="text"
                    value={editingExperience.title}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, title: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Employment type">
                  <input
                    type="text"
                    value={editingExperience.employmentType}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, employmentType: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Location">
                  <input
                    type="text"
                    value={editingExperience.location}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, location: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Start month">
                  <input
                    type="text"
                    value={editingExperience.startMonth}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, startMonth: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Start year">
                  <input
                    type="text"
                    value={editingExperience.startYear}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, startYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="End month">
                  <input
                    type="text"
                    value={editingExperience.endMonth}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, endMonth: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="End year">
                  <input
                    type="text"
                    value={editingExperience.endYear}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, endYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={editingExperience.currentlyWorking}
                  onChange={(event) =>
                    setEditingExperience((current) =>
                      current
                        ? { ...current, currentlyWorking: event.target.checked }
                        : current
                    )
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black/20"
                />
                Currently working here
              </label>
              <div className="mt-4 grid gap-4">
                <Field label="Description">
                  <textarea
                    value={editingExperience.description}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, description: event.target.value } : current
                      )
                    }
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>
                <Field label="Bullets">
                  <textarea
                    value={editingExperience.bullets}
                    onChange={(event) =>
                      setEditingExperience((current) =>
                        current ? { ...current, bullets: event.target.value } : current
                      )
                    }
                    placeholder="One bullet per line"
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={saveExperienceEntry}
                  disabled={
                    sectionSaveState.section === "experience" &&
                    sectionSaveState.status === "saving"
                  }
                  className={PRIMARY_BUTTON_CLASS_NAME}
                >
                  {sectionSaveState.section === "experience" &&
                  sectionSaveState.status === "saving"
                    ? "Saving experience..."
                    : "Save experience"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingExperience(null)}
                  className={ACTION_BUTTON_CLASS_NAME}
                >
                  Cancel
                </button>
              </div>
              {sectionSaveState.section === "experience" && sectionSaveState.message ? (
                <div
                  className={`mt-3 text-sm ${
                    sectionSaveState.status === "error" ? "text-red-300" : "text-white/75"
                  }`}
                >
                  {sectionSaveState.message}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className={SECTION_CLASS_NAME}>
        <SectionHeader
          title="Projects"
          description=""
          action={
            <button
              type="button"
              onClick={() => setEditingProject(createProjectEntry())}
              className={ACTION_BUTTON_CLASS_NAME}
            >
              + Add project
            </button>
          }
        />
        <div className="mt-6 space-y-4">
          {projectEntries.length ? (
            projectEntries.map((entry) => (
              <EntryShell
                key={entry.id}
                title={entry.name || "Untitled project"}
                subtitle={[entry.role, entry.technologies].filter(Boolean).join(" • ")}
                onEdit={() => setEditingProject({ ...entry })}
                onDelete={() =>
                  setProjectEntries((current) =>
                    current.filter((currentEntry) => currentEntry.id !== entry.id)
                  )
                }
              />
            ))
          ) : (
            <EmptyState text="No project entries yet." />
          )}
          {editingProject ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-medium text-white">Project entry</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input
                    type="text"
                    value={editingProject.name}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, name: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Role">
                  <input
                    type="text"
                    value={editingProject.role}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, role: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Start month">
                  <input
                    type="text"
                    value={editingProject.startMonth}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, startMonth: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Start year">
                  <input
                    type="text"
                    value={editingProject.startYear}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, startYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="End month">
                  <input
                    type="text"
                    value={editingProject.endMonth}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, endMonth: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="End year">
                  <input
                    type="text"
                    value={editingProject.endYear}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, endYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Technologies">
                  <input
                    type="text"
                    value={editingProject.technologies}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, technologies: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="GitHub URL">
                  <input
                    type="text"
                    value={editingProject.githubUrl}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, githubUrl: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Live URL">
                  <input
                    type="text"
                    value={editingProject.liveUrl}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, liveUrl: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={editingProject.currentlyWorking}
                  onChange={(event) =>
                    setEditingProject((current) =>
                      current
                        ? { ...current, currentlyWorking: event.target.checked }
                        : current
                    )
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black/20"
                />
                Currently active
              </label>
              <div className="mt-4 grid gap-4">
                <Field label="Description">
                  <textarea
                    value={editingProject.description}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, description: event.target.value } : current
                      )
                    }
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>
                <Field label="Bullets">
                  <textarea
                    value={editingProject.bullets}
                    onChange={(event) =>
                      setEditingProject((current) =>
                        current ? { ...current, bullets: event.target.value } : current
                      )
                    }
                    placeholder="One bullet per line"
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={saveProjectEntry}
                  disabled={
                    sectionSaveState.section === "projects" &&
                    sectionSaveState.status === "saving"
                  }
                  className={PRIMARY_BUTTON_CLASS_NAME}
                >
                  {sectionSaveState.section === "projects" &&
                  sectionSaveState.status === "saving"
                    ? "Saving project..."
                    : "Save project"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className={ACTION_BUTTON_CLASS_NAME}
                >
                  Cancel
                </button>
              </div>
              {sectionSaveState.section === "projects" && sectionSaveState.message ? (
                <div
                  className={`mt-3 text-sm ${
                    sectionSaveState.status === "error" ? "text-red-300" : "text-white/75"
                  }`}
                >
                  {sectionSaveState.message}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className={SECTION_CLASS_NAME}>
        <SectionHeader
          title="Skills"
          description=""
        />
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Languages">
            <input
              type="text"
              value={skills.languages}
              onChange={(event) =>
                setSkills((current) => ({ ...current, languages: event.target.value }))
              }
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="Frameworks">
            <input
              type="text"
              value={skills.frameworks}
              onChange={(event) =>
                setSkills((current) => ({ ...current, frameworks: event.target.value }))
              }
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="Tools">
            <input
              type="text"
              value={skills.tools}
              onChange={(event) =>
                setSkills((current) => ({ ...current, tools: event.target.value }))
              }
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="Cloud">
            <input
              type="text"
              value={skills.cloud}
              onChange={(event) =>
                setSkills((current) => ({ ...current, cloud: event.target.value }))
              }
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="Databases">
            <input
              type="text"
              value={skills.databases}
              onChange={(event) =>
                setSkills((current) => ({ ...current, databases: event.target.value }))
              }
              className={INPUT_CLASS_NAME}
            />
          </Field>
          <Field label="Other">
            <input
              type="text"
              value={skills.other}
              onChange={(event) =>
                setSkills((current) => ({ ...current, other: event.target.value }))
              }
              className={INPUT_CLASS_NAME}
            />
          </Field>
        </div>
      </section>

      <section className={SECTION_CLASS_NAME}>
        <SectionHeader
          title="Extracurricular"
          description=""
          action={
            <button
              type="button"
              onClick={() => setEditingExtracurricular(createExtracurricularEntry())}
              className={ACTION_BUTTON_CLASS_NAME}
            >
              + Add extracurricular
            </button>
          }
        />
        <div className="mt-6 space-y-4">
          {extracurricularEntries.length ? (
            extracurricularEntries.map((entry) => (
              <EntryShell
                key={entry.id}
                title={entry.organization || "Untitled extracurricular"}
                subtitle={[entry.title, entry.location].filter(Boolean).join(" • ")}
                onEdit={() => setEditingExtracurricular({ ...entry })}
                onDelete={() =>
                  setExtracurricularEntries((current) =>
                    current.filter((currentEntry) => currentEntry.id !== entry.id)
                  )
                }
              />
            ))
          ) : (
            <EmptyState text="No extracurricular entries yet." />
          )}
          {editingExtracurricular ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-medium text-white">Extracurricular entry</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Organization">
                  <input
                    type="text"
                    value={editingExtracurricular.organization}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, organization: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Title">
                  <input
                    type="text"
                    value={editingExtracurricular.title}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, title: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Location">
                  <input
                    type="text"
                    value={editingExtracurricular.location}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, location: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Start month">
                  <input
                    type="text"
                    value={editingExtracurricular.startMonth}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, startMonth: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="Start year">
                  <input
                    type="text"
                    value={editingExtracurricular.startYear}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, startYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="End month">
                  <input
                    type="text"
                    value={editingExtracurricular.endMonth}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, endMonth: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
                <Field label="End year">
                  <input
                    type="text"
                    value={editingExtracurricular.endYear}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, endYear: event.target.value } : current
                      )
                    }
                    className={INPUT_CLASS_NAME}
                  />
                </Field>
              </div>
              <div className="mt-4 grid gap-4">
                <Field label="Description">
                  <textarea
                    value={editingExtracurricular.description}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, description: event.target.value } : current
                      )
                    }
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>
                <Field label="Bullets">
                  <textarea
                    value={editingExtracurricular.bullets}
                    onChange={(event) =>
                      setEditingExtracurricular((current) =>
                        current ? { ...current, bullets: event.target.value } : current
                      )
                    }
                    placeholder="One bullet per line"
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={saveExtracurricularEntry}
                  disabled={
                    sectionSaveState.section === "extracurricular" &&
                    sectionSaveState.status === "saving"
                  }
                  className={PRIMARY_BUTTON_CLASS_NAME}
                >
                  {sectionSaveState.section === "extracurricular" &&
                  sectionSaveState.status === "saving"
                    ? "Saving extracurricular..."
                    : "Save extracurricular"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingExtracurricular(null)}
                  className={ACTION_BUTTON_CLASS_NAME}
                >
                  Cancel
                </button>
              </div>
              {sectionSaveState.section === "extracurricular" &&
              sectionSaveState.message ? (
                <div
                  className={`mt-3 text-sm ${
                    sectionSaveState.status === "error" ? "text-red-300" : "text-white/75"
                  }`}
                >
                  {sectionSaveState.message}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
