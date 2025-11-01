#!/bin/bash
set -e

echo "🔧 Ocultando package.json raíz temporalmente..."
mv package.json package.json.tmp

echo "🔧 Instalando dependencias del frontend (incluyendo devDependencies)..."
cd frontend
npm install --include=dev

echo "🏗️ Construyendo aplicación Next.js para export estático..."
npm run build:pages

echo "🧹 Limpiando archivos innecesarios..."
rm -rf .next/cache

echo "📦 Directorio de salida: frontend/out"
ls -la out/ || echo "⚠️ Directorio out no encontrado"

echo "✅ Build completado"
