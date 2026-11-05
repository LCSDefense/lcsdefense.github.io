const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const { router: authRouter, requireAuth } = require('./routes/auth');
const requisitionsRouter = require('./routes/requisitions');
const candidatesRouter = require('./routes/candidates');
const applicationsRouter = require('./routes/applications');
const onboardingRouter = require('./routes/onboarding');
const dashboardRouter = require('./routes/dashboard');
const resumeScannerRouter = require('./routes/resumeScanner');

const prisma = new PrismaClient();
const app = express();

// ─── Trust Railway's proxy (required for rate limiting + accurate IPs) ──────
app.set('trust proxy', 1);

// ─── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://lcsdefense.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. curl, Postman, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// ─── Prisma on request ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// ─── Rate limiting ─────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan requests, please wait before trying again' },
});

app.use(generalLimiter);

// ─── Public routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Protected routes ──────────────────────────────────────────────────────
app.use('/api/requisitions', requireAuth, requisitionsRouter);
app.use('/api/candidates', requireAuth, candidatesRouter);
app.use('/api/applications', requireAuth, applicationsRouter);
app.use('/api/onboarding', requireAuth, onboardingRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/resume-scanner/sessions', requireAuth, scanLimiter, resumeScannerRouter);
app.use('/api/resume-scanner', requireAuth, resumeScannerRouter);

// ─── Global error handler ──────────────────────────────────────────────────
// Never leak internal error details to clients in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: 'An unexpected error occurred' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LCS Recruiting API running on port ${PORT}`);
});
