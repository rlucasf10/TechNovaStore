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

# Copy source code (Screaming Architecture - casos de uso en la raíz)
COPY domains/commerce/payment-service/process-payment ./process-payment
COPY domains/commerce/payment-service/process-refund ./process-refund
COPY domains/commerce/payment-service/get-payment-status ./get-payment-status
COPY domains/commerce/payment-service/verify-payment ./verify-payment
COPY domains/commerce/payment-service/shared ./shared
COPY domains/commerce/payment-service/api ./api
COPY domains/commerce/payment-service/config ./config
COPY domains/commerce/payment-service/index.ts ./index.ts
COPY domains/commerce/payment-service/jest.config.js ./jest.config.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
