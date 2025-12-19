# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM technovastore-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Copy shared packages first (needed for npm install)
COPY shared /workspace/shared

# Install shared config dependencies first
WORKDIR /workspace/shared/infrastructure/config
COPY shared/infrastructure/config/package*.json ./
RUN npm install --legacy-peer-deps

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

# Copy source code and jest config
COPY domains/catalog/product-service/config ./config
COPY domains/catalog/product-service/shared ./shared
COPY domains/catalog/product-service/api ./api
COPY domains/catalog/product-service/list-products ./list-products
COPY domains/catalog/product-service/get-product-by-id ./get-product-by-id
COPY domains/catalog/product-service/get-product-by-sku ./get-product-by-sku
COPY domains/catalog/product-service/create-product ./create-product
COPY domains/catalog/product-service/update-product ./update-product
COPY domains/catalog/product-service/update-product-campaign ./update-product-campaign
COPY domains/catalog/product-service/clear-product-campaign ./clear-product-campaign
COPY domains/catalog/product-service/delete-product ./delete-product
COPY domains/catalog/product-service/search-products ./search-products
COPY domains/catalog/product-service/get-related-products ./get-related-products
COPY domains/catalog/product-service/get-products-batch ./get-products-batch
COPY domains/catalog/product-service/get-product-reviews ./get-product-reviews
COPY domains/catalog/product-service/create-review ./create-review
COPY domains/catalog/product-service/vote-review ./vote-review
COPY domains/catalog/product-service/index.ts ./index.ts
COPY domains/catalog/product-service/jest.config.js ./jest.config.js
COPY domains/catalog/product-service/jest.setup.ts ./jest.setup.ts

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
