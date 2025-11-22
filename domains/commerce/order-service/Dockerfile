# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Set working directory
WORKDIR /workspace/domains/commerce/order-service

# Copy package files
COPY domains/commerce/order-service/package*.json ./
COPY domains/commerce/order-service/tsconfig.json ./

# Install dependencies (esto instalará las dependencias de shared también)
RUN npm install --legacy-peer-deps

# Copy jest config from workspace root
COPY jest.config.base.js /workspace/

# Copy source code and tests (nueva estructura Screaming Architecture)
COPY domains/commerce/order-service/create-order ./create-order
COPY domains/commerce/order-service/get-order-by-id ./get-order-by-id
COPY domains/commerce/order-service/get-order-by-number ./get-order-by-number
COPY domains/commerce/order-service/get-orders ./get-orders
COPY domains/commerce/order-service/get-user-orders ./get-user-orders
COPY domains/commerce/order-service/get-order-stats ./get-order-stats
COPY domains/commerce/order-service/update-order-status ./update-order-status
COPY domains/commerce/order-service/update-tracking-info ./update-tracking-info
COPY domains/commerce/order-service/update-provider-info ./update-provider-info
COPY domains/commerce/order-service/get-orders-for-auto-purchase ./get-orders-for-auto-purchase
COPY domains/commerce/order-service/mark-order-for-processing ./mark-order-for-processing
COPY domains/commerce/order-service/report-auto-purchase-success ./report-auto-purchase-success
COPY domains/commerce/order-service/report-auto-purchase-failure ./report-auto-purchase-failure
COPY domains/commerce/order-service/generate-automatic-invoice ./generate-automatic-invoice
COPY domains/commerce/order-service/generate-invoice-pdf ./generate-invoice-pdf
COPY domains/commerce/order-service/get-invoice-by-id ./get-invoice-by-id
COPY domains/commerce/order-service/get-invoice-by-number ./get-invoice-by-number
COPY domains/commerce/order-service/get-invoices ./get-invoices
COPY domains/commerce/order-service/update-invoice-status ./update-invoice-status
COPY domains/commerce/order-service/cancel-invoice ./cancel-invoice
COPY domains/commerce/order-service/mark-invoice-as-paid ./mark-invoice-as-paid
COPY domains/commerce/order-service/update-payment-status ./update-payment-status
COPY domains/commerce/order-service/shared ./shared
COPY domains/commerce/order-service/api ./api
COPY domains/commerce/order-service/config ./config
COPY domains/commerce/order-service/index.ts ./index.ts
COPY domains/commerce/order-service/jest.config.js ./jest.config.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
