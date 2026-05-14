-- AlterTable
ALTER TABLE "User" ADD COLUMN     "vesselId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
