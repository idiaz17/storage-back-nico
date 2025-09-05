-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "contractId" INTEGER;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "clientId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "public"."Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
