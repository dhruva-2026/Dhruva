/**
 * DHRUVA Enterprise Security, Logging & Observability Service
 * Provides correlation ID tracking, structured logging, sanitization,
 * security event recording, AI/RAG metrics, and operational health telemetry.
 */

const crypto = require('crypto');

// In-memory telemetry ring buffers (capped to prevent memory growth)
const MAX_BUFFER_SIZE = 500;
const securityEvents = [];
const apiMetrics = {
  totalRequests: 0,
  requestsByMethod: {},
  statusCodes: {},
  slowRequests: [],
  endpointLatencies: {},
  errorCount5xx: 0,
  errorCount4xx: 0,
  startTime: Date.now()
};

const aiMetrics = {
  totalRequests: 0,
  providerUsage: { Groq: 0, 'Google Gemini': 0, 'Deterministic Engine': 0 },
  fallbacksTriggered: 0,
  latencies: [],
  avgLatencyMs: 0
};

const ragMetrics = {
  totalQueries: 0,
  emptyRetrievals: 0,
  lowConfidenceQueries: 0,
  cacheHits: 0,
  embargoBlocks: 0
};

/**
 * Generate unique correlation Request ID
 */
function generateRequestId() {
  const rand = crypto.randomBytes(4).toString('hex');
  return `DHRUVA-REQ-${Date.now().toString(36).toUpperCase()}-${rand.toUpperCase()}`;
}

/**
 * Sanitize object to remove passwords, tokens, API keys, and sensitive credentials
 */
function sanitize(obj, depth = 0) {
  if (!obj || depth > 3) return obj;
  if (typeof obj !== 'object') return obj;

  const SENSITIVE_KEYS = [
    'password', 'token', 'jwt', 'secret', 'authorization', 'cookie', 
    'api_key', 'apikey', 'groq_api_key', 'gemini_api_key', 'jwt_secret'
  ];

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1));
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      clean[key] = '[REDACTED_SENSITIVE]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value, depth + 1);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Core Structured Logger
 */
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    ...sanitize(meta)
  };

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && level === 'DEBUG') return; // Suppress debug in production

  const logStr = JSON.stringify(entry);
  if (level === 'ERROR' || level === 'SECURITY') {
    console.error(`[${level}] ${logStr}`);
  } else if (level === 'WARN') {
    console.warn(`[WARN] ${logStr}`);
  } else {
    console.log(`[${level}] ${logStr}`);
  }
}

/**
 * Record Security Specific Events (Brute force, unauthorized, prompt injection, etc.)
 */
function recordSecurityEvent(eventType, severity, details = {}) {
  const event = {
    id: `SEC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    eventType,
    severity: severity || 'MEDIUM', // LOW | MEDIUM | HIGH | CRITICAL
    ...sanitize(details)
  };

  securityEvents.unshift(event);
  if (securityEvents.length > MAX_BUFFER_SIZE) {
    securityEvents.pop();
  }

  log('SECURITY', `Security Event: ${eventType}`, event);
  return event;
}

/**
 * Record API Request Telemetry
 */
function recordApiMetric(method, path, statusCode, durationMs, reqId) {
  apiMetrics.totalRequests++;
  apiMetrics.requestsByMethod[method] = (apiMetrics.requestsByMethod[method] || 0) + 1;
  apiMetrics.statusCodes[statusCode] = (apiMetrics.statusCodes[statusCode] || 0) + 1;

  if (statusCode >= 500) apiMetrics.errorCount5xx++;
  else if (statusCode >= 400) apiMetrics.errorCount4xx++;

  // Track slow requests (> 1000ms)
  if (durationMs > 1000) {
    apiMetrics.slowRequests.unshift({
      reqId,
      method,
      path,
      statusCode,
      durationMs,
      timestamp: new Date().toISOString()
    });
    if (apiMetrics.slowRequests.length > 50) apiMetrics.slowRequests.pop();
  }

  // Update endpoint latency
  const epKey = `${method} ${path.split('?')[0]}`;
  if (!apiMetrics.endpointLatencies[epKey]) {
    apiMetrics.endpointLatencies[epKey] = { count: 0, totalMs: 0, avgMs: 0 };
  }
  const ep = apiMetrics.endpointLatencies[epKey];
  ep.count++;
  ep.totalMs += durationMs;
  ep.avgMs = Math.round(ep.totalMs / ep.count);
}

/**
 * Record AI / LLM Metric
 */
function recordAiMetric(provider, model, durationMs, success = true, isFallback = false) {
  aiMetrics.totalRequests++;
  if (aiMetrics.providerUsage[provider] !== undefined) {
    aiMetrics.providerUsage[provider]++;
  } else {
    aiMetrics.providerUsage[provider] = 1;
  }

  if (isFallback) aiMetrics.fallbacksTriggered++;

  aiMetrics.latencies.push(durationMs);
  if (aiMetrics.latencies.length > 100) aiMetrics.latencies.shift();

  const sum = aiMetrics.latencies.reduce((a, b) => a + b, 0);
  aiMetrics.avgLatencyMs = Math.round(sum / aiMetrics.latencies.length);
}

/**
 * Record RAG Metric
 */
function recordRagMetric(type) {
  ragMetrics.totalQueries++;
  if (type === 'empty') ragMetrics.emptyRetrievals++;
  if (type === 'low_confidence') ragMetrics.lowConfidenceQueries++;
  if (type === 'cache_hit') ragMetrics.cacheHits++;
  if (type === 'embargo_block') ragMetrics.embargoBlocks++;
}

/**
 * Express Middleware for Request ID & Correlation Tracking
 */
function requestCorrelationMiddleware(req, res, next) {
  const reqId = req.headers['x-request-id'] || generateRequestId();
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);

  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const durationMs = Math.round(elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6);

    recordApiMetric(req.method, req.originalUrl || req.url, res.statusCode, durationMs, reqId);

    log('INFO', `${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${durationMs}ms)`, {
      requestId: reqId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.userId || null,
      role: req.user?.role || 'public'
    });
  });

  next();
}

/**
 * Get aggregated observability metrics summary
 */
function getObservabilityMetrics() {
  const uptimeSeconds = Math.round((Date.now() - apiMetrics.startTime) / 1000);
  return {
    uptimeSeconds,
    apiMetrics: {
      totalRequests: apiMetrics.totalRequests,
      statusCodes: apiMetrics.statusCodes,
      errorCount4xx: apiMetrics.errorCount4xx,
      errorCount5xx: apiMetrics.errorCount5xx,
      slowRequestsCount: apiMetrics.slowRequests.length,
      topEndpoints: Object.entries(apiMetrics.endpointLatencies)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([ep, data]) => ({ endpoint: ep, ...data }))
    },
    aiMetrics,
    ragMetrics,
    securitySummary: {
      totalEvents: securityEvents.length,
      recentEvents: securityEvents.slice(0, 15)
    }
  };
}

module.exports = {
  generateRequestId,
  sanitize,
  log,
  recordSecurityEvent,
  recordApiMetric,
  recordAiMetric,
  recordRagMetric,
  requestCorrelationMiddleware,
  getObservabilityMetrics,
  securityEvents
};
