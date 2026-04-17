# NoCapResume — Evidence-Grounded AI Resume Tailoring

NoCapResume is a full-stack web app that tailors your resume to a specific job description using AI — with a **truthfulness constraint**: every generated suggestion must be grounded in evidence from your actual resume. No hallucinated skills. No fake credentials.

> **Live app:** `[PLACEHOLDER: add deployed URL]`
> **GitHub:** https://github.com/PanthiAashish/nocapresume

---

## What It Does

1. **Upload your resume PDF** — the system extracts text and uses GPT-4.1-mini to parse it into a structured profile (experience, education, skills, projects)
2. **Paste a job description** — the AI rewrites your resume bullets to match the role, constrained to only enhance what you've actually done
3. **Review the report** — every tailored bullet is labeled with source evidence, a confidence score, and job relevance score
4. **Download a single-page PDF** — compressed and formatted, ready to submit

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / Server | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 |
| Auth | Auth.js v5 (NextAuth) with Google OAuth |
| Database | Neon (PostgreSQL) |
| ORM | Prisma 6 |
| AI | OpenAI API (GPT-4.1-mini) |
| PDF Generation | pdf-lib |
| PDF Extraction | pdf-parse |

---

## Features

- Google OAuth sign-in
- Resume PDF upload with automatic text extraction and LLM parsing
- Structured profile management (experience, education, skills, projects)
- Evidence-grounded resume tailoring — bullets annotated with `sourceEvidence`, `confidence`, and `jobRelevanceScore`
- Enhancement report with matched keywords, before/after change log, and skill gap study guide
- Single-page PDF export with automatic compression (spacing, font, bullet reduction cascade)

---

## Repository Structure

```
nocapresume/
└── web/                        # Next.js application
    ├── src/
    │   ├── app/                # App Router pages + API routes
    │   │   ├── api/
    │   │   │   ├── auth/       # NextAuth handlers
    │   │   │   ├── profile/    # Resume upload + profile management
    │   │   │   ├── job-description/
    │   │   │   ├── resume/     # Tailoring + generation endpoints
    │   │   │   └── reports/    # PDF download
    │   │   ├── profile/        # Profile editing page
    │   │   └── reports/[reportId]/  # Tailored resume report page
    │   └── lib/                # Core logic (tailoring, rendering, parsing, schema)
    ├── prisma/                 # Schema + migrations
    └── scripts/
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database (or any Postgres DB)
- [OpenAI API key](https://platform.openai.com)
- Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com))

### 1. Clone and install

```bash
git clone https://github.com/PanthiAashish/nocapresume.git
cd nocapresume/web
npm install
```

### 2. Environment variables

Create `web/.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
OPENAI_API_KEY="sk-..."
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="your_google_client_id"
AUTH_GOOGLE_SECRET="your_google_client_secret"
```

> Never commit `.env` or `.env.local` — both are in `.gitignore`.

### 3. Google OAuth — add redirect URI

In Google Cloud Console → your OAuth app → Authorized redirect URIs, add:

```
http://localhost:3000/api/auth/callback/google
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Import the repo to [Vercel](https://vercel.com) and set the **Root Directory** to `web`
2. Add all environment variables from `.env.local` in the Vercel dashboard (set `AUTH_URL` to your production domain)
3. Add your production domain to Google OAuth's authorized redirect URIs:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```
4. After deploy, run migrations against the production database:
   ```bash
   DATABASE_URL="<production url>" npx prisma migrate deploy
   ```

---

## Usage

1. Sign in with Google
2. Upload your resume PDF — review the auto-parsed profile and correct anything if needed
3. Paste a job description on the dashboard and click Generate
4. Review the tailored resume report — matched keywords, evidence labels, study guide for skill gaps
5. Download your single-page tailored PDF

---

## Design Decisions

- **Two-stage LLM pipeline:** Parsing (extraction-only) and tailoring (constrained enhancement) use separate GPT-4.1-mini calls with `temperature=0` to keep outputs deterministic and auditable.
- **Evidence grounding:** The tailoring model is prohibited from inventing new job entries, titles, or dates. Every bullet must relate semantically to existing resume content.
- **Single-page compression:** The PDF renderer applies a cascade (drop sections → reduce bullets → shorten bullets → tighten spacing → reduce font) to guarantee one-page output.
- **Neon PostgreSQL:** Serverless Postgres with zero cold-start penalty on connection.

---

## License

Academic project — CSCI 411/412 Senior Seminar.
