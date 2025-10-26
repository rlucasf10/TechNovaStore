# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Set working directory
WORKDIR /workspace/automation/auto-purchase

# Copy package files
COPY automation/auto-purchase/package*.json ./
COPY automation/auto-purchase/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code (not node_modules)
COPY automation/auto-purchase/src ./src
COPY automation/auto-purchase/*.md ./
COPY automation/auto-purchase/*.js ./ 2>/dev/null || true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
