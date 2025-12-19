# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM technovastore-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Copy shared packages first (needed for npm install)
COPY shared /workspace/shared

# Install shared-config dependencies (includes secure-json-parse for winston-elasticsearch)
WORKDIR /workspace/shared/infrastructure/config
RUN npm install --legacy-peer-deps

# Set working directory
WORKDIR /workspace/domains/catalog/recommender-service

# Copy package files
COPY domains/catalog/recommender-service/package*.json ./

# Copy tsconfig
COPY domains/catalog/recommender-service/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy jest config base from root
COPY jest.config.base.js /workspace/

# Copy source code with Screaming Architecture structure
COPY domains/catalog/recommender-service/*.ts ./
COPY domains/catalog/recommender-service/get-user-recommendations ./get-user-recommendations
COPY domains/catalog/recommender-service/get-similar-products ./get-similar-products
COPY domains/catalog/recommender-service/get-session-recommendations ./get-session-recommendations
COPY domains/catalog/recommender-service/get-trending-products ./get-trending-products
COPY domains/catalog/recommender-service/record-interaction ./record-interaction
COPY domains/catalog/recommender-service/update-models ./update-models
COPY domains/catalog/recommender-service/shared ./shared
COPY domains/catalog/recommender-service/api ./api
COPY domains/catalog/recommender-service/config ./config
COPY domains/catalog/recommender-service/jest.config.js ./jest.config.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
