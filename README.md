# SiteKey

SiteKey links physical industrial assets — switchboards, machines, panels — to their technical documentation using QR codes.

A technician scans a QR label, enters a shared access code, and instantly views the relevant PDFs on their phone. 
The project was built to explore multi-tenant architecture, secure document delivery, and production-grade upload flows within a modern full-stack TypeScript application.

---

## Motivation

I built SiteKey to gain hands-on experience with:

- Designing a multi-tenant system with strict org-scoped data access
- Implementing secure authentication and session handling without external auth providers
- Handling large file uploads in a serverless environment
- Serving private documents securely via short-lived presigned URLs
- Structuring a full-stack Next.js application with clear separation of responsibilities

The goal was to move beyond demo-style CRUD apps and build something that resembles a real production system — with security, lifecycle management, and operational concerns considered from the start.

---

## How It Works

1. An **admin** creates an organisation and adds assets.
2. Each asset receives a unique QR code linked to a public token.
3. A **technician** scans the QR code on-site using any phone camera.
4. The technician enters a shared organisation access code.
5. The relevant documentation is delivered via a short-lived presigned S3 URL.

Admins manage assets and documents through an organisation-scoped dashboard. Documents are stored privately in S3 and never exposed directly.

---

## Features

- Multi-tenant organisation model
- Org-scoped admin dashboard
- QR-code-based asset access
- Shared access code for field technicians (no personal accounts)
- Secure cookie-based sessions (admin + field roles)
- Direct-to-S3 PDF uploads via presigned PUT URLs
- Short-lived presigned GET URLs for document delivery
- Upload lifecycle management with orphan cleanup
- Rate limiting on login and access endpoints

---

## Tech Stack

- Framework: Next.js (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- Database: PostgreSQL via Prisma ORM
- File storage: AWS S3 (private bucket, presigned URLs)
- Validation: Zod
- Hosting: Vercel

---

## Architecture Highlights

### Authentication & Sessions

- Passwords hashed with scrypt (memory-hard, built into Node.js)
- Session tokens hashed before database storage
- `httpOnly`, `secure` cookies
- Separate admin and field session types
- Database-backed rate limiting per IP

### Document Upload Flow

To avoid serverless body size limits, uploads use a 3-step flow:

1. Server creates a document record and returns a presigned S3 PUT URL  
2. Client uploads the PDF directly to S3  
3. Server verifies the object and marks the document as ready  

Orphaned uploads are garbage-collected via a scheduled cleanup endpoint.

### Security Model

- All queries are organisation-scoped
- Generic error responses avoid leaking asset or organisation existence
- Documents are never proxied through the app server
- Presigned GET URLs expire after a short duration

---
