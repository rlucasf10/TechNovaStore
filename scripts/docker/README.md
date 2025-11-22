# Scripts de Gestión de Docker

Scripts para gestionar contenedores y servicios Docker del proyecto TechNovaStore.

---

## Scripts Disponibles

### `start-all-services.ps1`
Inicia todos los servicios Docker definidos en `docker-compose.optimized.yml`.

**Uso:**
```powershell
.\scripts\docker\start-all-services.ps1
```

**Servicios iniciados:**
- Todos los microservicios (13 servicios)
- Bases de datos (MongoDB, PostgreSQL, Redis)
- Stack de monitoreo (Prometheus, Grafana, Alertmanager)
- Stack ELK (Elasticsearch, Logstash, Kibana)
- Exporters de métricas

---

### `start-minimal.ps1`
Inicia solo los servicios esenciales para desarrollo.

**Uso:**
```powershell
.\scripts\docker\start-minimal.ps1
```

**Servicios iniciados:**
- MongoDB
- PostgreSQL
- Redis
- Frontend
- API Gateway
- Servicios core seleccionados

**Ventaja:** Menor consumo de RAM (~3-4 GB vs 6-8 GB)

---

### `stop-all.ps1`
Detiene todos los contenedores Docker del proyecto.

**Uso:**
```powershell
.\scripts\docker\stop-all.ps1
```

**Opciones:**
- Detiene contenedores sin eliminarlos
- Preserva volúmenes y datos

---

### `restart-services.ps1`
Reinicia servicios Docker específicos o todos.

**Uso:**
```powershell
# Reiniciar todos los servicios
.\scripts\docker\restart-services.ps1

# Reiniciar servicio específico
.\scripts\docker\restart-services.ps1 -Service "frontend"
```

---

## Comandos Docker Útiles

### Ver estado de contenedores
```powershell
docker ps
docker-compose -f docker-compose.optimized.yml ps
```

### Ver logs de un servicio
```powershell
docker-compose -f docker-compose.optimized.yml logs -f <servicio>
```

### Reconstruir un servicio
```powershell
docker-compose -f docker-compose.optimized.yml up -d --build <servicio>
```

### Ver uso de recursos
```powershell
docker stats
```

---

## Notas Importantes

### Gestión de RAM
- **8GB RAM:** Usar `start-minimal.ps1` para desarrollo
- **16GB+ RAM:** Usar `start-all-services.ps1` sin problemas

### Servicios Críticos
Los siguientes servicios son esenciales para el funcionamiento básico:
- MongoDB (base de datos principal)
- PostgreSQL (base de datos relacional)
- Redis (cache y mensajería)
- Frontend (interfaz de usuario)
- API Gateway (punto de entrada)

### Troubleshooting

**Problema:** Contenedores no inician
```powershell
# Limpiar contenedores y volúmenes
docker-compose -f docker-compose.optimized.yml down -v
docker system prune -f

# Reiniciar Docker Desktop
```

**Problema:** Puerto ocupado
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :<puerto>

# Detener proceso
taskkill /PID <pid> /F
```

---

## Archivos Relacionados

- `docker-compose.optimized.yml` - Configuración principal de Docker Compose
- `docker-compose.prod.yml` - Configuración para producción
- `docker-compose.dev.yml` - Configuración para desarrollo
- `.env.docker` - Variables de entorno para Docker

---

*Scripts organizados como parte de Phase 5: Limpieza Final y Documentación*
