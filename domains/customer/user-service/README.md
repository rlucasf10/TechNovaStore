# User Service

Servicio de gestión de usuarios y autenticación para TechNovaStore.

## Arquitectura: Screaming Architecture

Este servicio sigue el patrón Screaming Architecture, donde la estructura del proyecto refleja los casos de uso del negocio.

## Estructura

```
user-service/
├── register-user/            # Registro de usuarios
│   ├── RegisterUser.ts
│   └── RegisterUser.test.ts
├── authenticate-user/        # Autenticación
│   ├── AuthenticateUser.ts
│   └── AuthenticateUser.test.ts
├── oauth-authentication/     # Autenticación OAuth
│   ├── OAuthAuthentication.ts
│   └── OAuthAuthentication.test.ts
├── refresh-token/            # Renovación de tokens
│   ├── RefreshToken.ts
│   └── RefreshToken.test.ts
├── validate-access-token/    # Validación de tokens
│   ├── ValidateAccessToken.ts
│   └── ValidateAccessToken.test.ts
├── get-user-profile/         # Obtener perfil
│   ├── GetUserProfile.ts
│   └── GetUserProfile.test.ts
├── update-user-profile/      # Actualizar perfil
│   ├── UpdateUserProfile.ts
│   └── UpdateUserProfile.test.ts
├── change-password/          # Cambiar contraseña
│   ├── ChangePassword.ts
│   └── ChangePassword.test.ts
├── request-password-reset/   # Solicitar reset de contraseña
│   ├── RequestPasswordReset.ts
│   └── RequestPasswordReset.test.ts
├── confirm-password-reset/   # Confirmar reset de contraseña
│   ├── ConfirmPasswordReset.ts
│   └── ConfirmPasswordReset.test.ts
├── deactivate-account/       # Desactivar cuenta
│   ├── DeactivateAccount.ts
│   └── DeactivateAccount.test.ts
├── request-account-deletion/ # Solicitar eliminación
│   ├── RequestAccountDeletion.ts
│   └── RequestAccountDeletion.test.ts
├── cancel-account-deletion/  # Cancelar eliminación
│   ├── CancelAccountDeletion.ts
│   └── CancelAccountDeletion.test.ts
├── export-personal-data/     # Exportar datos personales
│   ├── ExportPersonalData.ts
│   └── ExportPersonalData.test.ts
├── manage-consent/           # Gestionar consentimientos
│   ├── ManageConsent.ts
│   └── ManageConsent.test.ts
├── shared/                   # Infraestructura compartida
│   ├── models/               # Modelos de datos
│   │   └── User.ts
│   ├── repositories/         # Repositorios
│   │   └── UserRepository.ts
│   ├── validators/           # Validadores
│   │   └── UserValidator.ts
│   ├── middleware/           # Middleware
│   │   └── authMiddleware.ts
│   └── utils/                # Utilidades
│       ├── logger.ts
│       ├── passwordUtils.ts
│       └── tokenUtils.ts
├── api/                      # Capa de presentación HTTP
│   ├── UserController.ts
│   └── routes.ts
├── config/                   # Configuración
│   └── index.ts
└── index.ts                  # Entry point
```

## Características Principales

### 1. Autenticación
- Registro de usuarios con validación de email
- Login con email/contraseña
- Autenticación OAuth (Google, GitHub)
- JWT tokens (access + refresh)
- Sesiones seguras

### 2. Gestión de Contraseñas
- Hash seguro con bcrypt
- Reset de contraseña por email
- Cambio de contraseña con validación
- Políticas de contraseñas fuertes

### 3. Gestión de Perfil
- Actualización de información personal
- Gestión de direcciones de envío
- Preferencias de usuario
- Historial de actividad

### 4. Privacidad y GDPR
- Exportación de datos personales
- Solicitud de eliminación de cuenta
- Gestión de consentimientos
- Desactivación temporal de cuenta

### 5. Seguridad
- Rate limiting
- Protección contra fuerza bruta
- Validación de tokens
- Auditoría de accesos

## API Endpoints

### Autenticación
- `POST /api/users/register` - Registrar nuevo usuario
- `POST /api/users/login` - Iniciar sesión
- `POST /api/users/oauth/google` - Login con Google
- `POST /api/users/oauth/github` - Login con GitHub
- `POST /api/users/refresh` - Renovar access token
- `POST /api/users/logout` - Cerrar sesión
- `POST /api/users/validate-token` - Validar token

### Perfil
- `GET /api/users/profile` - Obtener perfil del usuario
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users/:id` - Obtener usuario por ID (admin)

### Contraseñas
- `POST /api/users/password/change` - Cambiar contraseña
- `POST /api/users/password/reset-request` - Solicitar reset
- `POST /api/users/password/reset-confirm` - Confirmar reset

### Privacidad
- `POST /api/users/account/deactivate` - Desactivar cuenta
- `POST /api/users/account/delete-request` - Solicitar eliminación
- `POST /api/users/account/delete-cancel` - Cancelar eliminación
- `GET /api/users/data/export` - Exportar datos personales
- `POST /api/users/consent` - Gestionar consentimientos

## Modelo de Datos

```typescript
interface User {
  _id: ObjectId;
  email: string;                  // Email único
  password?: string;              // Hash de contraseña (opcional para OAuth)
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  
  // OAuth
  oauthProvider?: 'google' | 'github';
  oauthId?: string;
  
  // Direcciones
  addresses: Address[];
  defaultAddressId?: ObjectId;
  
  // Preferencias
  preferences: {
    language: string;
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  
  // Privacidad
  consents: {
    marketing: boolean;
    analytics: boolean;
    thirdParty: boolean;
  };
  
  // Seguridad
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  
  // Eliminación
  deletionRequestedAt?: Date;
  deletionScheduledFor?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface Address {
  _id: ObjectId;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}
```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Compilar
npm run build

# Ejecutar en producción
npm start
```

## Variables de Entorno

- `PORT` - Puerto del servicio (default: 3003)
- `NODE_ENV` - Entorno de ejecución
- `MONGODB_URL` - URL de conexión a MongoDB
- `JWT_SECRET` - Secret para JWT tokens
- `JWT_EXPIRES_IN` - Expiración de access token (default: 15m)
- `REFRESH_TOKEN_EXPIRES_IN` - Expiración de refresh token (default: 7d)
- `GOOGLE_CLIENT_ID` - Client ID de Google OAuth
- `GOOGLE_CLIENT_SECRET` - Client Secret de Google OAuth
- `GITHUB_CLIENT_ID` - Client ID de GitHub OAuth
- `GITHUB_CLIENT_SECRET` - Client Secret de GitHub OAuth
- `EMAIL_SERVICE_URL` - URL del servicio de email
- `LOG_LEVEL` - Nivel de logging

## Seguridad

### Políticas de Contraseñas
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial

### Rate Limiting
- Login: 5 intentos por 15 minutos
- Registro: 3 intentos por hora
- Reset de contraseña: 3 intentos por hora

### Protección de Cuenta
- Bloqueo temporal después de 5 intentos fallidos
- Desbloqueo automático después de 30 minutos
- Notificación por email de actividad sospechosa

## Tests

Cada caso de uso tiene tests MUY COMPLETOS (10-15 tests mínimo) que cubren:
- Casos exitosos
- Manejo de errores
- Validación de entrada
- Reglas de negocio
- Seguridad
- Casos edge

## Integración con Otros Servicios

- **API Gateway**: Validación de tokens para todas las requests
- **Notification Service**: Envío de emails de verificación y reset
- **Order Service**: Información de usuario para pedidos
- **Payment Service**: Validación de usuario para pagos

## Monitoreo

- `/health` - Health check del servicio
- Métricas de autenticación
- Auditoría de accesos
- Alertas de seguridad

## OAuth Configuration

### Google OAuth
1. Crear proyecto en Google Cloud Console
2. Habilitar Google+ API
3. Configurar OAuth consent screen
4. Crear credenciales OAuth 2.0
5. Agregar redirect URI: `http://localhost:3000/auth/google/callback`

### GitHub OAuth
1. Ir a Settings > Developer settings > OAuth Apps
2. Crear nueva OAuth App
3. Agregar callback URL: `http://localhost:3000/auth/github/callback`
4. Copiar Client ID y Client Secret

## Docker

```bash
# Construir imagen
docker build -t technovastore-user-service .

# Ejecutar contenedor
docker run -p 3003:3003 \
  -e MONGODB_URL=mongodb://host.docker.internal:27017/technovastore \
  -e JWT_SECRET=your-secret-key \
  technovastore-user-service
```

## Documentación Adicional

- [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md) - Sistema de autenticación detallado
- [SECURITY.md](./SECURITY.md) - Políticas de seguridad
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumen de implementación
