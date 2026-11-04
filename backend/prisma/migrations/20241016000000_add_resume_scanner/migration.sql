-- CreateTable
CREATE TABLE "ResumeSession" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "requisitionId" INTEGER,
    "jobDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeSessionResult" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "candidateId" INTEGER,
    "candidateName" TEXT NOT NULL,
    "filename" TEXT,
    "score" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "requirementsMet" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirementsMissed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT NOT NULL,
    "clearanceMatch" TEXT,
    "applicationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeSessionResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResumeSession" ADD CONSTRAINT "ResumeSession_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeSessionResult" ADD CONSTRAINT "ResumeSessionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ResumeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeSessionResult" ADD CONSTRAINT "ResumeSessionResult_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
