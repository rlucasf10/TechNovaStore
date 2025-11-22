# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM service-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Copy shared packages first (needed for npm install)
COPY shared /workspace/shared

# Set working directory
WORKDIR /workspace/domains/customer/user-service

# Copy package files
COPY domains/customer/user-service/package*.json ./
COPY domains/customer/user-service/tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy jest config base from root
COPY jest.config.base.js /workspace/

# Copy source code with Screaming Architecture structure
COPY domains/customer/user-service/index.ts ./index.ts
COPY domains/customer/user-service/config ./config
COPY domains/customer/user-service/api ./api
COPY domains/customer/user-service/shared ./shared
COPY domains/customer/user-service/register-user ./register-user
COPY domains/customer/user-service/authenticate-user ./authenticate-user
COPY domains/customer/user-service/refresh-token ./refresh-token
COPY domains/customer/user-service/request-password-reset ./request-password-reset
COPY domains/customer/user-service/confirm-password-reset ./confirm-password-reset
COPY domains/customer/user-service/validate-access-token ./validate-access-token
COPY domains/customer/user-service/oauth-authentication ./oauth-authentication
COPY domains/customer/user-service/get-user-profile ./get-user-profile
COPY domains/customer/user-service/update-user-profile ./update-user-profile
COPY domains/customer/user-service/change-password ./change-password
COPY domains/customer/user-service/deactivate-account ./deactivate-account
COPY domains/customer/user-service/export-personal-data ./export-personal-data
COPY domains/customer/user-service/request-account-deletion ./request-account-deletion
COPY domains/customer/user-service/cancel-account-deletion ./cancel-account-deletion
COPY domains/customer/user-service/manage-consent ./manage-consent
COPY domains/customer/user-service/scripts ./scripts
COPY domains/customer/user-service/jest.config.js ./jest.config.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
