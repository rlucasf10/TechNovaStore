#!/bin/bash

# Script para inicializar Ollama y descargar el modelo Phi-3 Mini
# Este script debe ejecutarse después de que el contenedor Ollama esté en funcionamiento

echo "Esperando a que Ollama esté listo..."
sleep 10

echo "Descargando modelo Phi-3 Mini..."
ollama pull phi3:mini

echo "Modelo Phi-3 Mini descargado exitosamente"
echo "Modelos disponibles:"
ollama list
