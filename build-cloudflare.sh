#!/bin/bash
set -e

echo "🔧 Ocultando package.json raíz temporalmente..."
mv package.json package.json.tmp

echo "🔧 Instalando dependencias del frontend..."
cd frontend
npm install

echo "🏗️ Construyendo aplicación Next.js..."
npm run build:pages

echo "🔄 Restaurando package.json raíz..."
cd ..
mv package.json.tmp package.json

echo "✅ Build completado"
