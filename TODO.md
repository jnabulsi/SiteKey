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

## Slice 4 — Direct-to-S3 Uploads (Admin)

- [x] `POST /api/o/[orgSlug]/admin/assets/[assetId]/documents/init-upload`
- [x] Client-side S3 PUT upload
- [x] `POST /api/o/[orgSlug]/admin/assets/[assetId]/documents/finalize-upload`
- [x] Admin UI for uploading documents on asset page

## Slice 5 — Document Management (Admin)

- [x] `PATCH /api/o/[orgSlug]/admin/documents/[documentId]` — update metadata
- [x] `POST .../documents/[documentId]/init-replace` + `finalize-replace` — replace file
- [x] `DELETE /api/o/[orgSlug]/admin/documents/[documentId]` — delete doc + S3 object
- [x] Admin UI for viewing, editing, replacing, and deleting documents

## Slice 6 — Admin UX & Flow Refinement

- [x] Allow documents to be uploaded during asset creation (single cohesive create flow)
- [ ] Refactor asset edit page layout (improve section ordering and hierarchy)
- [ ] Improve document section structure (separate metadata editing from file actions)
- [ ] Standardise button hierarchy (primary, secondary, destructive)
- [ ] Improve error and loading state clarity across admin screens

## Other Remaining Work

- [ ] QR code generation endpoint (`GET /api/o/[orgSlug]/admin/assets/[assetId]/qr`)
- [ ] Rate limiting on `/api/access`
- [ ] Rate limiting on `/api/o/[orgSlug]/admin/login`
- [ ] CSRF protection
- [ ] Replace root `/` page with meaningful content
- [ ] Decide whether `last_seen_at` on Session is needed (update on auth or remove column)
- [ ] Asset list pagination (when needed)
