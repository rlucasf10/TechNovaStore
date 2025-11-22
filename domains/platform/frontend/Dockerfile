FROM node:20-alpine

# Update npm to latest version
RUN npm install -g npm@latest

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy source code
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=180s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
