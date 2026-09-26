const express = require('express');
const cors = require('cors');
const path = require('path');
const { authenticateToken } = require('./middleware/auth.js');

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
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(authenticateToken);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'DHRUVA — Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/researcher', researcherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/media', mediaRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 DHRUVA Polar Science Server running on http://localhost:${PORT}`);
  console.log(`❄️ Connected to SQLite database with section-aware RAG pipeline.`);
});
