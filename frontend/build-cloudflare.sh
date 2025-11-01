#!/bin/bash
# Script de build para Cloudflare Pages
# Este script asegura que todas las dependencias se instalen correctamente

set -e

echo "🔧 Instalando dependencias del frontend..."
npm install

echo "🏗️ Construyendo aplicación Next.js..."
npm run build:pages

echo "✅ Build completado exitosamente"
