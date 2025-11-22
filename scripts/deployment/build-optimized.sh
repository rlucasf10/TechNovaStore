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

# Lista de servicios a construir con sus dominios
declare -A services=(
    ["product-service"]="catalog"
    ["order-service"]="commerce"
    ["user-service"]="customer"
    ["payment-service"]="commerce"
    ["notification-service"]="customer"
)

# Construir cada servicio usando la imagen base
for service in "${!services[@]}"; do
    domain="${services[$service]}"
    echo "🔨 Construyendo servicio: $service (dominio: $domain)"
    docker build -f domains/$domain/$service/Dockerfile -t $service .
    
    if [ $? -eq 0 ]; then
        echo "✅ Servicio $service construido exitosamente"
    else
        echo "❌ Error construyendo servicio $service"
        exit 1
    fi
done

echo "🎉 Todos los servicios construidos exitosamente!"
echo "💡 Tiempo de construcción reducido gracias a la imagen base compartida"