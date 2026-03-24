<div align="center">

# Interview & Test AI Platform

**Web-based technical interview and coding assessment system**

[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway)](https://railway.app)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](#)

</div>

---

## About

A platform designed to streamline technical interviews and coding assessments. Built with fairness and integrity in mind — each session is time-controlled, access is gated by unique redeem codes, and participant behavior is monitored for violations. AI integration helps evaluators analyze responses more deeply.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Database | PostgreSQL · Supabase |
| ORM | Prisma |
| Cache | Upstash (Redis) |
| Storage | Cloudinary |
| AI | Groq API · Gemini API |
| Infrastructure | Docker · Railway |

---

## Features

### Participant Side

**Redeem Code Access**
Each participant enters the test using a unique single-use redeem code. Once used, the code is invalidated to prevent unauthorized or duplicate access.

**Global Timer**
A session-wide countdown timer ensures all participants complete the test within the defined time limit. The timer is enforced server-side.

**Cheating Detection**
The platform monitors participant behavior throughout the session. Tab switching, window blurring, and browser navigation away from the test are automatically detected and recorded as violations.

**AI-Powered Interview Analysis**
Participant responses are analyzed using AI (Groq and Gemini APIs) to evaluate communication, problem-solving, and technical depth — giving interviewers richer insights beyond raw scores.

---

### Admin Dashboard

**Question Management**
Create, edit, and delete interview questions and coding test problems.

**Redeem Code Generator**
Generate unique access codes for participants and manage their usage status.

**Results & Monitoring**
View participant results, scores, and recorded violation logs in one place.

**Admin Management**
Add and manage HR or admin accounts with role-based access.

---

## Getting Started

**1. Clone & install**

```bash
git clone https://github.com/username/interview-ai-platform.git
cd interview-ai-platform
npm install
```

**2. Setup environment**

```bash
cp .env.example .env.local
```

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI
GROQ_API_KEY=
GEMINI_API_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

**3. Setup database**

```bash
npx prisma migrate dev
npx prisma generate
```

**4. Run with Docker (optional)**

```bash
docker compose up --build
```

**5. Run dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
interview-ai-platform/
├── app/
│   ├── (participant)/        # Test session, redeem code entry
│   ├── admin/                # Dashboard, questions, codes, results
│   └── api/                  # API routes
├── components/               # Reusable UI components
├── lib/                      # AI clients, utilities, helpers
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
└── public/
```

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Lint check
npx prisma studio    # Database GUI
```

---

## Deployment

Infrastructure runs on **Railway** with PostgreSQL. Frontend deployed on **Vercel** or Railway.

> Make sure all environment variables are configured before deploying. Redis (Upstash) is required for the global timer to work correctly across sessions.

---

<div align="center">

Built for efficient, secure, and data-driven technical hiring.

</div>
