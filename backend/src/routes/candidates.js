const { Router } = require('express');
const multer = require('multer');
const { encrypt, decrypt } = require('../crypto');
const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and Word documents are allowed'));
  },
});

function encryptSensitive(data) {
  const out = { ...data };
  if (out.ssn !== undefined) out.ssn = encrypt(out.ssn);
  if (out.dob !== undefined) out.dob = encrypt(out.dob);
  return out;
}

function decryptSensitive(candidate) {
  if (!candidate) return candidate;
  return {
    ...candidate,
    ssn: candidate.ssn ? decrypt(candidate.ssn) : candidate.ssn,
    dob: candidate.dob ? decrypt(candidate.dob) : candidate.dob,
  };
}

// Resume file routes (must be BEFORE /:id)

router.get('/resumes/:resumeId/file', async (req, res) => {
  try {
    const resume = await req.prisma.candidateResume.findUnique({
      where: { id: parseInt(req.params.resumeId) },
    });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    const buf = Buffer.isBuffer(resume.data) ? resume.data : Buffer.from(resume.data);
    res.setHeader('Content-Type', resume.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${resume.filename}"`);
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/resumes/:resumeId', async (req, res) => {
  try {
    await req.prisma.candidateResume.delete({ where: { id: parseInt(req.params.resumeId) } });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List candidates (SSN not returned in list)
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
    // Omit SSN from list view, decrypt DOB
    res.json(candidates.map(c => ({ ...c, ssn: undefined, dob: c.dob ? decrypt(c.dob) : c.dob })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create candidate
router.post('/', async (req, res) => {
  try {
    const candidate = await req.prisma.candidate.create({ data: encryptSensitive(req.body) });
    res.status(201).json(decryptSensitive(candidate));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get candidate (full detail with decrypted sensitive fields)
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
    res.json(decryptSensitive(candidate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update candidate
router.put('/:id', async (req, res) => {
  try {
    const candidate = await req.prisma.candidate.update({
      where: { id: parseInt(req.params.id) },
      data: encryptSensitive(req.body),
    });
    res.json(decryptSensitive(candidate));
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

// List resumes for a candidate
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
      id: resume.id, filename: resume.filename, mimeType: resume.mimeType,
      size: resume.size, uploadedAt: resume.uploadedAt,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
