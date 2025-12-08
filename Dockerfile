FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY backend/package*.json ./

# Install dependencies with memory limit
RUN npm ci --only=production --max-old-space-size=512

# Copy backend code
COPY backend/src ./src

# Create directories
RUN mkdir -p uploads vectors

# Expose port
EXPOSE 8000

# Set NODE memory limit
ENV NODE_OPTIONS="--max-old-space-size=512 --max-http-header-size=16384"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start server
CMD ["npm", "start"]

