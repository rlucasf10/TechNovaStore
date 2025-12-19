# Build base image first: docker build -f docker/base/Dockerfile.service-base -t service-base .
FROM technovastore-base:latest

# Remove workspace package.json to prevent npm from using workspace mode
RUN rm -f /workspace/package.json /workspace/package-lock.json

# Set working directory
WORKDIR /workspace/domains/support/ticket-service

# Copy package files
COPY domains/support/ticket-service/package*.json ./
COPY domains/support/ticket-service/tsconfig.json ./
COPY domains/support/ticket-service/jest.config.js ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy Screaming Architecture structure
COPY domains/support/ticket-service/index.ts ./index.ts
COPY domains/support/ticket-service/config ./config
COPY domains/support/ticket-service/shared ./shared
COPY domains/support/ticket-service/api ./api
COPY domains/support/ticket-service/create-ticket ./create-ticket
COPY domains/support/ticket-service/create-ticket-from-chatbot ./create-ticket-from-chatbot
COPY domains/support/ticket-service/get-ticket ./get-ticket
COPY domains/support/ticket-service/update-ticket ./update-ticket
COPY domains/support/ticket-service/add-message ./add-message
COPY domains/support/ticket-service/resolve-ticket ./resolve-ticket
COPY domains/support/ticket-service/close-ticket ./close-ticket
COPY domains/support/ticket-service/escalate-to-human ./escalate-to-human
COPY domains/support/ticket-service/get-ticket-messages ./get-ticket-messages
COPY domains/support/ticket-service/create-satisfaction-survey ./create-satisfaction-survey
COPY domains/support/ticket-service/send-satisfaction-survey ./send-satisfaction-survey
COPY domains/support/ticket-service/get-satisfaction-metrics ./get-satisfaction-metrics
COPY domains/support/ticket-service/generate-satisfaction-alerts ./generate-satisfaction-alerts
COPY domains/support/ticket-service/get-satisfaction-trends ./get-satisfaction-trends
COPY domains/support/ticket-service/analyze-feedback-sentiment ./analyze-feedback-sentiment
COPY domains/support/ticket-service/get-ticket-metrics ./get-ticket-metrics
COPY domains/support/ticket-service/get-detailed-metrics ./get-detailed-metrics
COPY domains/support/ticket-service/get-response-time-metrics ./get-response-time-metrics
COPY domains/support/ticket-service/get-tickets-approaching-sla-breach ./get-tickets-approaching-sla-breach
COPY domains/support/ticket-service/get-ticket-audit-trail ./get-ticket-audit-trail
COPY domains/support/ticket-service/get-ticket-audit-summary ./get-ticket-audit-summary
COPY domains/support/ticket-service/get-sla-benchmarks ./get-sla-benchmarks
COPY domains/support/ticket-service/update-sla-benchmark ./update-sla-benchmark
COPY domains/support/ticket-service/analyze-for-escalation ./analyze-for-escalation
COPY domains/support/ticket-service/test ./test

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
