-- CreateTable
CREATE TABLE "public"."RateLimitAttempt" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitAttempt_key_created_at_idx" ON "public"."RateLimitAttempt"("key", "created_at");
