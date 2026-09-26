const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dhruva-polar-science-sih-2026-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of roles: ${allowed.join(', ')}` });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAuth,
  requireRole
};
