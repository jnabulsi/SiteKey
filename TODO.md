# TODO

## Review Fixes

- [x] Replace SHA-256 with scrypt for password and access code hashing (login + access routes, hash script)
- [x] Invalidate session row in DB on logout (not just clear cookie)
- [x] Encode `orgSlug` in form action URLs consistently (`encodeURIComponent`)
- [x] Remove duplicate `if (!name)` check in `src/app/api/o/[orgSlug]/admin/assets/route.ts`
- [x] Remove redundant `requireAdminSession` call in `src/app/o/[orgSlug]/admin/page.tsx` (layout already handles it)
- [x] Decide on `SESSION_SECRET` — keeping for future CSRF signing
- [x] Add input length limits on form fields (server-side and/or maxlength)
- [x] Add expired session cleanup (prune on login)
- [x] Show error message on `/access` page when access code is wrong
- [x] Preserve `next` and `assetToken` on failed access code attempt

---

## Slice 4 — Direct-to-S3 Uploads (Admin)

- [x] `POST /api/o/[orgSlug]/admin/assets/[assetId]/documents/init-upload`
- [x] Client-side S3 PUT upload
- [x] `POST /api/o/[orgSlug]/admin/assets/[assetId]/documents/finalize-upload`
- [x] Admin UI for uploading documents on asset page

---

## Slice 5 — Document Management (Admin)

- [x] `PATCH /api/o/[orgSlug]/admin/documents/[documentId]`
- [x] `POST /api/o/[orgSlug]/admin/documents/[documentId]/init-replace`
- [x] `POST /api/o/[orgSlug]/admin/documents/[documentId]/finalize-replace`
- [x] `DELETE /api/o/[orgSlug]/admin/documents/[documentId]`
- [x] Admin UI for viewing, editing, replacing, deleting documents

---

## Slice 6 — Admin UX & Flow Refinement

- [x] Allow documents to be uploaded during asset creation
- [x] Refactor asset edit page layout
- [x] Improve document section structure
- [x] Standardise button hierarchy

---

## Slice 7 — QR Code Generation

- [x] Add `PUBLIC_BASE_URL` env var
- [x] `GET /api/o/[orgSlug]/admin/assets/[assetId]/qr`
- [x] QR download link on asset list
- [x] QR preview + download on asset edit page

---

## Slice 8 — Public Landing & Org Creation (Controlled)

Goal: Allow public testing without exposing yourself to runaway AWS costs.

- [x] Replace root `/` with landing page
- [x] Clear product explanation section
- [x] CTA: "Get Started"
- [x] CTA: "Org Login"
- [x] Contact section for real business use

Org creation flow:

- [x] Public org creation endpoint
- [x] Slug uniqueness validation
- [x] Initial admin password setup
- [x] Default asset/doc limits applied on creation

Abuse protection:

- [x] Add per-org limits:
  - [x] Max assets (e.g. 20)
  - [x] Max documents per asset (e.g. 10)
  - [x] Max total documents per org
- [x] Enforce limits server-side
- [x] Reject uploads once limits reached
- [x] Add simple per-IP org creation rate limit

---

## Slice 9 — Org Structure Simplification

Goal: Consolidate admin UX into something intentional.

- [ ] Remove unused "Home" dashboard
- [ ] Merge dashboard + assets into single org page
- [ ] Remove empty Settings page (or stub intentionally)
- [ ] Simplify top nav (Assets only + Logout)
- [ ] Ensure clean redirect after login → assets page

---

## Slice 10 — Asset List Overhaul (Core Management Surface)

Goal: Make asset list powerful and scalable.

Row behaviour:

- [ ] Entire row clickable to open asset
- [ ] Remove separate "Open" button
- [ ] Improve visual weight of Edit + QR buttons
- [ ] Clear hover state on row

Search + filtering:

- [ ] Add search by asset name
- [ ] Add visibility filter (Public / Private)
- [ ] Add sort options:
  - [ ] Alphabetical
  - [ ] Created date
  - [ ] Updated date
- [ ] Optional: tag system for assets
- [ ] Optional: filter by tag

Column controls:

- [ ] Add created_at column
- [ ] Add updated_at column
- [ ] Add document count column
- [ ] Optional: column visibility toggles

Scalability:

- [ ] Pagination (if asset count grows)
- [ ] Consider server-side sorting

---

## Slice 11 — Edit Asset Page Polish

- [ ] Convert "Open public link" to proper styled button
- [ ] Show document notes on Asset page 

---

## Slice 12 — Cost & Safety Hardening

Goal: Prevent accidental AWS cost explosion.

- [ ] Enforce max file size limit (server + S3)
- [ ] Restrict allowed MIME types (PDF only)
- [ ] Add S3 lifecycle rule for orphaned uploads
- [ ] Periodic cleanup script for stuck "uploading" docs
- [ ] Basic monitoring/logging of org + document counts

---

## Slice 13 — Final Security Layer

- [ ] Rate limiting on `/api/access`
- [ ] Rate limiting on `/api/o/[orgSlug]/admin/login`
- [ ] CSRF protection
- [ ] Audit auth cookies flags (Secure, HttpOnly, SameSite)
- [ ] Confirm no client exposure of AWS credentials

---

## Slice 14 — Optional SaaS-Ready Enhancements

- [ ] Org-level usage dashboard (asset/doc counts)
- [ ] Display usage limits visually in UI
- [ ] Soft warning when nearing limits
- [ ] Manual upgrade flag in DB for "paid org"
- [ ] Add simple email contact capture form

---

## Technical Cleanup

- [ ] Decide whether `last_seen_at` on Session is needed
- [ ] Review all env validation
- [ ] Review DB indexes (slug, assetId, token)
- [ ] Add production deployment checklist

