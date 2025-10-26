# Multi-stage build for API Gateway with workspace support
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache curl

# Set working directory to workspace root
WORKDIR /workspace

# Copy workspace package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared packages
COPY shared/ ./shared/

# Copy api-gateway
COPY api-gateway/ ./api-gateway/

# Install workspace dependencies first
RUN npm install

# Install shared packages dependencies and build them
WORKDIR /workspace/shared/types
RUN npm install --legacy-peer-deps && npm run build

WORKDIR /workspace/shared/config
RUN npm install --legacy-peer-deps && npm run build

WORKDIR /workspace/shared/utils
RUN npm install --legacy-peer-deps && npm run build

# Now install api-gateway dependencies (will link to built shared packages)
WORKDIR /workspace/api-gateway
RUN npm install --legacy-peer-deps

# Create symlinks to shared packages BEFORE building
RUN mkdir -p node_modules/@technovastore && \
    ln -sf /workspace/shared/types node_modules/@technovastore/shared-types && \
    ln -sf /workspace/shared/config node_modules/@technovastore/shared-config && \
    ln -sf /workspace/shared/utils node_modules/@technovastore/shared-utils

# Build api-gateway
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache curl

# Set working directory to workspace root
WORKDIR /workspace

# Copy package.json files
COPY --from=base /workspace/package*.json ./

# Copy the entire shared packages with their dist folders and package.json
COPY --from=base /workspace/shared/types/dist ./shared/types/dist
COPY --from=base /workspace/shared/types/package*.json ./shared/types/
COPY --from=base /workspace/shared/config/dist ./shared/config/dist
COPY --from=base /workspace/shared/config/package*.json ./shared/config/
COPY --from=base /workspace/shared/utils/dist ./shared/utils/dist
COPY --from=base /workspace/shared/utils/package*.json ./shared/utils/

# Copy api-gateway built code and package.json
COPY --from=base /workspace/api-gateway/dist/ ./api-gateway/dist/
COPY --from=base /workspace/api-gateway/package*.json ./api-gateway/

# Install shared packages dependencies in production
WORKDIR /workspace/shared/types
RUN npm install --production --legacy-peer-deps

WORKDIR /workspace/shared/config
RUN npm install --production --legacy-peer-deps

WORKDIR /workspace/shared/utils
RUN npm install --production --legacy-peer-deps

# Install api-gateway production dependencies
WORKDIR /workspace/api-gateway
RUN npm install --production --legacy-peer-deps

# Create symlinks to shared packages
RUN mkdir -p node_modules/@technovastore && \
    ln -sf /workspace/shared/types node_modules/@technovastore/shared-types && \
    ln -sf /workspace/shared/config node_modules/@technovastore/shared-config && \
    ln -sf /workspace/shared/utils node_modules/@technovastore/shared-utils

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run from api-gateway directory
CMD ["node", "dist/index.js"]
