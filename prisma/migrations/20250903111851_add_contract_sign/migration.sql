-- AlterTable
ALTER TABLE "public"."Contract" ADD COLUMN     "signed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signedBy" INTEGER;
