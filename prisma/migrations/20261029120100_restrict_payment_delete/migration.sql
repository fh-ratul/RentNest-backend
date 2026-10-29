-- Payment records must never be removed by a cascading delete.
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_rentalRequestId_fkey";

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
