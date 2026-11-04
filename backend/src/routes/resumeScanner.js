const { Router } = require('express');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const mammoth = require('mammoth');

const router = Router();

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF, Word, or text files are allowed'));
  },
});

// ─── Content preparation ───────────────────────────────────────────────────
// PDFs go directly to Claude (native PDF support — no extraction needed).
// DOCX → mammoth text extraction. Plain text → pass through.

async function prepareContent(buffer, mimetype) {
  if (!buffer || buffer.length === 0) return { type: 'text', text: '' };
  try {
    if (mimetype === 'application/pdf') {
      return { type: 'pdf', data: buffer.toString('base64') };
    }
    if (
      mimetype === 'application/msword' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return { type: 'text', text: result.value || '' };
    }
    return { type: 'text', text: buffer.toString('utf8') };
  } catch (err) {
    console.error('Content prep failed:', err.message);
    return { type: 'text', text: '' };
  }
}

// Extract text from JD file (always text — not sent to Claude as a document)
async function extractText(buffer, mimetype) {
  const c = await prepareContent(buffer, mimetype);
  if (c.type === 'pdf') {
    // For JD PDFs we need text — use mammoth fallback won't work for PDFs,
    // so we'll return a placeholder and let Claude handle it inline if needed.
    // Best approach: treat JD PDF as text via a separate Claude call, or just
    // ask the user to paste. For now return empty so caller can handle.
    return '';
  }
  return c.text;
}

// ─── Scoring prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert resume screener for a defense contractor staffing company (LCS Defense).
You evaluate resumes against job descriptions with military precision.

CLEARANCE HIERARCHY (important for scoring):
- No clearance < Secret < Top Secret (TS) < TS/SCI < TS/SCI with Polygraph
- If a job requires TS/SCI and a candidate has only Secret, that is a MISSED requirement.
- If a job requires Secret and the candidate has TS, that is EXCEEDED (treat as met).

SCORING:
- 70-100 = Strong (all required qualifications met, most preferred met)
- 50-69 = Moderate (most required qualifications met, some gaps)
- 0-49 = Weak (significant required gaps)

Respond ONLY with valid JSON matching this exact schema:
{
  "candidateName": string,
  "score": number (0-100),
  "tier": "Strong" | "Moderate" | "Weak",
  "clearanceMatch": "exact" | "exceeds" | "partial" | "none",
  "requirementsMet": string[],
  "requirementsMissed": string[],
  "strengths": string[],
  "gaps": string[],
  "summary": string
}`;

async function scoreResume(anthropic, jobDescription, content, candidateName) {
  let userContent;

  if (content.type === 'pdf') {
    // Send PDF natively — Claude reads it directly
    userContent = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: content.data },
      },
      {
        type: 'text',
        text: `JOB DESCRIPTION:\n${jobDescription}\n\nAnalyze the resume in the document above against this job description and return the JSON evaluation. Candidate name hint: ${candidateName || 'extract from resume'}.`,
      },
    ];
  } else {
    if (!content.text.trim()) throw new Error('Empty resume content');
    userContent = `JOB DESCRIPTION:\n${jobDescription}\n\n---\n\nCANDIDATE RESUME${candidateName ? ` (${candidateName})` : ''}:\n${content.text}\n\nAnalyze this resume against the job description and return the JSON evaluation.`;
  }

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content[0].text.trim();
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

// ─── Background processor ──────────────────────────────────────────────────

async function processSession(prisma, sessionId, resumes, jobDescription) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (const item of resumes) {
    try {
      const content = await prepareContent(item.buffer, item.mimetype);
      const isEmpty = content.type === 'text' && !content.text.trim();

      if (isEmpty) {
        await prisma.resumeSessionResult.create({
          data: {
            sessionId,
            candidateId: item.candidateId || null,
            candidateName: item.name || item.filename || 'Unknown',
            filename: item.filename || null,
            score: 0,
            tier: 'Weak',
            requirementsMet: [],
            requirementsMissed: ['Could not extract text from file'],
            strengths: [],
            gaps: ['File could not be read'],
            summary: 'Resume text could not be extracted.',
            clearanceMatch: 'none',
          },
        });
      } else {
        const result = await scoreResume(anthropic, jobDescription, content, item.name || '');
        await prisma.resumeSessionResult.create({
          data: {
            sessionId,
            candidateId: item.candidateId || null,
            candidateName: result.candidateName || item.name || item.filename || 'Unknown',
            filename: item.filename || null,
            score: Math.min(100, Math.max(0, result.score || 0)),
            tier: result.tier || 'Weak',
            requirementsMet: result.requirementsMet || [],
            requirementsMissed: result.requirementsMissed || [],
            strengths: result.strengths || [],
            gaps: result.gaps || [],
            summary: result.summary || '',
            clearanceMatch: result.clearanceMatch || null,
          },
        });
      }
    } catch (err) {
      console.error(`Failed scoring ${item.filename || item.name}:`, err.message);
      await prisma.resumeSessionResult.create({
        data: {
          sessionId,
          candidateId: item.candidateId || null,
          candidateName: item.name || item.filename || 'Unknown',
          filename: item.filename || null,
          score: 0,
          tier: 'Weak',
          requirementsMet: [],
          requirementsMissed: [],
          strengths: [],
          gaps: [],
          summary: `Scoring error: ${err.message}`,
          clearanceMatch: null,
        },
      });
    }

    await prisma.resumeSession.update({
      where: { id: sessionId },
      data: { processedCount: { increment: 1 } },
    });
  }

  await prisma.resumeSession.update({
    where: { id: sessionId },
    data: { status: 'complete' },
  });
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await req.prisma.resumeSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requisition: { select: { id: true, position: true, customer: true } },
        _count: { select: { results: true } },
      },
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid session ID' });
    const session = await req.prisma.resumeSession.findUnique({
      where: { id },
      include: {
        requisition: { select: { id: true, position: true, customer: true } },
        results: {
          orderBy: { score: 'desc' },
          include: { candidate: { select: { id: true, name: true } } },
        },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid session ID' });
    await req.prisma.resumeSession.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post(
  '/sessions',
  upload.fields([{ name: 'resumes', maxCount: 50 }, { name: 'jobDescFile', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { name, jobDescText, requisitionId } = req.body;
      const files = req.files || {};
      const resumeFiles = files.resumes || [];
      const jobDescFile = (files.jobDescFile || [])[0];

      let jobDescription = jobDescText || '';
      if (jobDescFile) {
        const extracted = await extractText(jobDescFile.buffer, jobDescFile.mimetype);
        if (extracted) jobDescription = extracted;
      }
      if (!jobDescription.trim()) {
        return res.status(400).json({ error: 'Job description is required (paste text or upload a Word/text file)' });
      }
      if (resumeFiles.length === 0 && !req.body.candidateIds) {
        return res.status(400).json({ error: 'At least one resume is required' });
      }

      const toProcess = resumeFiles.map((f) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        filename: f.originalname,
        name: null,
        candidateId: null,
      }));

      if (req.body.candidateIds) {
        const ids = JSON.parse(req.body.candidateIds);
        const candidates = await req.prisma.candidate.findMany({
          where: { id: { in: ids } },
          include: { resumes: { orderBy: { uploadedAt: 'desc' }, take: 1 } },
        });
        for (const c of candidates) {
          if (c.resumes.length > 0) {
            const r = c.resumes[0];
            toProcess.push({
              buffer: Buffer.isBuffer(r.data) ? r.data : Buffer.from(r.data),
              mimetype: r.mimeType,
              filename: r.filename,
              name: c.name,
              candidateId: c.id,
            });
          }
        }
      }

      if (toProcess.length === 0) {
        return res.status(400).json({ error: 'No processable resumes found' });
      }

      const session = await req.prisma.resumeSession.create({
        data: {
          name: name || null,
          requisitionId: requisitionId ? parseInt(requisitionId) : null,
          jobDescription,
          status: 'running',
          totalCount: toProcess.length,
          processedCount: 0,
        },
      });

      processSession(req.prisma, session.id, toProcess, jobDescription).catch((err) => {
        console.error('Session processing failed:', err.message);
        req.prisma.resumeSession
          .update({ where: { id: session.id }, data: { status: 'error' } })
          .catch(() => {});
      });

      res.status(201).json(session);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.post('/sessions/:id/results/:resultId/apply', async (req, res) => {
  try {
    const resultId = parseInt(req.params.resultId);
    if (isNaN(resultId)) return res.status(400).json({ error: 'Invalid result ID' });
    const result = await req.prisma.resumeSessionResult.findUnique({
      where: { id: resultId },
      include: { session: true },
    });
    if (!result) return res.status(404).json({ error: 'Result not found' });
    if (!result.session.requisitionId) {
      return res.status(400).json({ error: 'Session is not linked to a requisition' });
    }

    let { candidateId } = req.body;

    if (!candidateId && !result.candidateId) {
      const newCandidate = await req.prisma.candidate.create({
        data: { name: result.candidateName },
      });
      candidateId = newCandidate.id;
      await req.prisma.resumeSessionResult.update({
        where: { id: result.id },
        data: { candidateId: newCandidate.id },
      });
    } else {
      candidateId = result.candidateId || parseInt(candidateId);
    }

    const existing = await req.prisma.application.findFirst({
      where: { candidateId, requisitionId: result.session.requisitionId },
    });

    let application;
    if (existing) {
      application = await req.prisma.application.update({
        where: { id: existing.id },
        data: { alignmentPct: result.score },
      });
    } else {
      application = await req.prisma.application.create({
        data: {
          candidateId,
          requisitionId: result.session.requisitionId,
          alignmentPct: result.score,
          pipelineStage: 'Initial Contact',
        },
      });
    }

    await req.prisma.resumeSessionResult.update({
      where: { id: result.id },
      data: { applicationId: application.id },
    });

    res.json({ application, candidateId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
