const { Router } = require('express');
const multer = require('multer');
const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and Word documents are allowed'));
  },
});

// List candidates
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

// Create candidate
router.post('/', async (req, res) => {
  try {
    const candidate = await req.prisma.candidate.create({ data: req.body });
    res.status(201).json(candidate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get candidate
router.get('/:id', async (req, res) => {
  try {
    const candidate = await req.prisma.candidate.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        applications: { include: { requisition: true } },
        resumes: { select: { id: true, filename: true, mimeType: true, size: true, uploadedAt: true } },
      },
    });
    if (!candidate) return res.status(404).json({ error: 'Not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update candidate
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

// Delete candidate
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.candidate.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Resume endpoints ---

// List resumes for a candidate (metadata only)
router.get('/:id/resumes', async (req, res) => {
  try {
    const resumes = await req.prisma.candidateResume.findMany({
      where: { candidateId: parseInt(req.params.id) },
      select: { id: true, filename: true, mimeType: true, size: true, uploadedAt: true },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload resume
router.post('/:id/resumes', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const resume = await req.prisma.candidateResume.create({
      data: {
        candidateId: parseInt(req.params.id),
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
      },
    });
    res.status(201).json({
      id: resume.id,
      filename: resume.filename,
      mimeType: resume.mimeType,
      size: resume.size,
      uploadedAt: resume.uploadedAt,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Download resume file
router.get('/resumes/:resumeId/file', async (req, res) => {
  try {
    const resume = await req.prisma.candidateResume.findUnique({
      where: { id: parseInt(req.params.resumeId) },
    });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.setHeader('Content-Type', resume.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${resume.filename}"`);
    res.setHeader('Content-Length', resume.size);
    res.send(resume.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete resume
router.delete('/resumes/:resumeId', async (req, res) => {
  try {
    await req.prisma.candidateResume.delete({ where: { id: parseInt(req.params.resumeId) } });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
