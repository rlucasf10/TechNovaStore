# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM technovastore-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Set working directory
WORKDIR /workspace/domains/commerce/campaign-manager-service

# Copy package files
COPY domains/commerce/campaign-manager-service/package*.json ./
COPY domains/commerce/campaign-manager-service/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy jest config from workspace root
COPY jest.config.base.js /workspace/

# Copy source code (Screaming Architecture - casos de uso en la raíz)
COPY domains/commerce/campaign-manager-service/create-campaign ./create-campaign
COPY domains/commerce/campaign-manager-service/update-campaign ./update-campaign
COPY domains/commerce/campaign-manager-service/delete-campaign ./delete-campaign
COPY domains/commerce/campaign-manager-service/get-campaign ./get-campaign
COPY domains/commerce/campaign-manager-service/list-campaigns ./list-campaigns
COPY domains/commerce/campaign-manager-service/get-active-campaign ./get-active-campaign
COPY domains/commerce/campaign-manager-service/apply-campaign-discounts ./apply-campaign-discounts
COPY domains/commerce/campaign-manager-service/remove-campaign-discounts ./remove-campaign-discounts
COPY domains/commerce/campaign-manager-service/calculate-discount ./calculate-discount
COPY domains/commerce/campaign-manager-service/get-campaign-analytics ./get-campaign-analytics
COPY domains/commerce/campaign-manager-service/generate-campaign-report ./generate-campaign-report
COPY domains/commerce/campaign-manager-service/check-activate-campaigns ./check-activate-campaigns
COPY domains/commerce/campaign-manager-service/check-deactivate-campaigns ./check-deactivate-campaigns
COPY domains/commerce/campaign-manager-service/health-check ./health-check
COPY domains/commerce/campaign-manager-service/metrics ./metrics
COPY domains/commerce/campaign-manager-service/shared ./shared
COPY domains/commerce/campaign-manager-service/api ./api
COPY domains/commerce/campaign-manager-service/config ./config
COPY domains/commerce/campaign-manager-service/cron ./cron
COPY domains/commerce/campaign-manager-service/index.ts ./index.ts
COPY domains/commerce/campaign-manager-service/jest.config.js ./jest.config.js

# Expose port 3011
EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3011/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
