#!/bin/bash
set -e

echo "🔧 Instalando dependencias del frontend..."
cd frontend
npm install

echo "🏗️ Construyendo aplicación Next.js..."
npm run build:pages

echo "✅ Build completado"
