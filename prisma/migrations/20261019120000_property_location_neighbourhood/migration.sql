-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "neighbourhood" JSONB,
ADD COLUMN     "neighbourhoodSummary" TEXT,
ADD COLUMN     "neighbourhoodUpdatedAt" TIMESTAMP(3);

