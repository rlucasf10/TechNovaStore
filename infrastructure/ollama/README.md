# Ollama Infrastructure

Este directorio contiene la configuración de infraestructura para Ollama, el runtime local de LLM utilizado por el chatbot conversacional de TechNovaStore.

## Contenido

- `init-ollama.sh`: Script de inicialización que descarga el modelo Phi-3 Mini

## Uso

### Iniciar Ollama con Docker Compose

```bash
# Iniciar solo el servicio Ollama
docker-compose -f docker-compose.optimized.yml --profile ai up ollama -d

# Iniciar todos los servicios AI (incluye Ollama, chatbot, recommender)
docker-compose -f docker-compose.optimized.yml --profile ai up -d
```

### Descargar el modelo Phi-3 Mini

El modelo se descarga automáticamente cuando el contenedor inicia. Si necesitas descargarlo manualmente:

```bash
# Ejecutar el script de inicialización dentro del contenedor
docker exec -it technovastore-ollama /init-ollama.sh

# O descargar directamente con Ollama CLI
docker exec -it technovastore-ollama ollama pull phi3:mini
```

### Verificar que Ollama está funcionando

```bash
# Verificar el estado del servicio
docker ps | grep ollama

# Verificar modelos disponibles
docker exec -it technovastore-ollama ollama list

# Probar el API
curl http://localhost:11434/api/tags
```

### Probar el modelo

```bash
# Ejecutar una consulta de prueba
docker exec -it technovastore-ollama ollama run phi3:mini "Hola, ¿cómo estás?"
```

## Configuración

El servicio Ollama está configurado con:

- **Puerto**: 11434 (expuesto en localhost)
- **Memoria límite**: 3GB (optimizado para sistemas con 8GB RAM)
- **Volumen**: `ollama_data` (persiste modelos descargados)
- **Healthcheck**: Verifica disponibilidad cada 30 segundos
- **Profile**: `ai` (se inicia con `--profile ai` o `--profile all`)

## Requisitos

- Docker y Docker Compose instalados
- Mínimo 8GB RAM (recomendado 16GB)
- ~3GB de espacio en disco para el modelo Phi-3 Mini

## Troubleshooting

### El contenedor no inicia

```bash
# Ver logs del contenedor
docker logs technovastore-ollama

# Verificar uso de memoria
docker stats technovastore-ollama
```

### El modelo no se descarga

```bash
# Descargar manualmente
docker exec -it technovastore-ollama ollama pull phi3:mini

# Verificar espacio en disco
docker system df
```

### Error de conexión desde el chatbot

```bash
# Verificar que Ollama está en la red correcta
docker network inspect technovastore-network

# Verificar que el healthcheck pasa
docker inspect technovastore-ollama | grep -A 10 Health
```

## Recursos

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Phi-3 Model Card](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct)
- [TechNovaStore Chatbot Design](../../.kiro/specs/ollama-phi3-conversational-chatbot/design.md)
