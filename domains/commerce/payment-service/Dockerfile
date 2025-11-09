# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Copy shared packages first (needed for npm install)
COPY shared /workspace/shared

# Set working directory
WORKDIR /workspace/domains/commerce/payment-service

# Copy package files
COPY domains/commerce/payment-service/package*.json ./
COPY domains/commerce/payment-service/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy jest config from workspace root
COPY jest.config.base.js /workspace/

# Copy source code and tests
COPY domains/commerce/payment-service/src ./src
COPY domains/commerce/payment-service/test ./test
COPY domains/commerce/payment-service/jest.config.js ./jest.config.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
