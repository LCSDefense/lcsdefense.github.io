const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const requisitionsRouter = require('./routes/requisitions');
const candidatesRouter = require('./routes/candidates');
const applicationsRouter = require('./routes/applications');
const onboardingRouter = require('./routes/onboarding');
const dashboardRouter = require('./routes/dashboard');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Attach prisma to request
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.use('/api/requisitions', requisitionsRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LCS Recruiting API running on port ${PORT}`);
});
