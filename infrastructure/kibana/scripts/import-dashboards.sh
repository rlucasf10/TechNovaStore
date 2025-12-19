#!/bin/bash

# Script para importar dashboards de Kibana
# TechNovaStore - Campaign Manager Service

KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARDS_DIR="$SCRIPT_DIR/../dashboards"

echo "================================================"
echo "Importando Dashboards de Kibana - TechNovaStore"
echo "================================================"
echo ""
echo "Kibana URL: $KIBANA_URL"
echo "Dashboards Dir: $DASHBOARDS_DIR"
echo ""

# Función para esperar a que Kibana esté disponible
wait_for_kibana() {
    echo "Esperando a que Kibana esté disponible..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$KIBANA_URL/api/status" > /dev/null 2>&1; then
            echo "✓ Kibana está disponible"
            return 0
        fi
        echo "  Intento $attempt/$max_attempts - Kibana no disponible, esperando..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "✗ Error: Kibana no está disponible después de $max_attempts intentos"
    return 1
}

# Función para importar un dashboard
import_dashboard() {
    local file=$1
    local filename=$(basename "$file")
    
    echo "Importando: $filename"
    
    response=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
        -H "kbn-xsrf: true" \
        --form file=@"$file")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "  ✓ Importado exitosamente"
        return 0
    else
        echo "  ✗ Error al importar: $response"
        return 1
    fi
}

# Función principal
main() {
    # Esperar a que Kibana esté disponible
    if ! wait_for_kibana; then
        exit 1
    fi
    
    echo ""
    echo "Importando dashboards..."
    echo ""
    
    local success_count=0
    local error_count=0
    
    # Importar todos los archivos .ndjson
    for file in "$DASHBOARDS_DIR"/*.ndjson; do
        if [ -f "$file" ]; then
            if import_dashboard "$file"; then
                success_count=$((success_count + 1))
            else
                error_count=$((error_count + 1))
            fi
        fi
    done
    
    echo ""
    echo "================================================"
    echo "Resumen de Importación"
    echo "================================================"
    echo "Dashboards importados: $success_count"
    echo "Errores: $error_count"
    echo ""
    
    if [ $error_count -gt 0 ]; then
        echo "⚠ Algunos dashboards no se importaron correctamente"
        exit 1
    else
        echo "✓ Todos los dashboards se importaron correctamente"
        echo ""
        echo "Accede a Kibana en: $KIBANA_URL"
        echo "Dashboard de Campañas: $KIBANA_URL/app/dashboards#/view/campaign-manager-logs-dashboard"
    fi
}

# Ejecutar
main "$@"
