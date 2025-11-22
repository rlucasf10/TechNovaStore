# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Set working directory
WORKDIR /workspace/domains/platform/api-gateway

# Copy package files
COPY domains/platform/api-gateway/package*.json ./
COPY domains/platform/api-gateway/tsconfig.json ./

# Copy shared packages (needed for local dependencies)
COPY shared /workspace/shared

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy jest config from workspace root
COPY jest.config.base.js /workspace/

# Copy source code (use cases, api, shared, config)
COPY domains/platform/api-gateway/config ./config
COPY domains/platform/api-gateway/proxy-request ./proxy-request
COPY domains/platform/api-gateway/authenticate-request ./authenticate-request
COPY domains/platform/api-gateway/validate-csrf-token ./validate-csrf-token
COPY domains/platform/api-gateway/rate-limit-request ./rate-limit-request
COPY domains/platform/api-gateway/sanitize-input ./sanitize-input
COPY domains/platform/api-gateway/monitor-security ./monitor-security
COPY domains/platform/api-gateway/shared ./shared
COPY domains/platform/api-gateway/api ./api
COPY domains/platform/api-gateway/index.ts ./index.ts
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
