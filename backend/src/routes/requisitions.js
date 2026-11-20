const { Router } = require('express');
const multer = require('multer');
const router = Router();

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Document routes (before /:id to avoid conflicts)

router.get('/documents/:docId/file', async (req, res) => {
  try {
    const doc = await req.prisma.requisitionDocument.findUnique({
      where: { id: parseInt(req.params.docId) },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const buf = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/documents/:docId', async (req, res) => {
  try {
    await req.prisma.requisitionDocument.delete({ where: { id: parseInt(req.params.docId) } });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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
        applications: { include: { candidate: true } },
        documents: { select: { id: true, filename: true, mimeType: true, size: true, uploadedAt: true } },
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

// GET /api/requisitions/:id/documents
router.get('/:id/documents', async (req, res) => {
  try {
    const docs = await req.prisma.requisitionDocument.findMany({
      where: { requisitionId: parseInt(req.params.id) },
      select: { id: true, filename: true, mimeType: true, size: true, uploadedAt: true },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requisitions/:id/documents
router.post('/:id/documents', docUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const doc = await req.prisma.requisitionDocument.create({
      data: {
        requisitionId: parseInt(req.params.id),
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
      },
    });
    res.status(201).json({
      id: doc.id, filename: doc.filename, mimeType: doc.mimeType,
      size: doc.size, uploadedAt: doc.uploadedAt,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
