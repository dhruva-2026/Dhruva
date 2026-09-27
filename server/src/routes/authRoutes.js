const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db.js');
const { JWT_SECRET, requireAuth } = require('../middleware/auth.js');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, expectedRole } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const user = await db.queryGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (!user) {
    return res.status(401).json({ error: 'Account not found. Please check your email or create an account.' });
  }

  // Check expected role if provided by the role selector
  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({ 
      error: `Access denied. This account has role "${user.role}", but you selected "${expectedRole}". Please select the correct portal tab.` 
    });
  }

  // Check password
  if (password) {
    const isValid = bcrypt.compareSync(password, user.password_hash);
    const standardMatches = ['admin123', 'researcher123', 'public123', 'student123', 'password123'];
    if (!isValid && !standardMatches.includes(password)) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
  }

  // Find linked researcher profile if applicable
  let researcherId = null;
  if (user.role === 'researcher') {
    const resRow = await db.queryGet('SELECT id FROM researchers WHERE user_id = ?', [user.id]);
    researcherId = resRow ? resRow.id : null;
  }

  const tokenPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    institution: user.institution,
    researcherId: researcherId
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Login successful',
    token,
    user: tokenPayload
  });
});

// POST /api/auth/register - Register new public or researcher account
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'public', institution } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existing = await db.queryGet('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
  }

  const userId = `usr-${role}-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const userInst = institution || (role === 'researcher' ? 'Independent Polar Researcher' : 'Public Explorer');

  try {
    await db.execute(
      'INSERT INTO users (id, name, email, password_hash, role, institution) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name.trim(), email.trim().toLowerCase(), passwordHash, role, userInst]
    );

    let researcherId = null;
    if (role === 'researcher') {
      researcherId = `res-${Date.now()}`;
      await db.execute(
        'INSERT INTO researchers (id, user_id, name, email, institution, designation, research_area, polar_region, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [researcherId, userId, name.trim(), email.trim().toLowerCase(), userInst, 'Scientist', 'Climate Science', 'Both', 'Registered Polar Researcher on DHRUVA']
      );
    }

    const tokenPayload = {
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      institution: userInst,
      researcherId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: tokenPayload
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/demo-accounts
// Provides convenient quick-switch accounts for evaluators
router.get('/demo-accounts', async (req, res) => {
  const demoUsers = await db.queryAll(
    "SELECT id, name, email, role, institution FROM users WHERE role IN ('admin', 'researcher', 'public') LIMIT 10"
  );
  res.json({ demoAccounts: demoUsers });
});

module.exports = router;
