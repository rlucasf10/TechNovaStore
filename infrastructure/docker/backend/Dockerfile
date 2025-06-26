# Usa Node.js LTS oficial como base
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json primero (para cachear npm install)
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia todo el código de la app
COPY . .

# Expone el puerto de la app
EXPOSE 8000

# Comando de arranque: si estamos en desarrollo, usa nodemon; si no, npm start
CMD if [ "$NODE_ENV" = "development" ]; then \
      npx nodemon index.js; \
    else \
      npm start; \
    fi
