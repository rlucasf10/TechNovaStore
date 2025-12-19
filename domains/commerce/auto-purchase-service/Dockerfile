# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM technovastore-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Copy shared packages first (needed for npm install)
COPY shared /workspace/shared

# Set working directory
WORKDIR /workspace/domains/commerce/auto-purchase-service

# Copy package files
COPY domains/commerce/auto-purchase-service/package*.json ./
COPY domains/commerce/auto-purchase-service/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy new structure (Screaming Architecture)
COPY domains/commerce/auto-purchase-service/index.ts ./index.ts
COPY domains/commerce/auto-purchase-service/execute-purchase ./execute-purchase
COPY domains/commerce/auto-purchase-service/orchestrate-purchase ./orchestrate-purchase
COPY domains/commerce/auto-purchase-service/select-provider ./select-provider
COPY domains/commerce/auto-purchase-service/place-order ./place-order
COPY domains/commerce/auto-purchase-service/handle-confirmation ./handle-confirmation
COPY domains/commerce/auto-purchase-service/calculate-cost ./calculate-cost
COPY domains/commerce/auto-purchase-service/process-orders-batch ./process-orders-batch
COPY domains/commerce/auto-purchase-service/get-purchase-status ./get-purchase-status
COPY domains/commerce/auto-purchase-service/cancel-purchase ./cancel-purchase
COPY domains/commerce/auto-purchase-service/get-processing-stats ./get-processing-stats
COPY domains/commerce/auto-purchase-service/shared ./shared
COPY domains/commerce/auto-purchase-service/api ./api
COPY domains/commerce/auto-purchase-service/config ./config

# Copy jest config
COPY domains/commerce/auto-purchase-service/jest.config.js ./jest.config.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
