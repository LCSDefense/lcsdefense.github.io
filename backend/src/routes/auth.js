const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = Router();

const USERNAME = process.env.AUTH_USERNAME || 'lcs-admin';
// bcrypt hash of default password "LCSRecruit2026!" — override AUTH_PASSWORD_HASH in prod
const DEFAULT_HASH = '$2b$10$TdOLwh/DQIek0NG4pQov5.0KGIL7y8ogPR0VHokxiUtPjOm00nbM6';
const PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || DEFAULT_HASH;
const JWT_SECRET = process.env.JWT_SECRET || 'lcs-dev-jwt-secret-change-in-prod';
const JWT_EXPIRES = '10h';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username !== USERNAME) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, PASSWORD_HASH);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, expiresIn: JWT_EXPIRES });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware: verify JWT on protected routes
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { router, requireAuth };
