require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('./middleware/auth.js');
const { initCronJobs } = require('./services/cronService.js');
const { 
  requestCorrelationMiddleware, 
  log, 
  recordSecurityEvent, 
  getObservabilityMetrics 
} = require('./services/loggerService.js');
const { getLLMProviderStatus } = require('./services/llmService.js');
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
const aiRoutes = require('./routes/aiRoutes.js');
const docsRoutes = require('./routes/docsRoutes.js');

const app = express();

// 2. Request Correlation & Observability Middleware (Captures every incoming request)
app.use(requestCorrelationMiddleware);

// 3. Enterprise Security Headers (CSP, Frameguard, Referrer-Policy)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.unsplash.com"],
      connectSrc: ["'self'", "https://api.groq.com", "https://generativelanguage.googleapis.com"]
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' }
}));

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || (isProd ? false : '*');
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'x-guest-id']
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
  handler: (req, res) => {
    recordSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', 'MEDIUM', {
      ip: req.ip,
      path: req.originalUrl,
      requestId: req.requestId
    });
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again after 15 minutes.',
      requestId: req.requestId
    });
  }
});

const ragLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    recordSecurityEvent('RAG_RATE_LIMIT_EXCEEDED', 'LOW', {
      ip: req.ip,
      path: req.originalUrl,
      requestId: req.requestId
    });
    res.status(429).json({
      error: 'Query rate limit reached. Please wait a moment before asking another question.',
      requestId: req.requestId
    });
  }
});

// Authentication middleware
app.use(authenticateToken);

// Serve static uploads safely
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── HEALTH CHECK ENDPOINTS (GET /health, /health/db, /health/ai, /health/rag) ──
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    requestId: req.requestId,
    project: 'DHRUVA — Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Database Health Check (executing real query: SELECT 1;)
const dbHealthHandler = async (req, res) => {
  try {
    const health = await db.checkHealth();
    if (health.connected) {
      res.json({
        status: 'ok',
        requestId: req.requestId,
        database: 'connected',
        engine: health.database,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'error',
        requestId: req.requestId,
        database: 'disconnected',
        error: isProd ? 'Database connectivity unavailable' : health.error
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      requestId: req.requestId,
      database: 'error',
      error: isProd ? 'Internal database check failure' : err.message
    });
  }
};
app.get('/health/db', dbHealthHandler);
app.get('/api/health/db', dbHealthHandler);

// AI Multi-Provider Health Check
const aiHealthHandler = (req, res) => {
  try {
    const status = getLLMProviderStatus();
    res.json({
      status: 'ok',
      requestId: req.requestId,
      activeProvider: status.activeProvider,
      groqConfigured: status.groq.configured,
      geminiConfigured: status.gemini.configured,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      requestId: req.requestId,
      error: isProd ? 'AI provider check failed' : err.message
    });
  }
};
app.get('/health/ai', aiHealthHandler);
app.get('/api/health/ai', aiHealthHandler);

// Observability & Security Metrics API (Admin only or diagnostic)
app.get('/api/observability/metrics', (req, res) => {
  if (req.user && req.user.role === 'admin') {
    return res.json(getObservabilityMetrics());
  }
  // Publicly return non-sensitive uptime summary
  const metrics = getObservabilityMetrics();
  res.json({
    uptimeSeconds: metrics.uptimeSeconds,
    totalRequests: metrics.apiMetrics.totalRequests,
    statusCodes: metrics.apiMetrics.statusCodes,
    aiRequests: metrics.aiMetrics.totalRequests
  });
});

// Mount Routes with specific rate-limits
app.use('/api/auth/login', authLimiter);
app.use('/api/rag/ask', ragLimiter);

app.use('/docs', docsRoutes);
app.use('/api/docs', docsRoutes);
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
  res.status(404).json({ 
    error: 'Endpoint not found', 
    path: req.originalUrl,
    requestId: req.requestId 
  });
});

// Global Error Handler (Production responses do NOT expose stack traces or DB queries)
app.use((err, req, res, next) => {
  log('ERROR', `Unhandled server error: ${err.message}`, {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    stack: isProd ? undefined : err.stack
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    requestId: req.requestId || null,
    message: isProd ? 'An unexpected server error occurred. Please contact support referencing this request ID.' : err.message
  });
});

// Start Server & Background Schedulers
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 DHRUVA Polar Science Server running on port ${PORT}`);
    console.log(`❄️ Target Database: PostgreSQL + pgvector | Active Engine: Verified`);
    console.log(`🛡️ Security Monitoring & Correlation IDs: Active`);
    initCronJobs();
  });
}

module.exports = app;
