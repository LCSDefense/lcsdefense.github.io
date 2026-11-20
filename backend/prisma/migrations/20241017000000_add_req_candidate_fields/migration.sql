ALTER TABLE "Requisition" ADD COLUMN IF NOT EXISTS "requiredClearance" TEXT;
ALTER TABLE "Requisition" ADD COLUMN IF NOT EXISTS "jobDescription" TEXT;
ALTER TABLE "Requisition" ADD COLUMN IF NOT EXISTS "billRate" TEXT;
ALTER TABLE "Requisition" ADD COLUMN IF NOT EXISTS "laborCategory" TEXT;
ALTER TABLE "Requisition" ADD COLUMN IF NOT EXISTS "idNumber" TEXT;
ALTER TABLE "Requisition" ADD COLUMN IF NOT EXISTS "customerPoc" TEXT;

ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "securityNotes" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "dob" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "ssn" TEXT;

CREATE TABLE IF NOT EXISTS "RequisitionDocument" (
  "id" SERIAL NOT NULL,
  "requisitionId" INTEGER NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequisitionDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RequisitionDocument" DROP CONSTRAINT IF EXISTS "RequisitionDocument_requisitionId_fkey";
ALTER TABLE "RequisitionDocument" ADD CONSTRAINT "RequisitionDocument_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
