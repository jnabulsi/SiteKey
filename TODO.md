# TODO

## Review Fixes

- [x] Replace SHA-256 with scrypt for password and access code hashing (login + access routes, hash script)
- [ ] Invalidate session row in DB on logout (not just clear cookie)
- [ ] Encode `orgSlug` in form action URLs consistently (`encodeURIComponent`)
- [ ] Remove duplicate `if (!name)` check in `src/app/api/o/[orgSlug]/admin/assets/route.ts`
- [ ] Remove redundant `requireAdminSession` call in `src/app/o/[orgSlug]/admin/page.tsx` (layout already handles it)
- [ ] Decide on `SESSION_SECRET` — use it (CSRF?) or remove from env schema
- [ ] Add input length limits on form fields (server-side and/or maxlength)
- [ ] Add expired session cleanup (cron or pruning on write)

## Slice 4 — Direct-to-S3 Uploads (Admin)

- [ ] `POST /api/o/[orgSlug]/admin/assets/[assetId]/documents/init-upload`
- [ ] Client-side S3 PUT upload
- [ ] `POST /api/o/[orgSlug]/admin/assets/[assetId]/documents/finalize-upload`
- [ ] Admin UI for uploading documents on asset page

## Slice 5 — Document Management (Admin)

- [ ] `PATCH /api/o/[orgSlug]/admin/documents/[documentId]` — update metadata
- [ ] `POST .../documents/[documentId]/init-replace` + `finalize-replace` — replace file
- [ ] `DELETE /api/o/[orgSlug]/admin/documents/[documentId]` — delete doc + S3 object
- [ ] Admin UI for viewing, editing, replacing, and deleting documents

## Other Remaining Work

- [ ] QR code generation endpoint (`GET /api/o/[orgSlug]/admin/assets/[assetId]/qr`)
- [ ] Rate limiting on `/api/access` and `/api/o/[orgSlug]/admin/login`
- [ ] CSRF protection
- [ ] Replace root `/` page with something useful (still default create-next-app)
- [ ] Decide whether `last_seen_at` on Session is needed — update on auth or drop the column
- [ ] Asset list pagination (when needed)
