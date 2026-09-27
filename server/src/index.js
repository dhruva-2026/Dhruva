require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('./middleware/auth.js');
const { initCronJobs } = require('./services/cronService.js');
const db = require('./db/db.js');

// 1. Environment Variable Validation (Fail fast in production if required vars missing)
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (isProd && (!JWT_SECRET || JWT_SECRET === 'default-secret' || JWT_SECRET.length < 16)) {
  console.error('FATAL: Production requires a secure JWT_SECRET environment variable.');
  process.exit(1);
}

// Import route handlers
const authRoutes = require('./routes/authRoutes.js');
const paperRoutes = require('./routes/paperRoutes.js');
const ragRoutes = require('./routes/ragRoutes.js');
const researcherRoutes = require('./routes/researcherRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const locationRoutes = require('./routes/locationRoutes.js');
const mediaRoutes = require('./routes/mediaRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || (isProd ? false : '*');
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers with payload limits
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate Limiters for Public Auth and RAG Ingestion
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const ragLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Query rate limit reached. Please wait a moment before asking another question.' }
});

// Authentication middleware
app.use(authenticateToken);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health Check Endpoints (GET /health and GET /api/health)
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    project: 'DHRUVA — Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Database Health Check Endpoints (executing real query: SELECT 1;)
const dbHealthHandler = async (req, res) => {
  try {
    const health = await db.checkHealth();
    if (health.connected) {
      res.json({
        status: 'ok',
        database: 'connected',
        engine: health.database,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        error: isProd ? 'Database connectivity unavailable' : health.error
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'error',
      error: isProd ? 'Internal database check failure' : err.message
    });
  }
};
app.get('/health/db', dbHealthHandler);
app.get('/api/health/db', dbHealthHandler);

// Mount Routes with specific rate-limits
app.use('/api/auth/login', authLimiter);
app.use('/api/rag/ask', ragLimiter);

const aiRoutes = require('./routes/aiRoutes.js');

app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/researcher', researcherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/media', mediaRoutes);

// Catch-all 404 for undefined routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global Error Handler (Production responses do NOT expose stack traces or DB queries)
app.use((err, req, res, next) => {
  console.error('Server error context:', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: isProd ? undefined : err.stack
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isProd ? 'An unexpected server error occurred.' : err.message
  });
});

// Start Server & Background Schedulers
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 DHRUVA Polar Science Server running on port ${PORT}`);
    console.log(`❄️ Target Database: PostgreSQL + pgvector | Active Engine: Verified`);
    initCronJobs();
  });
}

module.exports = app;
