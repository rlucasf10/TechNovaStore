# Requirements Document

## Introduction

Este documento define los requisitos para corregir vulnerabilidades de seguridad críticas identificadas en la auditoría de seguridad del frontend de TechNovaStore. El objetivo principal es eliminar el almacenamiento inseguro de tokens de autenticación en localStorage y migrar completamente a httpOnly cookies, además de implementar logging seguro para prevenir la exposición de datos sensibles.

## Glossary

- **Frontend**: La aplicación web Next.js de TechNovaStore ubicada en `domains/platform/frontend`
- **auth_token**: Token de autenticación JWT utilizado para identificar usuarios autenticados
- **localStorage**: API del navegador para almacenamiento local persistente, accesible desde JavaScript
- **httpOnly cookie**: Cookie que solo puede ser accedida por el servidor, no por JavaScript del navegador
- **XSS**: Cross-Site Scripting, ataque que permite ejecutar código JavaScript malicioso
- **secureLogger**: Utilidad de logging que sanitiza datos sensibles antes de registrarlos
- **withCredentials**: Configuración de axios que permite enviar cookies en requests cross-origin
- **Backend**: Los microservicios de TechNovaStore que ya están configurados para usar httpOnly cookies

## Requirements

### Requirement 1

**User Story:** Como desarrollador de seguridad, quiero eliminar completamente el almacenamiento de tokens en localStorage, para que los tokens de autenticación no sean accesibles a ataques XSS.

#### Acceptance Criteria

1. WHEN el sistema de autenticación recibe un token del backend THEN el Frontend SHALL NOT almacenar el token en localStorage
2. WHEN el sistema de autenticación necesita verificar si un usuario está autenticado THEN el Frontend SHALL NOT leer tokens desde localStorage
3. WHEN se cierra sesión THEN el Frontend SHALL NOT intentar eliminar tokens de localStorage
4. WHEN se inicializa la aplicación THEN el Frontend SHALL NOT buscar tokens en localStorage para restaurar sesión
5. WHEN se ejecuta una búsqueda en el código fuente THEN el sistema SHALL NOT contener referencias a `localStorage.getItem('auth_token')` o `localStorage.setItem('auth_token')`

### Requirement 2

**User Story:** Como desarrollador de seguridad, quiero que todas las peticiones HTTP confíen en httpOnly cookies, para que la autenticación sea manejada automáticamente por el navegador de forma segura.

#### Acceptance Criteria

1. WHEN se configura un cliente HTTP (axios o api) THEN el Frontend SHALL configurar `withCredentials: true` para permitir el envío automático de cookies
2. WHEN se realiza una petición HTTP autenticada THEN el Frontend SHALL NOT agregar headers `Authorization: Bearer ${token}`
3. WHEN el backend envía una httpOnly cookie con el token THEN el navegador SHALL enviar automáticamente la cookie en peticiones subsecuentes al mismo dominio
4. WHEN se verifica el estado de autenticación THEN el Frontend SHALL confiar en la respuesta del backend basada en cookies, no en tokens locales
5. WHEN se ejecuta una búsqueda en el código fuente THEN el sistema SHALL NOT contener código que agregue headers Authorization con tokens de localStorage

### Requirement 3

**User Story:** Como desarrollador de seguridad, quiero eliminar headers Authorization con tokens en todos los servicios del frontend, para que no se envíen tokens duplicados cuando ya se usan httpOnly cookies.

#### Acceptance Criteria

1. WHEN el servicio de autenticación realiza peticiones THEN el sistema SHALL NOT agregar headers Authorization con tokens
2. WHEN el servicio de wishlist realiza peticiones THEN el sistema SHALL NOT agregar headers Authorization con tokens
3. WHEN el servicio de orders realiza peticiones THEN el sistema SHALL NOT agregar headers Authorization con tokens
4. WHEN el servicio de shipment realiza peticiones THEN el sistema SHALL NOT agregar headers Authorization con tokens
5. WHEN el servicio de recommender realiza peticiones THEN el sistema SHALL NOT agregar headers Authorization con tokens
6. WHEN el servicio de campaign realiza peticiones THEN el sistema SHALL NOT agregar headers Authorization con tokens
7. WHEN el servicio de ticket realiza peticiones THEN el sistema SHALL NOT agregar headers Authorization con tokens

### Requirement 4

**User Story:** Como desarrollador de seguridad, quiero eliminar verificaciones de tokens en componentes y páginas, para que la autenticación se maneje exclusivamente a través de cookies httpOnly.

#### Acceptance Criteria

1. WHEN se renderiza la página de pedidos THEN el sistema SHALL NOT verificar tokens en localStorage para determinar autenticación
2. WHEN se renderiza el componente CookieConsent THEN el sistema SHALL NOT leer tokens de localStorage
3. WHEN se necesita verificar autenticación en cualquier componente THEN el sistema SHALL consultar el estado de autenticación del store o realizar una petición al backend
4. WHEN se ejecuta una búsqueda en componentes y páginas THEN el sistema SHALL NOT contener código que lea `localStorage.getItem('auth_token')`

### Requirement 5

**User Story:** Como desarrollador de seguridad, quiero eliminar completamente el logging de credenciales y datos sensibles, para que contraseñas, tokens y datos personales nunca aparezcan en logs del navegador o servidor.

#### Acceptance Criteria

1. WHEN el servicio de autenticación procesa un login THEN el sistema SHALL NOT loguear el objeto credentials que contiene email y password
2. WHEN el servicio de autenticación registra información THEN el sistema SHALL usar secureLogger.log en lugar de console.log
3. WHEN el servicio de autenticación registra errores THEN el sistema SHALL usar secureLogger.error en lugar de console.error
4. WHEN el servicio de orders registra información THEN el sistema SHALL usar secureLogger.log en lugar de console.log
5. WHEN el servicio de orders registra errores THEN el sistema SHALL usar secureLogger.error en lugar de console.error
6. WHEN se loguean respuestas de autenticación THEN el sistema SHALL sanitizar los datos antes de registrarlos
7. WHEN se ejecuta una búsqueda en el código fuente THEN el sistema SHALL NOT contener logs que expongan passwords, tokens, o datos de tarjetas de crédito
8. WHEN se loguea información de debugging THEN el sistema SHALL loguear solo identificadores no sensibles (email sin password, userId, requestId)

### Requirement 6

**User Story:** Como desarrollador, quiero que el store de autenticación funcione sin depender de tokens en localStorage, para que la gestión de sesión sea completamente basada en cookies httpOnly.

#### Acceptance Criteria

1. WHEN se inicializa el store de autenticación THEN el sistema SHALL NOT intentar leer tokens de localStorage
2. WHEN se actualiza el estado de autenticación THEN el sistema SHALL NOT almacenar tokens en localStorage
3. WHEN se verifica si hay una sesión activa THEN el sistema SHALL consultar al backend usando cookies httpOnly
4. WHEN se persiste el estado del usuario THEN el sistema SHALL continuar persistiendo solo datos no sensibles (id, email, nombre, rol)
5. WHEN se cierra sesión THEN el sistema SHALL limpiar el estado local sin intentar eliminar tokens de localStorage

### Requirement 7

**User Story:** Como desarrollador, quiero verificar que la autenticación funciona correctamente con httpOnly cookies, para que los usuarios puedan iniciar sesión y acceder a recursos protegidos sin problemas.

#### Acceptance Criteria

1. WHEN un usuario inicia sesión exitosamente THEN el backend SHALL enviar una httpOnly cookie con el token
2. WHEN un usuario realiza una petición a un endpoint protegido THEN el navegador SHALL enviar automáticamente la cookie httpOnly
3. WHEN un usuario cierra sesión THEN el backend SHALL invalidar la cookie httpOnly
4. WHEN se ejecutan los tests de autenticación THEN todos los tests SHALL pasar sin errores
5. WHEN se compila el código TypeScript THEN el sistema SHALL compilar sin errores de tipo

### Requirement 8

**User Story:** Como usuario final, quiero que la aplicación cargue rápidamente, para que pueda navegar sin esperas prolongadas.

#### Acceptance Criteria

1. WHEN se compila la página principal THEN el sistema SHALL completar la compilación en menos de 30 segundos
2. WHEN se compila una página de autenticación THEN el sistema SHALL completar la compilación en menos de 10 segundos
3. WHEN se analiza el bundle de Next.js THEN el sistema SHALL identificar dependencias pesadas innecesarias
4. WHEN se optimiza el código THEN el sistema SHALL usar dynamic imports para componentes pesados que no son críticos
5. WHEN se carga la página principal THEN el sistema SHALL cargar solo los componentes above-the-fold inmediatamente
6. WHEN se incrementa el timeout de axios THEN el sistema SHALL configurar timeouts apropiados para evitar errores de timeout en compilaciones lentas

### Requirement 10

**User Story:** Como desarrollador, quiero que los errores 401 esperados no se muestren en consola, para que solo se registren errores reales que requieren atención.

#### Acceptance Criteria

1. WHEN se llama a /api/auth/me sin autenticación THEN el sistema SHALL manejar el 401 silenciosamente sin loguear error en consola
2. WHEN un usuario no autenticado visita la página principal THEN el sistema SHALL NOT mostrar errores 401 en la consola del navegador
3. WHEN se maneja un error esperado (401, 404 en endpoints opcionales) THEN el sistema SHALL usar un flag 'silent' para suprimir logs
4. WHEN se produce un error inesperado THEN el sistema SHALL loguear el error normalmente para debugging
5. WHEN se carga la sección de ofertas y falla THEN el sistema SHALL manejar el error gracefully sin mostrar stack traces en consola

### Requirement 11

**User Story:** Como usuario, quiero que la sección de ofertas cargue correctamente incluso si hay problemas de red, para que pueda ver contenido aunque algunos servicios fallen.

#### Acceptance Criteria

1. WHEN la petición de productos para ofertas excede el timeout THEN el sistema SHALL mostrar un mensaje amigable o contenido alternativo
2. WHEN el servicio de productos no responde THEN el sistema SHALL implementar retry logic con backoff exponencial
3. WHEN se produce un timeout en DealsSection THEN el sistema SHALL loguear el error de forma sanitizada sin exponer detalles técnicos
4. WHEN falla la carga de ofertas THEN el sistema SHALL ocultar la sección en lugar de mostrar un error visible al usuario
5. WHEN se recupera de un error de red THEN el sistema SHALL reintentar la carga automáticamente

### Requirement 9

**User Story:** Como desarrollador de seguridad, quiero documentar el cambio de arquitectura de autenticación, para que el equipo entienda por qué se eliminaron los tokens de localStorage.

#### Acceptance Criteria

1. WHEN se completa la migración THEN el sistema SHALL actualizar la documentación de seguridad explicando el uso de httpOnly cookies
2. WHEN se revisa la auditoría de seguridad THEN el documento SHALL marcar como resueltos los problemas críticos de tokens en localStorage
3. WHEN un desarrollador nuevo revisa el código THEN el sistema SHALL tener comentarios claros explicando que la autenticación usa httpOnly cookies
4. WHEN se consulta la guía de seguridad THEN el documento SHALL incluir ejemplos de cómo NO usar localStorage para tokens
