# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Set working directory
WORKDIR /workspace/automation/shipment-tracker

# Copy package files
COPY automation/shipment-tracker/package*.json ./
COPY automation/shipment-tracker/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code (not node_modules)
COPY automation/shipment-tracker/src ./src

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
