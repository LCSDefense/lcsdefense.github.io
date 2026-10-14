const { Router } = require('express');
const router = Router();

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

// GET /api/onboarding
router.get('/', async (req, res) => {
  try {
    const records = await req.prisma.onboardingRecord.findMany({
      include: {
        application: {
          include: { requisition: true, candidate: true },
        },
        checklistItems: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onboarding
router.post('/', async (req, res) => {
  try {
    const { applicationId, ...rest } = req.body;

    // Build checklist items
    const checklistData = [];
    let sortOrder = 0;
    for (const [category, tasks] of Object.entries(DEFAULT_CHECKLIST)) {
      for (const task of tasks) {
        checklistData.push({ category, task, sortOrder: sortOrder++ });
      }
    }

    const record = await req.prisma.onboardingRecord.create({
      data: {
        applicationId: parseInt(applicationId),
        ...rest,
        checklistItems: { create: checklistData },
      },
      include: {
        application: { include: { requisition: true, candidate: true } },
        checklistItems: { orderBy: { sortOrder: 'asc' } },
      },
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/onboarding/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await req.prisma.onboardingRecord.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        application: { include: { requisition: true, candidate: true } },
        checklistItems: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/onboarding/:id
router.put('/:id', async (req, res) => {
  try {
    const record = await req.prisma.onboardingRecord.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: {
        application: { include: { requisition: true, candidate: true } },
        checklistItems: { orderBy: { sortOrder: 'asc' } },
      },
    });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/onboarding/:id/checklist
router.get('/:id/checklist', async (req, res) => {
  try {
    const items = await req.prisma.checklistItem.findMany({
      where: { onboardingRecordId: parseInt(req.params.id) },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onboarding/:id/checklist
router.post('/:id/checklist', async (req, res) => {
  try {
    const item = await req.prisma.checklistItem.create({
      data: {
        onboardingRecordId: parseInt(req.params.id),
        ...req.body,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/checklist/:id
router.put('/checklist/:id', async (req, res) => {
  try {
    const item = await req.prisma.checklistItem.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...req.body,
        completedDate: req.body.isComplete ? new Date() : null,
      },
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
