# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM technovastore-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Set working directory
WORKDIR /workspace/domains/support/shipment-tracker

# Copy package files
COPY domains/support/shipment-tracker/package*.json ./
COPY domains/support/shipment-tracker/tsconfig.json ./
COPY domains/support/shipment-tracker/jest.config.js ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy tests
COPY domains/support/shipment-tracker/test ./test

# Copy estructura Screaming Architecture
COPY domains/support/shipment-tracker/index.ts ./index.ts
COPY domains/support/shipment-tracker/get-tracking-info ./get-tracking-info
COPY domains/support/shipment-tracker/update-tracking-info ./update-tracking-info
COPY domains/support/shipment-tracker/update-all-active-shipments ./update-all-active-shipments
COPY domains/support/shipment-tracker/get-estimated-delivery ./get-estimated-delivery
COPY domains/support/shipment-tracker/get-shipment-status ./get-shipment-status
COPY domains/support/shipment-tracker/shared ./shared
COPY domains/support/shipment-tracker/api ./api
COPY domains/support/shipment-tracker/config ./config

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
