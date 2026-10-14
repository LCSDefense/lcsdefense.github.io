const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_CHECKLIST = {
  HR: [
    "Collect W-4 and state tax forms",
    "Confirm I-9 documentation",
    "Set up direct deposit",
    "Add to payroll system",
    "Enroll in benefits (health, dental, vision, 401k)",
    "Issue employee handbook"
  ],
  Legal: [
    "Execute offer letter",
    "Sign NDA",
    "Sign IP assignment agreement"
  ],
  IT: [
    "Create LCS email address",
    "Set up VPN access",
    "Issue equipment",
    "Provision M365 account"
  ],
  Security: [
    "Confirm clearance with FSO",
    "Submit Visit Authorization Request",
    "Initiate CAC request",
    "Submit SAARS request",
    "Confirm EDIPI number"
  ],
  Facilities: [
    "Request campus/building badge",
    "Obtain parking pass",
    "Confirm work location"
  ],
  Admin: [
    "Create employee folder",
    "Save onboarding documents",
    "Schedule Day 1 orientation",
    "Assign LCS Manager"
  ]
};

async function main() {
  console.log('Seeding default checklist template...');
  // The checklist items are created when an onboarding record is created
  // This seed just verifies the DB connection
  const reqCount = await prisma.requisition.count();
  console.log(`Database connected. Current requisitions: ${reqCount}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

module.exports = { DEFAULT_CHECKLIST };
