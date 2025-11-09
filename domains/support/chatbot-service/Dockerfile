FROM node:20-bullseye

# Install Python and spaCy dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for python command
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install spaCy and Spanish model
RUN pip3 install spacy
RUN python -m spacy download es_core_news_sm

# Set working directory to workspace root
WORKDIR /workspace

# Copy base configuration files to workspace root
COPY tsconfig.base.json ./
COPY jest.config.base.js ./

# Set working directory to chatbot
WORKDIR /workspace/domains/support/chatbot-service

# Copy chatbot files
COPY domains/support/chatbot-service/package*.json ./
COPY domains/support/chatbot-service/tsconfig.json ./
COPY domains/support/chatbot-service/jest.config.js ./
COPY domains/support/chatbot-service/src ./src
COPY domains/support/chatbot-service/test ./test

# Install Node.js dependencies
RUN npm install

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]
