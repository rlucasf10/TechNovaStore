# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Copy shared packages first (needed for npm install)
COPY shared /workspace/shared

# Set working directory
WORKDIR /workspace/domains/catalog/product-service

# Copy package files
COPY domains/catalog/product-service/package*.json ./

# Copy tsconfig
COPY domains/catalog/product-service/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy jest config base from root
COPY jest.config.base.js /workspace/

# Copy source code, tests and jest config
COPY domains/catalog/product-service/src ./src
COPY domains/catalog/product-service/test ./test
COPY domains/catalog/product-service/jest.config.js ./jest.config.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
