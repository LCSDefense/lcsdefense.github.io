const { Router } = require('express');
const router = Router();

// GET /api/requisitions
router.get('/', async (req, res) => {
  try {
    const { search, status, customer } = req.query;
    const where = {};
    if (status) where.status = status;
    if (customer) where.customer = customer;
    if (search) {
      where.OR = [
        { position: { contains: search, mode: 'insensitive' } },
        { customer: { contains: search, mode: 'insensitive' } },
        { recruiter: { contains: search, mode: 'insensitive' } },
        { contract: { contains: search, mode: 'insensitive' } },
      ];
    }
    const requisitions = await req.prisma.requisition.findMany({
      where,
      include: { applications: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requisitions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requisitions
router.post('/', async (req, res) => {
  try {
    const requisition = await req.prisma.requisition.create({ data: req.body });
    res.status(201).json(requisition);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/requisitions/:id
router.get('/:id', async (req, res) => {
  try {
    const requisition = await req.prisma.requisition.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        applications: {
          include: { candidate: true },
        },
      },
    });
    if (!requisition) return res.status(404).json({ error: 'Not found' });
    res.json(requisition);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requisitions/:id
router.put('/:id', async (req, res) => {
  try {
    const requisition = await req.prisma.requisition.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(requisition);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/requisitions/:id
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.requisition.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
