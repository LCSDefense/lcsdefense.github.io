const { Router } = require('express');
const router = Router();

const PIPELINE_STAGES = [
  'Initial Contact',
  'Interested',
  'LCS Interview',
  'Sent to Client',
  'Client Interview',
  'Offer',
  'Hired',
  'Rejected',
  'Withdrawn',
];

router.get('/', async (req, res) => {
  try {
    const { requisitionId, candidateId, stage } = req.query;
    const where = {};
    if (requisitionId) where.requisitionId = parseInt(requisitionId);
    if (candidateId) where.candidateId = parseInt(candidateId);
    if (stage) where.pipelineStage = stage;
    const applications = await req.prisma.application.findMany({
      where,
      include: {
        candidate: true,
        requisition: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const application = await req.prisma.application.create({
      data: req.body,
      include: { candidate: true, requisition: true },
    });
    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const application = await req.prisma.application.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        candidate: true,
        requisition: true,
        onboardingRecord: true,
      },
    });
    if (!application) return res.status(404).json({ error: 'Not found' });
    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const application = await req.prisma.application.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: { candidate: true, requisition: true },
    });
    res.json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.application.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/applications/:id/promote
router.post('/:id/promote', async (req, res) => {
  try {
    const app = await req.prisma.application.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!app) return res.status(404).json({ error: 'Not found' });

    const currentIdx = PIPELINE_STAGES.indexOf(app.pipelineStage);
    if (currentIdx === -1 || currentIdx >= PIPELINE_STAGES.length - 1) {
      return res.status(400).json({ error: 'Cannot promote further' });
    }

    const nextStage = PIPELINE_STAGES[currentIdx + 1];
    const dateField = {
      'Interested': 'dateInterested',
      'LCS Interview': 'dateLCSInterview',
      'Sent to Client': 'dateSentToClient',
      'Client Interview': 'dateClientInterview',
      'Offer': 'dateOffer',
      'Hired': 'dateFilled',
    }[nextStage];

    const updateData = { pipelineStage: nextStage };
    if (dateField) updateData[dateField] = new Date();

    const updated = await req.prisma.application.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { candidate: true, requisition: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
