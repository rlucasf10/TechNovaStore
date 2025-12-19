# Requirements Document - Backend HttpOnly Cookies

## Introduction

Este documento define los requisitos para implementar autenticación basada en httpOnly cookies en el backend de TechNovaStore. Actualmente, el backend devuelve tokens JWT en el body de la respuesta, pero NO los establece como cookies httpOnly. El frontend ya está configurado para usar httpOnly cookies, pero el backend necesita ser actualizado para enviarlas.

## Glossary

- **httpOnly cookie**: Cookie que solo puede ser accedida por el servidor, no por JavaScript del navegador
- **JWT**: JSON Web Token, token de autenticación usado para identificar usuarios
- **User Service**: Microservicio que maneja autenticación y gestión de usuarios
- **API Gateway**: Punto de entrada único que enruta peticiones a los microservicios
- **Secure flag**: Flag de cookie que indica que solo debe enviarse por HTTPS
- **SameSite**: Atributo de cookie que previene ataques CSRF
- **Cookie domain**: Dominio para el cual la cookie es válida
- **Cookie path**: Ruta para la cual la cookie es válida

## Requirements

### Requirement 1

**User Story:** Como desarrollador de backend, quiero que el sistema establezca cookies httpOnly después del login, para que el frontend pueda autenticarse sin almacenar tokens en localStorage.

#### Acceptance Criteria

1. WHEN un usuario inicia sesión exitosamente THEN el sistema SHALL establecer una cookie httpOnly llamada `auth_token` con el JWT
2. WHEN se establece la cookie auth_token THEN el sistema SHALL configurar el flag `httpOnly: true`
3. WHEN se establece la cookie auth_token THEN el sistema SHALL configurar el flag `secure: true` en producción
4. WHEN se establece la cookie auth_token THEN el sistema SHALL configurar `sameSite: 'lax'` para permitir navegación entre subdominios
5. WHEN se establece la cookie auth_token THEN el sistema SHALL configurar `maxAge` igual a la expiración del JWT (24 horas)

### Requirement 2

**User Story:** Como desarrollador de backend, quiero que el sistema lea tokens desde cookies httpOnly, para que pueda autenticar peticiones sin requerir Authorization headers.

#### Acceptance Criteria

1. WHEN se recibe una petición autenticada THEN el sistema SHALL leer el token desde la cookie `auth_token`
2. WHEN la cookie auth_token está presente THEN el sistema SHALL validar el JWT
3. WHEN la cookie auth_token NO está presente THEN el sistema SHALL verificar el header Authorization como fallback
4. WHEN el token en la cookie es válido THEN el sistema SHALL autenticar la petición
5. WHEN el token en la cookie es inválido o expirado THEN el sistema SHALL retornar 401 Unauthorized

### Requirement 3

**User Story:** Como desarrollador de backend, quiero que el sistema maneje el logout correctamente, para que las cookies se invaliden cuando el usuario cierra sesión.

#### Acceptance Criteria

1. WHEN un usuario cierra sesión THEN el sistema SHALL establecer la cookie auth_token con `maxAge: 0`
2. WHEN un usuario cierra sesión THEN el sistema SHALL establecer la cookie auth_token con valor vacío
3. WHEN se invalida la cookie THEN el sistema SHALL mantener los mismos flags (httpOnly, secure, sameSite)
4. WHEN se invalida la cookie THEN el sistema SHALL usar el mismo domain y path que al establecerla

### Requirement 4

**User Story:** Como desarrollador de backend, quiero que el sistema maneje refresh tokens con cookies httpOnly, para que los tokens puedan renovarse de forma segura.

#### Acceptance Criteria

1. WHEN un usuario solicita refresh token THEN el sistema SHALL leer el token actual desde la cookie
2. WHEN el refresh es exitoso THEN el sistema SHALL establecer una nueva cookie auth_token con el nuevo JWT
3. WHEN el refresh falla THEN el sistema SHALL invalidar la cookie auth_token
4. WHEN se establece el nuevo token THEN el sistema SHALL mantener la misma configuración de cookie

### Requirement 5

**User Story:** Como desarrollador de backend, quiero que el sistema maneje OAuth correctamente con cookies httpOnly, para que la autenticación OAuth también use cookies seguras.

#### Acceptance Criteria

1. WHEN un usuario completa OAuth exitosamente THEN el sistema SHALL establecer una cookie httpOnly con el JWT
2. WHEN se procesa el callback de OAuth THEN el sistema SHALL usar la misma configuración de cookie que el login normal
3. WHEN se vincula un método OAuth THEN el sistema SHALL mantener la cookie existente
4. WHEN se desvincula un método OAuth THEN el sistema SHALL mantener la cookie existente

### Requirement 6

**User Story:** Como desarrollador de backend, quiero que el sistema maneje CORS correctamente, para que las cookies httpOnly funcionen entre el frontend y backend.

#### Acceptance Criteria

1. WHEN se configura CORS THEN el sistema SHALL establecer `credentials: true`
2. WHEN se configura CORS THEN el sistema SHALL establecer `origin` al dominio del frontend
3. WHEN se recibe una petición preflight THEN el sistema SHALL incluir `Access-Control-Allow-Credentials: true`
4. WHEN se recibe una petición preflight THEN el sistema SHALL incluir el header `Access-Control-Allow-Origin` con el dominio correcto

### Requirement 7

**User Story:** Como desarrollador de backend, quiero que el sistema maneje diferentes entornos correctamente, para que las cookies funcionen en desarrollo, staging y producción.

#### Acceptance Criteria

1. WHEN el entorno es desarrollo THEN el sistema SHALL establecer `secure: false` para permitir HTTP
2. WHEN el entorno es producción THEN el sistema SHALL establecer `secure: true` para requerir HTTPS
3. WHEN el entorno es desarrollo THEN el sistema SHALL establecer `domain: 'localhost'`
4. WHEN el entorno es producción THEN el sistema SHALL establecer `domain` al dominio de producción
5. WHEN se configura el dominio THEN el sistema SHALL leer el valor desde variables de entorno

### Requirement 8

**User Story:** Como desarrollador de backend, quiero que el sistema sea compatible con el frontend existente, para que la migración sea transparente.

#### Acceptance Criteria

1. WHEN se recibe una petición con Authorization header THEN el sistema SHALL continuar soportándolo como fallback
2. WHEN se recibe una petición con cookie auth_token THEN el sistema SHALL priorizarla sobre el Authorization header
3. WHEN se devuelve una respuesta de login THEN el sistema SHALL incluir el token en el body para compatibilidad temporal
4. WHEN se migra completamente THEN el sistema SHALL poder remover el token del body de la respuesta

### Requirement 9

**User Story:** Como desarrollador de backend, quiero que el sistema tenga logging adecuado, para que pueda debuggear problemas con cookies.

#### Acceptance Criteria

1. WHEN se establece una cookie THEN el sistema SHALL loguear la acción (sin incluir el token)
2. WHEN se lee una cookie THEN el sistema SHALL loguear si está presente o ausente
3. WHEN falla la validación de cookie THEN el sistema SHALL loguear el motivo del fallo
4. WHEN se invalida una cookie THEN el sistema SHALL loguear la acción

### Requirement 10

**User Story:** Como desarrollador de backend, quiero que el sistema tenga tests para cookies httpOnly, para que pueda verificar que funcionan correctamente.

#### Acceptance Criteria

1. WHEN se ejecutan tests de integración THEN el sistema SHALL verificar que las cookies se establecen correctamente
2. WHEN se ejecutan tests de integración THEN el sistema SHALL verificar que las cookies se leen correctamente
3. WHEN se ejecutan tests de integración THEN el sistema SHALL verificar que las cookies se invalidan correctamente
4. WHEN se ejecutan tests de integración THEN el sistema SHALL verificar que el fallback a Authorization header funciona

### Requirement 11

**User Story:** Como desarrollador de backend, quiero eliminar todas las referencias a localStorage del código del backend, para evitar confusiones y mantener consistencia con la arquitectura de httpOnly cookies.

#### Acceptance Criteria

1. WHEN se busca en el código del backend THEN el sistema SHALL NOT contener referencias a `localStorage.setItem`
2. WHEN se busca en el código del backend THEN el sistema SHALL NOT contener referencias a `localStorage.getItem`
3. WHEN se busca en el código del backend THEN el sistema SHALL NOT contener referencias a `localStorage.removeItem`
4. WHEN se busca en el código del backend THEN el sistema SHALL NOT contener comentarios o documentación que mencionen localStorage para tokens
5. WHEN se revisa el código THEN el sistema SHALL tener comentarios explicando que se usan httpOnly cookies en lugar de localStorage
