# Lista de Tareas - Enterprise Security

## Fase 1: Fundamentos (Tokens, Fingerprinting, Audit Logs)

### Tarea 1.1: Extender modelo RefreshToken para Sliding Window
- [ ] Añadir campos `initial_expires_at`, `absolute_expires_at`, `last_activity_at`, `rotation_count`, `family_id` al modelo RefreshToken
- [ ] Crear migración de base de datos para los nuevos campos
- [ ] Actualizar índices para optimizar queries por `family_id`
- [ ] Escribir tests unitarios para validar el modelo extendido

**Archivos a modificar:**
- `domains/customer/user-service/shared/models/RefreshToken.ts`

**Criterios de aceptación:** R1.1, R1.2, R1.3

---

### Tarea 1.2: Implementar caso de uso sliding-window-refresh/
- [ ] Crear carpeta `sliding-window-refresh/` en user-service
- [ ] Implementar lógica de extensión de ventana (7 días, máx 90 días)
- [ ] Implementar detección de reuso de token (invalidar familia completa)
- [ ] Implementar señal de actividad para renovación
- [ ] Escribir tests completos (mínimo 15 tests)

**Archivos a crear:**
- `domains/customer/user-service/sliding-window-refresh/SlidingWindowRefresh.ts`
- `domains/customer/user-service/sliding-window-refresh/SlidingWindowRefresh.test.ts`

**Criterios de aceptación:** R1.1, R1.2, R1.3, R1.4

---

### Tarea 1.3: Crear modelo Device para fingerprinting
- [ ] Crear modelo `Device` con campos para fingerprint privacy-first
- [ ] Implementar campos para señales TLS/JA3 y headers HTTP
- [ ] Añadir campo `trust_score` con lógica de decay
- [ ] Crear migración de base de datos
- [ ] Escribir tests unitarios

**Archivos a crear:**
- `domains/customer/user-service/shared/models/Device.ts`

**Criterios de aceptación:** R3.1, R3.2, R3.3

---

### Tarea 1.4: Implementar caso de uso generate-device-fingerprint/
- [ ] Crear carpeta `generate-device-fingerprint/` en api-gateway
- [ ] Implementar extracción de señales privacy-first (User-Agent, Accept-Language, timezone)
- [ ] Implementar generación de hash SHA-256 del fingerprint
- [ ] NO implementar Canvas/WebGL/Font fingerprinting (GDPR)
- [ ] Escribir tests completos (mínimo 10 tests)

**Archivos a crear:**
- `domains/platform/api-gateway/generate-device-fingerprint/GenerateDeviceFingerprint.ts`
- `domains/platform/api-gateway/generate-device-fingerprint/GenerateDeviceFingerprint.test.ts`

**Criterios de aceptación:** R3.1

---

### Tarea 1.5: Implementar caso de uso manage-devices/
- [ ] Crear carpeta `manage-devices/` en user-service
- [ ] Implementar `listDevices(userId)` - listar dispositivos con última actividad
- [ ] Implementar `trustDevice(userId, deviceId)` - marcar como confiable
- [ ] Implementar `revokeDevice(userId, deviceId)` - revocar e invalidar tokens
- [ ] Implementar `renameDevice(userId, deviceId, name)` - asignar nombre
- [ ] Escribir tests completos (mínimo 12 tests)

**Archivos a crear:**
- `domains/customer/user-service/manage-devices/ManageDevices.ts`
- `domains/customer/user-service/manage-devices/ManageDevices.test.ts`

**Criterios de aceptación:** R3.2, R3.3

---

### Tarea 1.6: Implementar caso de uso emit-audit-log/
- [ ] Crear carpeta `emit-audit-log/` en api-gateway
- [ ] Implementar emisión asíncrona via Redis Pub/Sub (fire-and-forget)
- [ ] Definir schema de AuditLogEvent con todos los campos requeridos
- [ ] Asegurar que NUNCA bloquea el request del usuario
- [ ] Escribir tests completos (mínimo 10 tests)

**Archivos a crear:**
- `domains/platform/api-gateway/emit-audit-log/EmitAuditLog.ts`
- `domains/platform/api-gateway/emit-audit-log/EmitAuditLog.test.ts`

**Criterios de aceptación:** R5.1, R5.2

---

### Tarea 1.7: Configurar pipeline de Logstash para audit logs
- [ ] Crear configuración de Logstash para consumir de Redis channel `audit_logs`
- [ ] Configurar enriquecimiento GeoIP
- [ ] Configurar output a Elasticsearch con index pattern `audit-logs-YYYY.MM.dd`
- [ ] Probar pipeline end-to-end

**Archivos a crear/modificar:**
- `infrastructure/logstash/pipeline/audit-logs.conf`

**Criterios de aceptación:** R5.3

---

## Fase 2: Risk Score Engine

### Tarea 2.1: Implementar caso de uso calculate-risk-score/
- [ ] 2.1.1 Crear carpeta `calculate-risk-score/` en api-gateway
- [ ] 2.1.2 Implementar cálculo de score con factores ponderados
- [ ] 2.1.3 Implementar umbrales LOW (30), MEDIUM (50), HIGH (70)
- [ ] 2.1.4 Usar Redis para consultas de historial (NO consultar BD directamente)
- [ ] 2.1.5 Asegurar que el cálculo toma < 50ms (benchmark en tests)
- [ ] 2.1.6 Escribir tests completos (mínimo 15 tests)

**Archivos a crear:**
- `domains/platform/api-gateway/calculate-risk-score/CalculateRiskScore.ts`
- `domains/platform/api-gateway/calculate-risk-score/CalculateRiskScore.test.ts`

**Criterios de aceptación:** R4.1, R4.2, R4.7, R4.8, R4.9, R4.10, R4.11

---

### Tarea 2.2: Implementar detección de Impossible Travel
- [ ] 2.2.1 Cachear historial de riesgo en Redis
  - Tras login exitoso, almacenar `last_ip`, `last_location`, `last_seen_at` en Redis
  - Usar clave `user:risk:{userId}` con TTL de 7 días
  - Garantizar lookup O(1) para DetectImpossibleTravel y CalculateRiskScore
  - Escribir tests de integración con Redis (mínimo 5 tests)
- [ ] 2.2.2 Crear carpeta `detect-impossible-travel/` en api-gateway
- [ ] 2.2.3 Implementar fórmula Haversine para calcular distancia
- [ ] 2.2.4 Implementar detección de velocidad > 900 km/h
- [ ] 2.2.5 Integrar con calculate-risk-score (consultar Redis, no BD)
- [ ] 2.2.6 Escribir tests con coordenadas conocidas (mínimo 10 tests)

**Archivos a crear:**
- `domains/platform/api-gateway/detect-impossible-travel/DetectImpossibleTravel.ts`
- `domains/platform/api-gateway/detect-impossible-travel/DetectImpossibleTravel.test.ts`
- `domains/platform/api-gateway/shared/services/UserRiskCacheService.ts`

**Criterios de aceptación:** R4.3, R4.11 (latencia <50ms)

---

### Tarea 2.3: Implementar detección de tiempo inusual (Z-Score)
- [ ] Añadir lógica de Z-Score a calculate-risk-score
- [ ] Almacenar historial de horas de login por usuario en Redis
- [ ] Detectar Z-score > 2 como tiempo inusual
- [ ] Escribir tests con distribuciones conocidas (mínimo 8 tests)

**Archivos a modificar:**
- `domains/platform/api-gateway/calculate-risk-score/CalculateRiskScore.ts`

**Criterios de aceptación:** R4.4

---

### Tarea 2.4: Implementar Device Trust Score con decay
- [ ] Añadir lógica de exponential decay al trust score
- [ ] Configurar decay rate (5% por día)
- [ ] Integrar trust score en calculate-risk-score
- [ ] Escribir tests (mínimo 8 tests)

**Archivos a modificar:**
- `domains/platform/api-gateway/calculate-risk-score/CalculateRiskScore.ts`
- `domains/customer/user-service/shared/models/Device.ts`

**Criterios de aceptación:** R3.3

---

### Tarea 2.5: Integrar IP Reputation con listas públicas
- [ ] Configurar carga de listas Firehol en Redis Set
- [ ] Implementar lookup O(1) con SISMEMBER
- [ ] Crear job para actualizar listas periódicamente (diario)
- [ ] Integrar en calculate-risk-score
- [ ] Escribir tests (mínimo 6 tests)

**Archivos a crear:**
- `domains/platform/api-gateway/shared/services/IpReputationService.ts`

**Criterios de aceptación:** R4.2

---

## Fase 3: Autenticación Avanzada (Passkeys + MFA Adaptativo)

### Tarea 3.1: Crear modelo PasskeyCredential
- [ ] Crear modelo con campos para WebAuthn credentials
- [ ] Incluir `credential_id`, `public_key`, `counter`, `device_type`, `transports`
- [ ] Crear migración de base de datos
- [ ] Escribir tests unitarios

**Archivos a crear:**
- `domains/customer/user-service/shared/models/PasskeyCredential.ts`

**Criterios de aceptación:** R2.1

---

### Tarea 3.2: Crear modelo TotpSecret
- [ ] Crear modelo con campos para TOTP
- [ ] Incluir `secret` (encriptado), `backup_codes` (hasheados), `verified`
- [ ] Implementar encriptación AES-256-GCM para el secreto
- [ ] Crear migración de base de datos
- [ ] Escribir tests unitarios

**Archivos a crear:**
- `domains/customer/user-service/shared/models/TotpSecret.ts`

**Criterios de aceptación:** R2.3, R2.4

---

### Tarea 3.3: Implementar caso de uso register-passkey/
- [ ] Instalar dependencia `@simplewebauthn/server` (MIT)
- [ ] Crear carpeta `register-passkey/` en user-service
- [ ] Implementar generación de opciones de registro
- [ ] Implementar almacenamiento de challenge en Redis (TTL 5min)
- [ ] Implementar verificación de attestation
- [ ] Soportar Platform Authenticators (Windows Hello, Touch ID)
- [ ] Soportar Synced Authenticators (Google Password Manager)
- [ ] Escribir tests completos (mínimo 15 tests)

**Archivos a crear:**
- `domains/customer/user-service/register-passkey/RegisterPasskey.ts`
- `domains/customer/user-service/register-passkey/RegisterPasskey.test.ts`

**Criterios de aceptación:** R2.1, R2.2, R2.3

---

### Tarea 3.4: Implementar caso de uso verify-passkey/
- [ ] Crear carpeta `verify-passkey/` en user-service
- [ ] Implementar generación de opciones de autenticación
- [ ] Implementar verificación de assertion
- [ ] Implementar validación de counter (anti-replay)
- [ ] Actualizar counter en BD después de verificación exitosa
- [ ] Escribir tests completos (mínimo 12 tests)

**Archivos a crear:**
- `domains/customer/user-service/verify-passkey/VerifyPasskey.ts`
- `domains/customer/user-service/verify-passkey/VerifyPasskey.test.ts`

**Criterios de aceptación:** R2.1

---

### Tarea 3.5: Implementar caso de uso setup-totp/
- [ ] Instalar dependencias `otplib` y `qrcode` (MIT)
- [ ] Crear carpeta `setup-totp/` en user-service
- [ ] Implementar generación de secreto (20 bytes, base32)
- [ ] Implementar generación de QR code como data URL
- [ ] Implementar verificación inicial del código
- [ ] Implementar generación de 10 backup codes
- [ ] Hashear backup codes con bcrypt antes de almacenar
- [ ] Escribir tests completos (mínimo 12 tests)

**Archivos a crear:**
- `domains/customer/user-service/setup-totp/SetupTotp.ts`
- `domains/customer/user-service/setup-totp/SetupTotp.test.ts`

**Criterios de aceptación:** R2.4, R2.5

---

### Tarea 3.6: Implementar caso de uso verify-totp/
- [ ] Crear carpeta `verify-totp/` en user-service
- [ ] Implementar verificación de código TOTP con window ±1
- [ ] Implementar verificación de backup codes
- [ ] Marcar backup code como usado después de verificación
- [ ] Implementar lockout después de 5 intentos fallidos (15 min)
- [ ] Escribir tests completos (mínimo 12 tests)

**Archivos a crear:**
- `domains/customer/user-service/verify-totp/VerifyTotp.ts`
- `domains/customer/user-service/verify-totp/VerifyTotp.test.ts`

**Criterios de aceptación:** R2.3, R2.4, R2.7

---

### Tarea 3.7: Implementar MFA Adaptativo basado en Risk Score
- [ ] Modificar flujo de login para consultar Risk Score
- [ ] Si `riskScore >= 50` y `user.mfa_preference === 'optional'`, requerir MFA
- [ ] Implementar detección de capacidades del navegador para elegir método
- [ ] Priorizar: Passkey > Password + Risk-based > Password + TOTP
- [ ] Escribir tests de integración (mínimo 10 tests)

**Archivos a modificar:**
- `domains/customer/user-service/authenticate-user/AuthenticateUser.ts`
- `domains/platform/api-gateway/authenticate-request/AuthenticateRequest.ts`

**Criterios de aceptación:** R2.6, R2.10, R2.11

---

## Fase 4: Step-up Authentication e Integración

### Tarea 4.1: Implementar caso de uso validate-step-up/
- [ ] Crear carpeta `validate-step-up/` en api-gateway
- [ ] Implementar lógica de determinación de requisitos por acción
- [ ] Implementar step-up risk-based para compras >500€
- [ ] Solo requerir re-auth si hay anomalía de riesgo
- [ ] Escribir tests completos (mínimo 12 tests)

**Archivos a crear:**
- `domains/platform/api-gateway/validate-step-up/ValidateStepUp.ts`
- `domains/platform/api-gateway/validate-step-up/ValidateStepUp.test.ts`

**Criterios de aceptación:** R6.1, R6.2, R6.3, R6.4, R6.5

---

### Tarea 4.2: Crear modelo AccountDeletionRequest
- [ ] Crear modelo con campos para grace period
- [ ] Incluir `scheduled_deletion_at`, `cancelled`, `executed`
- [ ] Crear migración de base de datos
- [ ] Escribir tests unitarios

**Archivos a crear:**
- `domains/customer/user-service/shared/models/AccountDeletionRequest.ts`

**Criterios de aceptación:** R6.6

---

### Tarea 4.3: Implementar caso de uso schedule-account-deletion/
- [ ] Crear carpeta `schedule-account-deletion/` en user-service
- [ ] Implementar solicitud de borrado con grace period de 72h
- [ ] Implementar cancelación durante grace period
- [ ] Implementar job para ejecutar borrados programados
- [ ] Enviar emails de confirmación y notificación
- [ ] Escribir tests completos (mínimo 10 tests)

**Archivos a crear:**
- `domains/customer/user-service/schedule-account-deletion/ScheduleAccountDeletion.ts`
- `domains/customer/user-service/schedule-account-deletion/ScheduleAccountDeletion.test.ts`

**Criterios de aceptación:** R6.6, R6.7

---

### Tarea 4.4: Implementar caso de uso enrich-request/
- [ ] Crear carpeta `enrich-request/` en api-gateway
- [ ] Añadir device fingerprint a cada request
- [ ] Añadir risk score a cada request
- [ ] Pasar información enriquecida a microservicios downstream
- [ ] Escribir tests completos (mínimo 8 tests)

**Archivos a crear:**
- `domains/platform/api-gateway/enrich-request/EnrichRequest.ts`
- `domains/platform/api-gateway/enrich-request/EnrichRequest.test.ts`

**Criterios de aceptación:** R8.4

---

### Tarea 4.5: Integrar seguridad en API Gateway middleware
- [ ] Modificar middleware de autenticación para usar nuevos componentes
- [ ] Integrar calculate-risk-score en flujo de autenticación
- [ ] Integrar emit-audit-log en todos los eventos de seguridad
- [ ] Integrar validate-step-up para acciones sensibles
- [ ] Escribir tests de integración (mínimo 10 tests)

**Archivos a modificar:**
- `domains/platform/api-gateway/authenticate-request/AuthenticateRequest.ts`
- `domains/platform/api-gateway/api/routes.ts`

**Criterios de aceptación:** R8.1, R8.2, R8.3, R8.5

---

## Fase 5: Frontend y Dashboard

### Tarea 5.1: Implementar UI de configuración de Passkeys
- [ ] Crear página de configuración de seguridad en frontend
- [ ] Instalar `@simplewebauthn/browser` (MIT)
- [ ] Implementar flujo de registro de Passkey
- [ ] Implementar UI para listar y eliminar Passkeys
- [ ] Mostrar tipo de autenticador (Platform/Synced)
- [ ] Escribir tests de componentes

**Archivos a crear:**
- `domains/platform/frontend/src/app/(authenticated)/settings/security/page.tsx`
- `domains/platform/frontend/src/components/security/PasskeyManager.tsx`

**Criterios de aceptación:** R2.1, R2.2, R2.3

---

### Tarea 5.2: Implementar UI de configuración de TOTP
- [ ] Crear componente para setup de TOTP
- [ ] Mostrar QR code y secreto manual
- [ ] Implementar verificación de código inicial
- [ ] Mostrar backup codes (una sola vez)
- [ ] Implementar UI para deshabilitar TOTP
- [ ] Escribir tests de componentes

**Archivos a crear:**
- `domains/platform/frontend/src/components/security/TotpSetup.tsx`

**Criterios de aceptación:** R2.4, R2.5

---

### Tarea 5.3: Implementar UI de gestión de dispositivos
- [ ] Crear componente para listar dispositivos
- [ ] Mostrar última actividad y ubicación
- [ ] Implementar acciones: confiar, revocar, renombrar
- [ ] Destacar dispositivo actual
- [ ] Escribir tests de componentes

**Archivos a crear:**
- `domains/platform/frontend/src/components/security/DeviceManager.tsx`

**Criterios de aceptación:** R3.4, R3.5

---

### Tarea 5.4: Implementar flujo de login con MFA adaptativo
- [ ] Modificar página de login para soportar MFA
- [ ] Detectar capacidades del navegador (WebAuthn support)
- [ ] Mostrar opción de Passkey si disponible
- [ ] Mostrar prompt de TOTP si requerido
- [ ] Manejar flujo de MFA adaptativo (trigger por riesgo)
- [ ] Escribir tests de flujo completo

**Archivos a modificar:**
- `domains/platform/frontend/src/app/(auth)/login/page.tsx`

**Archivos a crear:**
- `domains/platform/frontend/src/components/auth/MfaChallenge.tsx`

**Criterios de aceptación:** R2.6, R2.10, R2.11

---

### Tarea 5.5: Crear dashboard de seguridad en Kibana
- [ ] Crear index pattern para `audit-logs-*`
- [ ] Crear visualizaciones: login trends, failed attempts, geographic distribution
- [ ] Crear dashboard con métricas de seguridad
- [ ] Configurar alertas para eventos de alto riesgo
- [ ] Documentar uso del dashboard

**Archivos a crear:**
- `infrastructure/kibana/dashboards/security-dashboard.ndjson`

**Criterios de aceptación:** R5.4, R5.5, R7.1, R7.2, R7.5

---

## Fase 6: Validación Final

### Tarea 6.1: Tests de integración end-to-end
- [ ] Escribir tests E2E para flujo completo de login con Passkey
- [ ] Escribir tests E2E para flujo de MFA adaptativo
- [ ] Escribir tests E2E para step-up authentication
- [ ] Escribir tests E2E para borrado de cuenta con grace period
- [ ] Verificar que audit logs llegan a Elasticsearch

**Archivos a crear:**
- `e2e-tests/security/passkey-flow.spec.ts`
- `e2e-tests/security/adaptive-mfa.spec.ts`
- `e2e-tests/security/step-up-auth.spec.ts`

**Criterios de aceptación:** R9.1, R9.2, R9.3, R9.4, R9.5

---

### Tarea 6.2: Verificación de rendimiento
- [ ] Benchmark de calculate-risk-score (debe ser < 50ms)
- [ ] Benchmark de emit-audit-log (no debe bloquear)
- [ ] Verificar que login con MFA no excede 2 segundos
- [ ] Documentar resultados de rendimiento

**Criterios de aceptación:** R4.2, R5.1

---

### Tarea 6.3: Documentación de seguridad
- [ ] Actualizar README de user-service con nuevas funcionalidades
- [ ] Actualizar README de api-gateway con nuevas funcionalidades
- [ ] Documentar configuración de variables de entorno
- [ ] Documentar proceso de rotación de claves de encriptación

**Archivos a modificar:**
- `domains/customer/user-service/README.md`
- `domains/platform/api-gateway/README.md`

**Criterios de aceptación:** R9.6
