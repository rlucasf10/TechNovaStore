#!/bin/bash
set -e

echo "🔧 Renombrando package.json raíz para evitar conflicto de workspaces..."
mv package.json package.json.bak || true

echo "🔧 Instalando dependencias del frontend..."
cd frontend
npm install

echo "🏗️ Construyendo aplicación Next.js..."
npm run build:pages

echo "✅ Build completado"
