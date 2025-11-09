# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Set working directory
WORKDIR /workspace/domains/platform/api-gateway

# Copy package files
COPY domains/platform/api-gateway/package*.json ./
COPY domains/platform/api-gateway/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy jest config from workspace root
COPY jest.config.base.js /workspace/

# Copy source code and tests
COPY domains/platform/api-gateway/src ./src
COPY domains/platform/api-gateway/test ./test
COPY domains/platform/api-gateway/jest.config.js ./jest.config.js

# Copy docs for Swagger
COPY docs /workspace/docs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
