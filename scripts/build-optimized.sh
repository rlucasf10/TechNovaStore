#!/bin/bash

# Script para construcción optimizada con imagen base compartida
echo "🚀 Iniciando construcción optimizada de servicios..."

# Construir imagen base una sola vez
echo "📦 Construyendo imagen base compartida..."
docker build -f docker/base/Dockerfile.service-base -t service-base .

if [ $? -eq 0 ]; then
    echo "✅ Imagen base construida exitosamente"
else
    echo "❌ Error construyendo imagen base"
    exit 1
fi

# Lista de servicios a construir
services=("order" "user" "product" "payment" "notification")

# Construir cada servicio usando la imagen base
for service in "${services[@]}"; do
    echo "🔨 Construyendo servicio: $service"
    docker build -f services/$service/Dockerfile -t $service-service .
    
    if [ $? -eq 0 ]; then
        echo "✅ Servicio $service construido exitosamente"
    else
        echo "❌ Error construyendo servicio $service"
        exit 1
    fi
done

echo "🎉 Todos los servicios construidos exitosamente!"
echo "💡 Tiempo de construcción reducido gracias a la imagen base compartida"