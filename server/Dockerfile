# Production Dockerfile for DHRUVA Server (PostgreSQL + pgvector Architecture)
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install dependencies (only production)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code and upload directories
COPY src/ ./src/
COPY uploads/ ./uploads/

# Expose API port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "src/index.js"]
