-- AlterTable
ALTER TABLE "public"."Organisation" ADD COLUMN     "max_assets" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "max_documents_per_asset" INTEGER NOT NULL DEFAULT 10;
