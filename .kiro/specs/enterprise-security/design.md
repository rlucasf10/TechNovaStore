# Documento de Diseño - Enterprise Security

## Introducción

Este documento describe el diseño técnico para implementar el sistema de seguridad enterprise en TechNovaStore. El diseño se basa en la arquitectura Screaming existente y extiende los servicios `user-service` y `api-gateway` con nuevas capacidades de seguridad.

## Arquitectura General

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Login Page  │  │ 2FA Setup   │  │ Passkey UI  │  │ Security Settings   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Puerto 3000)                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐ │
│  │ calculate-risk-  │  │ enrich-request/  │  │ validate-step-up/          │ │
│  │ score/           │  │                  │  │                            │ │
│  └──────────────────┘  └──────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌───────────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
│   USER-SERVICE        │  │  Redis          │  │  Message Bus (Redis Pub/Sub)│
│   (Puerto 3003)       │  │  (Sesiones)     │  │  → Logstash → Elasticsearch │
│  ┌─────────────────┐  │  └─────────────────┘  └─────────────────────────────┘
│  │ register-       │  │
│  │ passkey/        │  │
│  ├─────────────────┤  │
│  │ verify-passkey/ │  │
│  ├─────────────────┤  │
│  │ setup-totp/     │  │
│  ├─────────────────┤  │
│  │ verify-totp/    │  │
│  ├─────────────────┤  │
│  │ manage-devices/ │  │
│  ├─────────────────┤  │
│  │ sliding-window- │  │
│  │ refresh/        │  │
│  └─────────────────┘  │
└───────────────────────┘
```

## Diseño Detallado por Requisito

---

## Req 1: Sistema de Refresh Tokens con Sliding Window

### Modelo de Datos Extendido

Se extiende el modelo `RefreshToken` existente con campos para Sliding Window:

```typescript
// Extensión de RefreshToken en shared/models/RefreshToken.ts
interface RefreshTokenAttributes {
  // ... campos existentes ...
  
  // Nuevos campos para Sliding Window
  initial_expires_at: Date;      // Fecha de expiración inicial (para calcular máximo absoluto)
  absolute_expires_at: Date;     // Límite máximo absoluto (90 días desde creación)
  last_activity_at: Date;        // Última actividad del usuario
  rotation_count: number;        // Contador de rotaciones (para detección de reuso)
  family_id: string;             // ID de familia de tokens (para invalidar toda la cadena)
}
```

### Caso de Uso: sliding-window-refresh/

```typescript
// domains/customer/user-service/sliding-window-refresh/SlidingWindowRefresh.ts

interface SlidingWindowConfig {
  WINDOW_EXTENSION_DAYS: 7;      // Días a extender con cada uso
  ABSOLUTE_MAX_DAYS: 90;         // Máximo absoluto desde creación
  ACTIVITY_THRESHOLD_HOURS: 1;   // Umbral para considerar actividad
}

// Lógica principal:
// 1. Validar token actual
// 2. Verificar que no exceda absolute_expires_at
// 3. Calcular nueva expiración: min(now + 7d, absolute_expires_at)
// 4. Revocar token antiguo
// 5. Crear nuevo token con family_id heredado
// 6. Si se detecta reuso (token ya revocado), invalidar toda la familia
```

### Propiedades de Correctitud

| ID | Propiedad | Validación |
|----|-----------|------------|
| R1.1 | Token nunca excede 90 días absolutos | `new_expires_at <= absolute_expires_at` |
| R1.2 | Rotación siempre invalida token anterior | `old_token.revoked === true` después de refresh |
| R1.3 | Reuso detecta compromiso | Si token revocado se usa, toda familia se invalida |
| R1.4 | Actividad extiende sesión | `expires_at` aumenta con cada refresh exitoso |

---

## Req 2: Autenticación Multi-Factor Adaptativa y Passkeys

### Modelo de Datos: Passkey Credential

```typescript
// domains/customer/user-service/shared/models/PasskeyCredential.ts

interface PasskeyCredentialAttributes {
  id: number;
  user_id: number;
  credential_id: string;           // ID único de la credencial (base64url)
  public_key: string;              // Clave pública COSE (base64)
  counter: number;                 // Contador para prevenir replay attacks
  device_type: 'platform' | 'cross-platform';  // Tipo de autenticador
  transports: string[];            // ['internal', 'hybrid', 'usb', etc.]
  backed_up: boolean;              // Si está sincronizado en la nube
  friendly_name: string;           // Nombre dado por el usuario
  last_used_at: Date;
  created_at: Date;
}
```

### Modelo de Datos: TOTP Secret

```typescript
// domains/customer/user-service/shared/models/TotpSecret.ts

interface TotpSecretAttributes {
  id: number;
  user_id: number;
  secret: string;                  // Secreto encriptado (AES-256-GCM)
  algorithm: 'SHA1' | 'SHA256';    // SHA1 para compatibilidad con Google Authenticator
  digits: 6;
  period: 30;
  verified: boolean;               // Si el usuario verificó con código válido
  backup_codes: string[];          // Códigos de respaldo hasheados (bcrypt)
  backup_codes_used: boolean[];    // Tracking de códigos usados
  created_at: Date;
}
```

### Caso de Uso: register-passkey/

```typescript
// domains/customer/user-service/register-passkey/RegisterPasskey.ts

// Dependencias (open-source):
// - @simplewebauthn/server (MIT License)

// Flujo de registro (WebAuthn Registration Ceremony):
// 1. Generar challenge aleatorio (32 bytes)
// 2. Crear opciones de registro con:
//    - rp: { name: 'TechNovaStore', id: 'technovastore.com' }
//    - user: { id, name, displayName }
//    - authenticatorSelection: { 
//        residentKey: 'preferred',
//        userVerification: 'preferred'
//      }
// 3. Almacenar challenge en Redis (TTL: 5 min)
// 4. Retornar opciones al frontend
// 5. Recibir attestation del navegador
// 6. Verificar attestation con @simplewebauthn/server
// 7. Almacenar credencial en PasskeyCredential
```

### Caso de Uso: verify-passkey/

```typescript
// domains/customer/user-service/verify-passkey/VerifyPasskey.ts

// Flujo de autenticación (WebAuthn Authentication Ceremony):
// 1. Buscar credenciales del usuario
// 2. Generar challenge aleatorio
// 3. Crear opciones de autenticación con allowCredentials
// 4. Almacenar challenge en Redis (TTL: 5 min)
// 5. Recibir assertion del navegador
// 6. Verificar assertion:
//    - Validar signature con public_key
//    - Verificar counter > stored_counter (anti-replay)
//    - Actualizar counter en BD
// 7. Retornar resultado de autenticación
```

### Caso de Uso: setup-totp/

```typescript
// domains/customer/user-service/setup-totp/SetupTotp.ts

// Dependencias (open-source):
// - otplib (MIT License) - Generación y verificación TOTP
// - qrcode (MIT License) - Generación de QR

// Flujo:
// 1. Generar secreto aleatorio (20 bytes, base32)
// 2. Crear URI otpauth://totp/TechNovaStore:{email}?secret={secret}&issuer=TechNovaStore
// 3. Generar QR code como data URL
// 4. Almacenar secreto encriptado (NO verificado aún)
// 5. Retornar QR y secreto manual
// 6. Usuario escanea y envía código de verificación
// 7. Verificar código con otplib
// 8. Marcar como verified=true
// 9. Generar 10 backup codes (crypto.randomBytes)
// 10. Hashear backup codes con bcrypt y almacenar
```

### Lógica de MFA Adaptativo

```typescript
// domains/platform/api-gateway/calculate-risk-score/CalculateRiskScore.ts

// El Risk Score determina si se requiere MFA:
// - Score < 30: Login normal (solo password o passkey)
// - Score 30-50: Sugerir 2FA si no está habilitado
// - Score 50-70: REQUERIR 2FA (trigger automático)
// - Score > 70: Bloquear y notificar

// Integración con Req 2.10:
// Si user.mfa_preference === 'optional' && riskScore >= 50:
//   return { requireMfa: true, reason: 'high_risk_detected' }
```

### Propiedades de Correctitud

| ID | Propiedad | Validación |
|----|-----------|------------|
| R2.1 | Passkey counter siempre incrementa | `new_counter > stored_counter` |
| R2.2 | Challenge es único y expira | Challenge en Redis con TTL 5min |
| R2.3 | TOTP window permite drift | Acepta código ±1 período (30s) |
| R2.4 | Backup code single-use | `backup_codes_used[i] = true` después de uso |
| R2.5 | MFA adaptativo basado en riesgo | `requireMfa = riskScore >= 50` |

---

## Req 3: Device Fingerprinting Privacy-First

### Modelo de Datos: Device

```typescript
// domains/customer/user-service/shared/models/Device.ts

interface DeviceAttributes {
  id: number;
  user_id: number;
  fingerprint_hash: string;        // SHA-256 del fingerprint
  fingerprint_signals: {
    ja3_hash?: string;             // TLS fingerprint
    user_agent_hash: string;       // Hash del User-Agent
    accept_language: string;
    timezone_offset: number;
    screen_resolution?: string;    // Solo si usuario consiente
  };
  trust_score: number;             // 0-100, decae con el tiempo
  is_trusted: boolean;             // Marcado explícitamente por usuario
  is_revoked: boolean;
  friendly_name?: string;
  last_ip: string;
  last_location?: {
    country: string;
    city: string;
    lat: number;
    lon: number;
  };
  last_seen_at: Date;
  created_at: Date;
}
```

### Caso de Uso: generate-device-fingerprint/

```typescript
// domains/platform/api-gateway/generate-device-fingerprint/GenerateDeviceFingerprint.ts

// Señales Privacy-First (NO intrusivas):
// 1. TLS/JA3 Fingerprint (del handshake TLS, no requiere JS)
// 2. User-Agent (header HTTP estándar)
// 3. Accept-Language (header HTTP estándar)
// 4. Timezone offset (del header o cookie)
// 5. IP Address (para geolocalización)

// Señales OPCIONALES (solo con consentimiento):
// 6. Screen resolution
// 7. Platform/OS

// NO usar (invasivo para GDPR):
// ❌ Canvas fingerprinting
// ❌ WebGL fingerprinting
// ❌ Font enumeration
// ❌ Audio fingerprinting

// Generación del hash:
const fingerprint = {
  ja3: extractJA3FromTLS(req),
  ua: crypto.createHash('sha256').update(req.headers['user-agent']).digest('hex'),
  lang: req.headers['accept-language'],
  tz: req.cookies['tz_offset'] || 0
};
const fingerprintHash = crypto.createHash('sha256')
  .update(JSON.stringify(fingerprint))
  .digest('hex');
```

### Caso de Uso: manage-devices/

```typescript
// domains/customer/user-service/manage-devices/ManageDevices.ts

// Operaciones:
// - listDevices(userId): Lista todos los dispositivos con última actividad
// - trustDevice(userId, deviceId): Marca como confiable
// - revokeDevice(userId, deviceId): Revoca y invalida tokens asociados
// - renameDevice(userId, deviceId, name): Asigna nombre amigable

// Al revocar dispositivo:
// 1. Marcar device.is_revoked = true
// 2. Invalidar todos los RefreshToken con device_fingerprint matching
// 3. Emitir evento de auditoría
// 4. Enviar notificación al usuario
```

### Propiedades de Correctitud

| ID | Propiedad | Validación |
|----|-----------|------------|
| R3.1 | Fingerprint es probabilístico | Usado como señal de riesgo, no identificador único |
| R3.2 | Dispositivo revocado invalida tokens | Todos los tokens del dispositivo se revocan |
| R3.3 | Trust score decae | `trust_score -= decay_rate * days_since_last_seen` |

---

## Req 4: Risk Score Engine

### Arquitectura del Motor de Riesgo

```typescript
// domains/platform/api-gateway/calculate-risk-score/CalculateRiskScore.ts

interface RiskFactors {
  unknownDevice: boolean;          // +25 puntos
  newGeolocation: boolean;         // +20 puntos
  impossibleTravel: boolean;       // +40 puntos
  unusualTime: boolean;            // +15 puntos
  suspiciousIp: boolean;           // +20 puntos
  recentFailedAttempts: number;    // +10 por intento (max +30)
}

interface RiskScoreResult {
  score: number;                   // 0-100
  factors: RiskFactors;
  recommendation: 'allow' | 'mfa_required' | 'block';
  details: string[];
}
```

### Algoritmos de Cálculo

```typescript
// 1. Detección de Impossible Travel (Haversine)
function detectImpossibleTravel(
  lastLogin: { lat: number, lon: number, timestamp: Date },
  currentLogin: { lat: number, lon: number, timestamp: Date }
): boolean {
  const distanceKm = haversineDistance(lastLogin, currentLogin);
  const timeHours = (currentLogin.timestamp - lastLogin.timestamp) / (1000 * 60 * 60);
  const speedKmH = distanceKm / timeHours;
  
  // Velocidad máxima razonable: 900 km/h (avión comercial)
  return speedKmH > 900;
}

// 2. Detección de Tiempo Inusual (Z-Score)
function detectUnusualTime(
  currentHour: number,
  userLoginHistory: number[]  // Horas de logins anteriores
): boolean {
  const mean = userLoginHistory.reduce((a, b) => a + b, 0) / userLoginHistory.length;
  const stdDev = Math.sqrt(
    userLoginHistory.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / userLoginHistory.length
  );
  const zScore = Math.abs((currentHour - mean) / stdDev);
  
  // Z-score > 2 significa fuera de 95% de la distribución normal
  return zScore > 2;
}

// 3. Device Trust Score (Exponential Decay)
function calculateDeviceTrust(device: Device): number {
  const daysSinceLastSeen = (Date.now() - device.last_seen_at) / (1000 * 60 * 60 * 24);
  const decayRate = 0.05;  // 5% por día
  const baseTrust = device.is_trusted ? 100 : 50;
  
  return Math.max(0, baseTrust * Math.exp(-decayRate * daysSinceLastSeen));
}
```

### Integración con IP Reputation

```typescript
// Usar listas públicas open-source:
// - Firehol IP lists (https://iplists.firehol.org/) - Gratis
// - AbuseIPDB (API gratuita con límites)

// Almacenar en Redis como Set para lookup O(1):
// SADD suspicious_ips "1.2.3.4" "5.6.7.8" ...
// SISMEMBER suspicious_ips {ip}
```

### Propiedades de Correctitud

| ID | Propiedad | Validación |
|----|-----------|------------|
| R4.1 | Score siempre en rango [0, 100] | `Math.min(100, Math.max(0, score))` |
| R4.2 | Cálculo < 50ms | Benchmark en tests, usar Redis para lookups |
| R4.3 | Impossible travel detecta velocidad > 900 km/h | Test con coordenadas conocidas |
| R4.4 | Z-score > 2 marca tiempo inusual | Test con distribución conocida |

---

## Req 5: Audit Logs Asíncronos

### Arquitectura de Logging

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐
│ Microservice│────▶│ Redis       │────▶│ Logstash    │────▶│ Elasticsearch │
│             │     │ Pub/Sub     │     │ (Consumer)  │     │               │
└─────────────┘     └─────────────┘     └─────────────┘     └───────────────┘
      │                                                              │
      │ (NO bloquea)                                                 │
      ▼                                                              ▼
   Response                                                     ┌─────────┐
   al usuario                                                   │ Kibana  │
                                                                └─────────┘
```

### Caso de Uso: emit-audit-log/

```typescript
// domains/platform/api-gateway/emit-audit-log/EmitAuditLog.ts

interface AuditLogEvent {
  timestamp: string;               // ISO 8601
  event_id: string;                // UUID v4
  event_type: 'auth' | 'security' | 'data_access' | 'admin_action';
  action: string;                  // 'login', 'logout', 'mfa_verify', etc.
  result: 'success' | 'failure' | 'blocked';
  user_id?: number;
  session_id?: string;
  ip_address: string;
  device_fingerprint?: string;
  geolocation?: {
    country: string;
    city: string;
  };
  risk_score?: number;
  metadata?: Record<string, any>;  // Datos adicionales específicos del evento
}

// Emisión asíncrona (fire-and-forget):
async function emitAuditLog(event: AuditLogEvent): Promise<void> {
  // NO await - no bloquear el request
  redisClient.publish('audit_logs', JSON.stringify(event))
    .catch(err => logger.error('Failed to emit audit log', err));
}
```

### Configuración de Logstash

```ruby
# infrastructure/logstash/pipeline/audit-logs.conf

input {
  redis {
    host => "redis"
    port => 6379
    data_type => "channel"
    channels => ["audit_logs"]
    codec => json
  }
}

filter {
  # Enriquecer con GeoIP
  if [ip_address] {
    geoip {
      source => "ip_address"
      target => "geo"
    }
  }
  
  # Parsear timestamp
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "audit-logs-%{+YYYY.MM.dd}"
  }
}
```

### Propiedades de Correctitud

| ID | Propiedad | Validación |
|----|-----------|------------|
| R5.1 | Logging nunca bloquea request | `emitAuditLog` no usa await en el flujo principal |
| R5.2 | Todos los eventos tienen timestamp | Campo requerido en schema |
| R5.3 | Logs indexados por fecha | Index pattern `audit-logs-YYYY.MM.dd` |

---

## Req 6: Step-up Authentication Risk-Based

### Caso de Uso: validate-step-up/

```typescript
// domains/platform/api-gateway/validate-step-up/ValidateStepUp.ts

interface StepUpContext {
  action: 'change_password' | 'change_email' | 'disable_2fa' | 
          'high_value_purchase' | 'export_data' | 'delete_account';
  userId: number;
  sessionId: string;
  riskScore: number;
  metadata?: {
    purchaseAmount?: number;
    newCardUsed?: boolean;
    countryChanged?: boolean;
    vpnDetected?: boolean;
  };
}

interface StepUpRequirement {
  required: boolean;
  methods: ('password' | 'totp' | 'passkey')[];
  reason?: string;
  gracePeriod?: number;  // Para delete_account
}

function determineStepUpRequirement(ctx: StepUpContext): StepUpRequirement {
  switch (ctx.action) {
    case 'change_password':
    case 'change_email':
    case 'export_data':
      return { required: true, methods: ['password'] };
    
    case 'disable_2fa':
      return { required: true, methods: ['password', 'totp'] };
    
    case 'high_value_purchase':
      // Solo si hay anomalía de riesgo
      const hasAnomaly = ctx.metadata?.newCardUsed || 
                         ctx.metadata?.countryChanged || 
                         ctx.metadata?.vpnDetected ||
                         ctx.riskScore > 50;
      return { 
        required: hasAnomaly, 
        methods: hasAnomaly ? ['password'] : [],
        reason: hasAnomaly ? 'risk_anomaly_detected' : undefined
      };
    
    case 'delete_account':
      return { 
        required: true, 
        methods: ['password', 'totp'],
        gracePeriod: 72 * 60 * 60 * 1000  // 72 horas en ms
      };
  }
}
```

### Caso de Uso: schedule-account-deletion/

```typescript
// domains/customer/user-service/schedule-account-deletion/ScheduleAccountDeletion.ts

interface AccountDeletionRequest {
  id: number;
  user_id: number;
  requested_at: Date;
  scheduled_deletion_at: Date;    // requested_at + 72h
  cancelled: boolean;
  cancelled_at?: Date;
  executed: boolean;
  executed_at?: Date;
}

// Flujo:
// 1. Usuario solicita borrado (después de step-up auth)
// 2. Crear AccountDeletionRequest con scheduled_deletion_at = now + 72h
// 3. Enviar email de confirmación con link para cancelar
// 4. Job programado verifica cada hora:
//    - Si cancelled = false && now >= scheduled_deletion_at:
//      - Ejecutar borrado permanente
//      - Marcar executed = true
//      - Enviar email de confirmación de borrado
```

### Propiedades de Correctitud

| ID | Propiedad | Validación |
|----|-----------|------------|
| R6.1 | Compras >500€ solo requieren step-up si hay anomalía | Test con diferentes combinaciones de riesgo |
| R6.2 | Grace period de 72h para borrado | `scheduled_deletion_at - requested_at === 72h` |
| R6.3 | Usuario puede cancelar durante grace period | Endpoint `/cancel-deletion` activo hasta ejecución |

---

## Estructura de Carpetas Final

### user-service (extendido)

```
domains/customer/user-service/
├── register-passkey/
│   ├── RegisterPasskey.ts
│   └── RegisterPasskey.test.ts
├── verify-passkey/
│   ├── VerifyPasskey.ts
│   └── VerifyPasskey.test.ts
├── setup-totp/
│   ├── SetupTotp.ts
│   └── SetupTotp.test.ts
├── verify-totp/
│   ├── VerifyTotp.ts
│   └── VerifyTotp.test.ts
├── manage-devices/
│   ├── ManageDevices.ts
│   └── ManageDevices.test.ts
├── sliding-window-refresh/
│   ├── SlidingWindowRefresh.ts
│   └── SlidingWindowRefresh.test.ts
├── schedule-account-deletion/
│   ├── ScheduleAccountDeletion.ts
│   └── ScheduleAccountDeletion.test.ts
├── shared/
│   ├── models/
│   │   ├── User.ts                    # Existente
│   │   ├── RefreshToken.ts            # Extendido con sliding window
│   │   ├── PasskeyCredential.ts       # NUEVO
│   │   ├── TotpSecret.ts              # NUEVO
│   │   ├── Device.ts                  # NUEVO
│   │   └── AccountDeletionRequest.ts  # NUEVO
│   └── ...
└── ...
```

### api-gateway (extendido)

```
domains/platform/api-gateway/
├── calculate-risk-score/
│   ├── CalculateRiskScore.ts
│   └── CalculateRiskScore.test.ts
├── generate-device-fingerprint/
│   ├── GenerateDeviceFingerprint.ts
│   └── GenerateDeviceFingerprint.test.ts
├── enrich-request/
│   ├── EnrichRequest.ts
│   └── EnrichRequest.test.ts
├── validate-step-up/
│   ├── ValidateStepUp.ts
│   └── ValidateStepUp.test.ts
├── emit-audit-log/
│   ├── EmitAuditLog.ts
│   └── EmitAuditLog.test.ts
├── detect-impossible-travel/
│   ├── DetectImpossibleTravel.ts
│   └── DetectImpossibleTravel.test.ts
└── ...
```

---

## Dependencias Open-Source

| Librería | Versión | Licencia | Uso |
|----------|---------|----------|-----|
| @simplewebauthn/server | ^10.0.0 | MIT | WebAuthn server-side |
| @simplewebauthn/browser | ^10.0.0 | MIT | WebAuthn client-side |
| otplib | ^12.0.0 | MIT | Generación/verificación TOTP |
| qrcode | ^1.5.0 | MIT | Generación de QR codes |
| geoip-lite | ^1.4.0 | MIT | Geolocalización por IP |
| ioredis | ^5.0.0 | MIT | Cliente Redis (ya existente) |

---

## Consideraciones de Seguridad

1. **Secretos TOTP**: Encriptados con AES-256-GCM antes de almacenar
2. **Backup codes**: Hasheados con bcrypt (cost 12)
3. **Passkey private keys**: NUNCA salen del dispositivo del usuario
4. **Challenges WebAuthn**: Almacenados en Redis con TTL de 5 minutos
5. **Risk Score**: Calculado en memoria, no persistido (solo el resultado en audit log)
6. **Device fingerprint**: Hash SHA-256, no datos raw
