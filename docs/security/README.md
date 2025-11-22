# Documentación de Seguridad

Esta carpeta contiene toda la documentación relacionada con la seguridad del sistema TechNovaStore.

## Contenido

### Configuración de Seguridad

- **[SECURITY_SETUP.md](./SECURITY_SETUP.md)** - Guía completa de configuración de seguridad del sistema
- **[SECURITY_FIX_INSTRUCTIONS.md](./SECURITY_FIX_INSTRUCTIONS.md)** - Instrucciones para corregir problemas de seguridad
- **[TECHNOVA-ZERO-TRUST.md](./TECHNOVA-ZERO-TRUST.md)** - Arquitectura de seguridad Zero Trust implementada

### Credenciales y Secretos

- **[DONDE_ESTAN_LAS_CREDENCIALES.md](./DONDE_ESTAN_LAS_CREDENCIALES.md)** - Ubicación y gestión de credenciales del sistema

### Autenticación y OAuth

- **[OAUTH_CONFIGURACION_DOCKER.md](./OAUTH_CONFIGURACION_DOCKER.md)** - Configuración de OAuth en entorno Docker
- **[OAUTH_IMPLEMENTATION_COMPLETE.md](./OAUTH_IMPLEMENTATION_COMPLETE.md)** - Implementación completa de OAuth
- **[TROUBLESHOOTING-AUTH.md](./TROUBLESHOOTING-AUTH.md)** - Solución de problemas de autenticación

## Principios de Seguridad

### Zero Trust Architecture

TechNovaStore implementa una arquitectura de seguridad Zero Trust:

1. **Verificación Continua**: Nunca confiar, siempre verificar
2. **Mínimo Privilegio**: Acceso mínimo necesario para cada servicio
3. **Segmentación**: Aislamiento de servicios y datos
4. **Monitoreo Constante**: Detección de anomalías en tiempo real

### Mejores Prácticas

- **Secretos**: Nunca almacenar secretos en código o repositorio
- **Variables de Entorno**: Usar archivos .env para configuración sensible
- **Tokens**: Rotación regular de tokens y claves
- **HTTPS**: Comunicación encriptada en producción
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Validación de Entrada**: Sanitización de todas las entradas de usuario

## Servicios de Seguridad

### API Gateway

El API Gateway implementa:
- Autenticación de requests
- Rate limiting
- Validación de tokens CSRF
- Sanitización de inputs
- Monitoreo de seguridad

### User Service

El User Service maneja:
- Autenticación de usuarios
- Gestión de tokens (access y refresh)
- OAuth 2.0 (Google, GitHub)
- Validación de contraseñas
- Gestión de sesiones

## Ver También

- [Documentación de Arquitectura](../architecture/) - Arquitectura del sistema
- [Documentación de Deployment](../deployment/) - Despliegue seguro
- [Documentación de Monitoreo](../monitoring/) - Monitoreo de seguridad
