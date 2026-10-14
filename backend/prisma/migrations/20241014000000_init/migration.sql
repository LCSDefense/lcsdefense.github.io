-- CreateTable
CREATE TABLE "Requisition" (
    "id" SERIAL NOT NULL,
    "customer" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hiringManager" TEXT,
    "contract" TEXT,
    "workLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "openSlots" INTEGER NOT NULL DEFAULT 1,
    "recruiter" TEXT,
    "notes" TEXT,
    "folderLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "homeAddress" TEXT,
    "currentPosition" TEXT,
    "currentCompany" TEXT,
    "clearanceLevel" TEXT,
    "clearanceConfirmedBy" TEXT,
    "clearanceConfirmDate" TIMESTAMP(3),
    "salaryExpectation" TEXT,
    "sourcedBy" TEXT,
    "resumeLink" TEXT,
    "linkedInUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "requisitionId" INTEGER NOT NULL,
    "pipelineStage" TEXT NOT NULL DEFAULT 'Initial Contact',
    "alignmentPct" INTEGER,
    "clientStatus" TEXT,
    "dateInitialContact" TIMESTAMP(3),
    "dateInterested" TIMESTAMP(3),
    "dateLCSInterview" TIMESTAMP(3),
    "dateSentToClient" TIMESTAMP(3),
    "dateClientInterview" TIMESTAMP(3),
    "offerAmount" TEXT,
    "dateOffer" TIMESTAMP(3),
    "recruiter" TEXT,
    "jobDescription" TEXT,
    "internalNotes" TEXT,
    "dateOpened" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFilled" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingRecord" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "employeeName" TEXT NOT NULL,
    "personalEmail" TEXT,
    "personalPhone" TEXT,
    "homeAddress" TEXT,
    "hiringManager" TEXT,
    "startDate" TIMESTAMP(3),
    "position" TEXT,
    "customer" TEXT,
    "contract" TEXT,
    "taskOrderNumber" TEXT,
    "workLocation" TEXT,
    "requiredClearance" TEXT,
    "clearanceLevelVerification" TEXT,
    "salary" TEXT,
    "signOnBonus" TEXT,
    "offerType" TEXT,
    "awsIdNumber" TEXT,
    "awsLaborCategory" TEXT,
    "awsTargetRate" TEXT,
    "customerPOC" TEXT,
    "dob" TEXT,
    "ssn" TEXT,
    "salaryDotComRange" TEXT,
    "desiredSalary" TEXT,
    "estimatedTargetRate" TEXT,
    "billRate" TEXT,
    "lcsEmailAddress" TEXT,
    "milEmailAddress" TEXT,
    "apgBuildingNumber" TEXT,
    "company" TEXT,
    "c5isrDirectorate" TEXT,
    "c5isrDivision" TEXT,
    "c5isrBranch" TEXT,
    "effortProjectName" TEXT,
    "personalCell" TEXT,
    "workCell" TEXT,
    "officeNumber" TEXT,
    "cacRequired" TEXT,
    "cacType" TEXT,
    "cacEdipi" TEXT,
    "cacExpiration" TIMESTAMP(3),
    "visitRequestRequired" TEXT,
    "campusBadgeRequired" BOOLEAN NOT NULL DEFAULT false,
    "saarsRequired" BOOLEAN NOT NULL DEFAULT false,
    "fsoInfo" TEXT,
    "gtlInfo" TEXT,
    "branchChief" TEXT,
    "lcsManager" TEXT,
    "onSiteAdmin" TEXT,
    "plc" TEXT,
    "laborCategory" TEXT,
    "laborChargeCode" TEXT,
    "jobDescription" TEXT,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" SERIAL NOT NULL,
    "onboardingRecordId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingRecord_applicationId_key" ON "OnboardingRecord"("applicationId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "Requisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingRecord" ADD CONSTRAINT "OnboardingRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_onboardingRecordId_fkey" FOREIGN KEY ("onboardingRecordId") REFERENCES "OnboardingRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
