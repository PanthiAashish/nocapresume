# NoCapResume — Evidence-Grounded Resume Tailoring

NoCapResume is a web app that helps users tailor their resume to a specific job description while enforcing a **truthfulness constraint**: generated suggestions must be grounded in evidence from the user's resume — no unsupported claims.

---

## Current Status

| Feature | Status |
|---|---|
| Google OAuth sign-in/sign-out (Auth.js / NextAuth)
| Modern landing + dashboard UI
| Resume PDF upload flow
| Cloud persistence via Neon Postgres + Prisma
| Success confirmation page after upload

**Planned next:** job description intake, resume parsing, evidence-grounded bullet suggestions, truthfulness guard labels, and export.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / Server | Next.js (App Router) + TypeScript + Tailwind CSS |
| Auth | Auth.js (NextAuth) with Google OAuth |
| Database | Neon (PostgreSQL) |
| ORM | Prisma |

---

## Repository Structure

```
nocapresume/
└── web/                  # Next.js app (UI + API routes)
    ├── src/
    │   ├── app/          # App Router pages + API routes
    │   └── lib/          # Prisma client helper, utilities
    ├── prisma/           # Prisma schema + migrations
    ├── .env              # DATABASE_URL for Prisma (DO NOT COMMIT)
    └── .env.local        # Next.js envs (Auth + DB) (DO NOT COMMIT)
```

---

## Setup Instructions

### 1. Prerequisites

- Node.js installed
- A Neon Postgres database (or any Postgres DB)
- Google OAuth Client (Google Cloud Console)

### 2. Install dependencies

```bash
cd web
npm install
```

### 3. Environment variables

Create `web/.env` (used by Prisma):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

Create `web/.env.local` (used by Next.js at runtime):

```env
AUTH_SECRET="your_auth_secret"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="your_google_client_id"
AUTH_GOOGLE_SECRET="your_google_client_secret"
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

> **Important:** Keep both files out of git — they contain secrets.

### 4. Google OAuth configuration

In Google Cloud Console, add the following redirect URI:

```
http://localhost:3000/api/auth/callback/google
```

### 5. Database migration

```bash
cd web
npx prisma migrate dev
npx prisma generate
```

### 6. Run the app

```bash
cd web
npm run dev
```

Then open:

- `http://localhost:3000` — landing page + Google sign-in
- `http://localhost:3000/dashboard` — upload UI (requires login)

---

## Demo Flow

1. Sign in with Google
2. Go to the Dashboard
3. Upload a resume PDF
4. File is stored as bytes in the `ResumeUpload` table in Neon Postgres
5. You are redirected to a success confirmation page

### Verify upload (optional)

Run this query in the Neon SQL Editor:

```sql
SELECT id, "userEmail", filename, "createdAt", octet_length(bytes) AS bytes_len
FROM "ResumeUpload"
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## Design Decisions (MVP)

- Resume PDFs are stored as raw bytes in Postgres for simplicity. A future improvement would be to move files to object storage (e.g. S3) and keep only metadata in Postgres.
- Authentication is Google OAuth only — no custom passwords.

---

## Roadmap

1. Job description input page + requirement extraction
2. PDF → text parsing + section structuring
3. Evidence-grounded bullet generation (structured JSON)
4. Truthfulness guard labels (Supported / Partial / Unsupported) + export filtering
5. PDF export of verified outputs

---

## License

For course / academic project use.
