# TODO

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **React:** 19
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL via Prisma 6 ORM
- **File Storage:** AWS S3 (private bucket, presigned URLs for upload + download)
- **Auth:** Cookie-based sessions (scrypt-hashed passwords, SHA-256 session tokens, `httpOnly` + `secure` + `sameSite: "lax"`)
- **Validation:** Zod 4 (env vars, API inputs)
- **QR Codes:** `qrcode` library (server-side SVG generation)
- **Rate Limiting:** DB-backed per-IP rate limiter
- **Hosting:** Vercel
- **Build command:** `npx prisma generate && npm run build`

---

## Completed Slices

- [x] Review Fixes (password hashing, session cleanup, input limits, etc.)
- [x] Slice 4 — Direct-to-S3 Uploads
- [x] Slice 5 — Document Management
- [x] Slice 6 — Admin UX & Flow Refinement
- [x] Slice 7 — QR Code Generation
- [x] Slice 8 — Public Landing & Org Creation
- [x] Slice 9 — Org Structure Simplification
- [x] Slice 10 — Asset List Overhaul
- [x] Slice 11 — Edit Asset Page + Asset Page Polish

---

## Slice 12 — Pre-Deploy Hardening

Quick security and reliability fixes before going live.

- [x] Add `secure: true` to session cookies (4 call sites)
- [x] Rate limiting on `/api/access` and `/api/o/[orgSlug]/admin/login` (10 attempts / 10 min, IP-based)
- [x] Rate limit error messages on login + access pages
- [x] Cleanup orphaned uploads — `POST /api/cleanup` (protected by `CRON_SECRET` env var, deletes docs stuck in `uploading`/`replacing` for >1 hour + their S3 objects)

---

## Slice 13 — Portfolio Polish

- [x] Write a proper README.md (project summary, architecture, screenshots, setup instructions, security decisions)
- [x] Add custom not-found.tsx and loading.tsx pages (styled 404, skeleton states for admin pages)
- [x] Improve metadata and SEO (dynamic titles per page, OG tags on landing page, robots.txt)
- [x] Fix .env.example (add missing PUBLIC_BASE_URL and CRON_SECRET entries)
- [x] Add expired session cleanup to `/api/cleanup` endpoint
- [x] Add Vercel deployment config (vercel.json with cron for cleanup, verify build)

## Slice 14 — Self-Service Demo Mode

- [ ] Plan and implement "Try Demo" flow on landing page

---

## Slice 15 — Deploy to Vercel

- [ ] Create Vercel project and link repo
- [ ] Configure environment variables (DATABASE_URL, SESSION_SECRET, AWS_*, PUBLIC_BASE_URL, CRON_SECRET)
- [ ] Verify Prisma Postgres works with Vercel (connection pooling)
- [ ] Deploy and smoke test: org creation, login, asset CRUD, document upload, QR codes, field access
- [ ] Set up custom domain (if ready)

---

## Future (post-launch, as needed)

- Pagination on asset list (if asset limits increase)
- CSRF token protection (hardening — `sameSite: "lax"` covers most cases already)
- S3 lifecycle rule for orphaned uploads
- Email contact capture
