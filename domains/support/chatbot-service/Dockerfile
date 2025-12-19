# =============================================================================
# Dockerfile del chatbot - usa imagen base con Python/spaCy pre-instalados
# 
# REQUISITO: Construir primero la imagen base (solo una vez):
#   docker build -f docker/base/Dockerfile.chatbot-base -t technovastore-chatbot-base:latest .
#
# Builds posteriores tardan ~30-60 segundos en lugar de ~3-4 minutos
# =============================================================================

FROM technovastore-chatbot-base:latest

WORKDIR /workspace

# Copiar archivos de configuración base
COPY tsconfig.base.json ./
COPY jest.config.base.js ./

# Copiar módulos compartidos (necesarios para @technovastore/shared-*)
COPY shared/domain/types ./shared/domain/types
COPY shared/infrastructure/utils ./shared/infrastructure/utils
COPY shared/infrastructure/config ./shared/infrastructure/config

# Construir módulos compartidos en orden de dependencias
WORKDIR /workspace/shared/domain/types
RUN npm install && npm run build

WORKDIR /workspace/shared/infrastructure/config
RUN npm install && npm run build

WORKDIR /workspace/shared/infrastructure/utils
RUN npm install && npm run build

# Directorio del chatbot
WORKDIR /workspace/domains/support/chatbot-service

# Copiar package*.json primero para cachear npm install
COPY domains/support/chatbot-service/package*.json ./
COPY domains/support/chatbot-service/tsconfig.json ./
COPY domains/support/chatbot-service/jest.config.js ./

# Instalar dependencias (se cachea si package.json no cambia)
RUN npm install

# Copiar código fuente
COPY domains/support/chatbot-service/index.ts ./
COPY domains/support/chatbot-service/process-message ./process-message
COPY domains/support/chatbot-service/process-with-ollama ./process-with-ollama
COPY domains/support/chatbot-service/process-with-gemini ./process-with-gemini
COPY domains/support/chatbot-service/use-simple-fallback ./use-simple-fallback
COPY domains/support/chatbot-service/retrieve-products-rag ./retrieve-products-rag
COPY domains/support/chatbot-service/generate-response ./generate-response
COPY domains/support/chatbot-service/manage-session ./manage-session
COPY domains/support/chatbot-service/escalate-to-human ./escalate-to-human
COPY domains/support/chatbot-service/shared ./shared
COPY domains/support/chatbot-service/api ./api
COPY domains/support/chatbot-service/config ./config
COPY domains/support/chatbot-service/test ./test

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "run", "dev"]
