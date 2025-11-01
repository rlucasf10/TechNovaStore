#!/bin/bash
set -e

echo "🔧 Ocultando package.json raíz temporalmente..."
mv package.json package.json.tmp

echo "🔧 Instalando dependencias del frontend (incluyendo devDependencies)..."
cd frontend
npm install --include=dev

echo "🏗️ Construyendo aplicación Next.js..."
npm run build:pages

echo "🧹 Limpiando archivos de cache grandes..."
rm -rf .next/cache

echo "🔄 Restaurando package.json raíz..."
cd ..
mv package.json.tmp package.json

echo "✅ Build completado"
