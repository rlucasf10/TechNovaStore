# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Copy shared packages first (needed for npm install)
COPY shared /workspace/shared

# Set working directory
WORKDIR /workspace/domains/customer/notification-service

# Copy package files
COPY domains/customer/notification-service/package*.json ./
COPY domains/customer/notification-service/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy jest config from workspace root
COPY jest.config.base.js /workspace/

# Copy source code and tests
COPY domains/customer/notification-service/src ./src
COPY domains/customer/notification-service/test ./test
COPY domains/customer/notification-service/jest.config.js ./jest.config.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
