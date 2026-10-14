const { Router } = require('express');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search, clearance } = req.query;
    const where = {};
    if (clearance) where.clearanceLevel = clearance;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { currentPosition: { contains: search, mode: 'insensitive' } },
        { currentCompany: { contains: search, mode: 'insensitive' } },
      ];
    }
    const candidates = await req.prisma.candidate.findMany({
      where,
      include: { applications: { select: { id: true, pipelineStage: true, requisition: { select: { position: true, customer: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const candidate = await req.prisma.candidate.create({ data: req.body });
    res.status(201).json(candidate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const candidate = await req.prisma.candidate.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        applications: {
          include: { requisition: true },
        },
      },
    });
    if (!candidate) return res.status(404).json({ error: 'Not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const candidate = await req.prisma.candidate.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(candidate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.candidate.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
