-- CreateTable
CREATE TABLE "public"."Organisation" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "access_code_hash" TEXT NOT NULL,
    "admin_password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "public_token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "doc_type" TEXT,
    "storage_provider" TEXT NOT NULL DEFAULT 's3',
    "storage_key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" BIGINT,
    "checksum_sha256" TEXT,
    "uploaded_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "upload_status" TEXT NOT NULL DEFAULT 'uploading',
    "notes" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "session_token_hash" TEXT NOT NULL,
    "session_type" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_slug_key" ON "public"."Organisation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_public_token_key" ON "public"."Asset"("public_token");

-- CreateIndex
CREATE INDEX "Asset_org_id_idx" ON "public"."Asset"("org_id");

-- CreateIndex
CREATE INDEX "Document_asset_id_idx" ON "public"."Document"("asset_id");

-- CreateIndex
CREATE INDEX "Document_org_id_idx" ON "public"."Document"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_session_token_hash_key" ON "public"."Session"("session_token_hash");

-- CreateIndex
CREATE INDEX "Session_org_id_idx" ON "public"."Session"("org_id");

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
