# Requirements Document

## Introduction

Este documento define los requisitos para implementar un sistema de seguridad de nivel enterprise en TechNovaStore, comparable con las prácticas de seguridad de empresas como Google, Amazon y Facebook. El sistema incluirá autenticación robusta con tokens rotativos, autenticación de dos factores (2FA), fingerprinting de dispositivos, análisis de comportamiento, y un sistema completo de audit logs utilizando el stack ELK existente (Elasticsearch, Logstash, Kibana).

## Glossary

- **Screaming Architecture**: Patrón de arquitectura donde las carpetas se nombran por casos de uso de negocio, no por capas técnicas. Usado en TODOS los microservicios excepto frontend.
- **Access Token**: Token JWT de corta duración (15 minutos) para autenticar requests
- **Refresh Token**: Token de larga duración almacenado en httpOnly cookie para renovar access tokens
- **Token Rotation**: Práctica de generar nuevos tokens en cada uso del refresh token
- **Sliding Window Expiration**: Estrategia de expiración donde el token se renueva con cada uso exitoso hasta un límite máximo absoluto (90 días)
- **2FA/MFA**: Autenticación de dos factores / Multi-factor authentication
- **Adaptive MFA**: MFA basado en riesgo que se activa automáticamente según señales de amenaza
- **TOTP**: Time-based One-Time Password (algoritmo usado por Google Authenticator)
- **Passkeys/WebAuthn**: Estándar de autenticación sin contraseña usando criptografía de clave pública
- **Platform Authenticator**: Autenticador integrado en el dispositivo (Windows Hello, Touch ID, Face ID)
- **Synced Authenticator**: Autenticador sincronizado en la nube (Google Password Manager, iCloud Keychain)
- **Device Fingerprint**: Señal probabilística de riesgo generada a partir de características del dispositivo/navegador
- **TLS/JA3 Fingerprinting**: Técnica de fingerprinting basada en la negociación TLS del cliente, menos intrusiva que Canvas
- **Behavioral Analysis**: Análisis de patrones de uso para detectar anomalías
- **Impossible Travel**: Detección de logins desde ubicaciones geográficamente imposibles en un período corto
- **Risk-Based Authentication**: Autenticación que ajusta los requisitos según el nivel de riesgo detectado
- **Audit Log**: Registro inmutable de eventos de seguridad y acciones del usuario
- **ELK Stack**: Elasticsearch + Logstash + Kibana para gestión de logs (ver carpeta infrastructure)
- **Step-up Authentication**: Re-autenticación requerida para acciones sensibles
- **Grace Period**: Período de espera (72h) que permite cancelar acciones destructivas como borrado de cuenta

## Requirements

### Requirement 1: Sistema de Refresh Tokens con Rotación (UX Mejorada)

**User Story:** As a user, I want my session to remain active securely without frequent re-logins, so that I can have a seamless experience while maintaining security.

#### Acceptance Criteria

1. WHEN a user logs in successfully THEN the System SHALL generate an access token (15 min expiry) and a refresh token with Sliding Window expiration (7 days initial, renewed on each use, max 90 days absolute)
2. WHEN the System generates tokens THEN the System SHALL store the refresh token in an httpOnly, Secure, SameSite=Strict cookie
3. WHEN the access token expires THEN the System SHALL automatically request a new access token using the refresh token
4. WHEN a refresh token is used successfully THEN the System SHALL rotate the token, invalidate the old one, issue a new one, AND extend the expiration by 7 additional days (up to 90 days max)
5. WHEN a refresh token is reused after rotation THEN the System SHALL invalidate all tokens for that user and require re-authentication
6. WHEN a user logs out THEN the System SHALL invalidate both access and refresh tokens immediately
7. WHEN the user shows activity (API calls, page navigation) THEN the System SHALL use this as a signal to renew the Refresh Token expiration, prolonging sessions for active users

### Requirement 2: Autenticación Multi-Factor Adaptativa y Passkeys (Passwordless)

**User Story:** As a user, I want to use modern passwordless authentication methods like Passkeys, so that my account is more secure and login is more convenient.

#### Acceptance Criteria

1. WHEN a user enables 2FA THEN the System SHALL offer Passkeys (WebAuthn) as the primary method, promoted as "Acceso con Huella o Cara" (Passwordless)
2. WHEN a user registers a Passkey on PC THEN the System SHALL support Synced Authenticators (Google Password Manager) allowing authentication via PIN or pattern from their synced account
3. WHEN a user registers a Passkey on a device with biometrics THEN the System SHALL support Platform Authenticators (Windows Hello, Touch ID) for maximum convenience
4. WHEN a user cannot or chooses not to use Passkeys THEN the System SHALL offer TOTP (Google Authenticator) as a fallback method with QR code setup
5. WHEN 2FA is enabled via any method THEN the System SHALL generate 10 backup codes for account recovery
6. WHEN a user with 2FA enabled logs in THEN the System SHALL detect browser capabilities and present the simplest available method (Passkey > Password + Risk-based > Password + TOTP)
7. WHEN a user enters an invalid TOTP code 5 times THEN the System SHALL temporarily lock the account for 15 minutes
8. WHEN a user uses a backup code THEN the System SHALL mark that code as used and not allow reuse
9. WHEN a user disables 2FA THEN the System SHALL require password confirmation and invalidate all backup codes and registered Passkeys
10. WHEN 2FA is set to "Optional" for the user THEN the System SHALL automatically trigger 2FA when a high-risk factor is detected (Impossible Travel, new device never seen before)
11. WHEN the System detects a high-risk login attempt THEN the System SHALL require additional verification regardless of user's 2FA preference

### Requirement 3: Device Fingerprinting y Gestión de Dispositivos (Privacy-First)

**User Story:** As a user, I want to see and manage the devices that have accessed my account, so that I can detect and revoke unauthorized access.

#### Acceptance Criteria

1. WHEN a user logs in THEN the System SHALL generate a device fingerprint using less intrusive, security-focused signals: TLS/JA3 Fingerprinting and passive HTTP headers, minimizing Canvas or font-based fingerprinting for GDPR/Privacy compliance
2. WHEN generating a device fingerprint THEN the System SHALL use it as a probabilistic risk signal, NOT as a unique deterministic identifier for the user
3. WHEN a new device is detected THEN the System SHALL send a notification email to the user
4. WHEN a user views their security settings THEN the System SHALL display a list of all devices with last access time and location
5. WHEN a user revokes a device THEN the System SHALL invalidate all tokens associated with that device
6. WHEN a login attempt occurs from a previously revoked device THEN the System SHALL require additional verification
7. WHEN the same user logs in from more than 5 different devices in 24 hours THEN the System SHALL flag the account for review

### Requirement 4: Análisis de Comportamiento, Risk Score y Detección de Anomalías

**User Story:** As a security administrator, I want the system to detect unusual login patterns and calculate a real-time risk score, so that potential account compromises can be identified early and adaptive security measures can be triggered.

#### Acceptance Criteria

1. WHEN a user logs in THEN the System SHALL record the IP address, geolocation, device fingerprint, and timestamp
2. WHEN a login occurs from a new geographic location THEN the System SHALL send an alert email to the user
3. WHEN a login occurs at an unusual time (outside user's normal pattern) THEN the System SHALL require additional verification
4. WHEN multiple failed login attempts occur from different IPs for the same account THEN the System SHALL trigger a security alert
5. WHEN a user's behavior deviates significantly from their baseline THEN the System SHALL flag the session for review
6. WHEN impossible travel is detected (login from distant locations within short time) THEN the System SHALL block the session and notify the user
7. WHEN any login attempt occurs THEN the System SHALL calculate a Risk Score (0-100) in real-time using weighted factors: device trust (known/unknown), geolocation anomaly, time pattern deviation, IP reputation, and impossible travel detection
8. WHEN the Risk Score exceeds threshold LOW (30) THEN the System SHALL log the event for monitoring
9. WHEN the Risk Score exceeds threshold MEDIUM (50) THEN the System SHALL trigger Adaptive MFA (Req 2.10) requiring additional verification
10. WHEN the Risk Score exceeds threshold HIGH (70) THEN the System SHALL block the login attempt, notify the user, and require account recovery flow
11. WHEN calculating Risk Score THEN the System SHALL use statistical algorithms (Z-score for time patterns, Haversine for impossible travel, exponential decay for device trust) that can run in <50ms to not impact login latency

#### Risk Score Calculation Model

| Factor | Weight | Calculation Method |
|--------|--------|-------------------|
| Unknown Device | +25 | Device fingerprint not in user's trusted devices |
| New Geolocation | +20 | Country/city not seen in last 90 days |
| Impossible Travel | +40 | Haversine distance / time < 500 km/h threshold |
| Unusual Time | +15 | Z-score > 2 from user's login time distribution |
| IP Reputation | +20 | Known VPN/Tor/datacenter IP from threat intelligence |
| Failed Attempts | +10 per attempt | Recent failed logins in last hour (max +30) |

### Requirement 5: Audit Logs Centralizados con ELK Stack (Alto Rendimiento)

**User Story:** As a security administrator, I want all security events logged and searchable, so that I can investigate incidents and maintain compliance.

#### Acceptance Criteria

1. WHEN any authentication event occurs THEN the System SHALL send the Audit Log asynchronously to a High-Speed Message Bus (Kafka or RabbitMQ), and Logstash/Filebeat SHALL consume from this bus
2. WHEN sending audit logs THEN the System SHALL NEVER block the user request waiting for Logstash or Elasticsearch confirmation, guaranteeing low service latency
3. WHEN Logstash receives a log from the message bus THEN the System SHALL process and forward it to Elasticsearch
4. WHEN logs are stored in Elasticsearch THEN the System SHALL index them for fast searching by user, action, timestamp, and IP
5. WHEN an administrator accesses Kibana THEN the System SHALL display security dashboards with login trends, failed attempts, and anomalies
6. WHEN a security event is logged THEN the System SHALL include: timestamp, userId, action, IP, device fingerprint, geolocation, and result
7. WHEN logs are older than 90 days THEN the System SHALL archive them to cold storage while maintaining searchability

### Requirement 6: Step-up Authentication para Acciones Sensibles (Risk-Based)

**User Story:** As a user, I want the system to verify my identity before sensitive actions, so that my account and data are protected from unauthorized changes.

#### Acceptance Criteria

1. WHEN a user attempts to change their password THEN the System SHALL require current password verification
2. WHEN a user attempts to change their email THEN the System SHALL require password verification and send confirmation to both old and new email
3. WHEN a user attempts to disable 2FA THEN the System SHALL require password and TOTP/Passkey verification
4. WHEN a user attempts to make a purchase over 500€ THEN the System SHALL require re-authentication ONLY if a risk anomaly is detected (first purchase with this card, country/address change, suspicious VPN usage), NOT unconditionally, to avoid conversion loss
5. WHEN a user attempts to export personal data THEN the System SHALL require password verification and log the action
6. WHEN a user attempts to delete their account THEN the System SHALL require password, 2FA (if enabled), and grant a "Grace Period" of 72 hours allowing the user to cancel the action if it was an error or unauthorized attack
7. WHEN the grace period for account deletion expires THEN the System SHALL proceed with permanent account deletion and notify the user via email

### Requirement 7: Dashboard de Administración de Seguridad

**User Story:** As a security administrator, I want a dashboard to monitor security events in real-time, so that I can respond quickly to threats.

#### Acceptance Criteria

1. WHEN an administrator accesses the security dashboard THEN the System SHALL display real-time login activity
2. WHEN suspicious activity is detected THEN the System SHALL highlight it in the dashboard with severity level
3. WHEN an administrator clicks on a user THEN the System SHALL display their complete security profile including devices, login history, and risk score
4. WHEN an administrator needs to take action THEN the System SHALL provide options to lock account, revoke sessions, or require password reset
5. WHEN security metrics are requested THEN the System SHALL display: failed login rate, 2FA adoption, suspicious activity count, and geographic distribution
6. WHEN an alert is triggered THEN the System SHALL send notifications via email and display in dashboard

### Requirement 8: Integración con Microservicios Existentes

**User Story:** As a developer, I want the security system integrated with existing microservices, so that all services benefit from centralized security.

#### Acceptance Criteria

1. WHEN any microservice receives a request THEN the System SHALL validate the access token through the API Gateway
2. WHEN a microservice performs a sensitive action THEN the System SHALL emit an audit event to the centralized logging system
3. WHEN the user-service authenticates a user THEN the System SHALL coordinate with the new security components
4. WHEN the API Gateway receives a request THEN the System SHALL enrich it with device fingerprint and risk score
5. WHEN a service needs to verify 2FA THEN the System SHALL call the centralized 2FA verification endpoint
6. WHEN inter-service communication occurs THEN the System SHALL use service-to-service tokens with limited scope



### Requirement 9: Validación y Despliegue Continuo

**User Story:** As a developer, I want each implementation step validated and deployed correctly, so that the system remains stable throughout development.

#### Acceptance Criteria

1. WHEN a task is completed THEN the developer SHALL rebuild the affected container without cache to verify compilation
2. WHEN a frontend feature is implemented THEN the developer SHALL verify it works in the real application pages (not just test pages)
3. WHEN a backend change is made THEN the developer SHALL verify the API responds correctly using the real endpoints
4. WHEN multiple services are modified THEN the developer SHALL verify inter-service communication still works
5. WHEN a security feature is added THEN the developer SHALL verify it does not break existing authentication flows
6. WHEN documentation is created THEN the developer SHALL only create necessary documentation without duplication

### Requirement 10: Arquitectura Screaming en Microservicios

**User Story:** As a developer, I want all new code to follow the established Screaming Architecture pattern, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. WHEN creating new functionality in a microservice THEN the developer SHALL create a folder named after the use case (e.g., `verify-totp/`, `generate-device-fingerprint/`)
2. WHEN organizing code THEN the developer SHALL NOT use technical layer folders (domain/, application/, infrastructure/)
3. WHEN creating shared utilities THEN the developer SHALL place them in the `shared/` folder at the service root
4. WHEN creating API endpoints THEN the developer SHALL place controllers and routes in the `api/` folder at the service root
5. WHEN working on the frontend THEN the developer SHALL follow the existing feature-based structure (NOT Screaming Architecture)
6. WHEN refactoring existing code THEN the developer SHALL maintain all original functionality without breaking changes
7. WHEN placing code in `shared/` THEN the developer SHALL only include general-purpose utilities (error handling, logger, HTTP clients, validators) and NOT business logic that should be coupled to a specific use case
8. WHEN business logic is needed by multiple use cases THEN the developer SHALL extract it to a dedicated use case folder (e.g., `calculate-risk-score/`) that other use cases can import, NOT place it in `shared/`

#### shared/ Folder Guidelines

| ✅ Belongs in shared/ | ❌ Does NOT belong in shared/ |
|----------------------|------------------------------|
| Logger configuration | Risk score calculation logic |
| Error classes/handlers | User authentication flow |
| HTTP/API clients | Device trust evaluation |
| Database connection utils | Token generation/validation |
| Validation helpers | Business rules/policies |
| Type definitions | Use case orchestration |

## Implementation Notes

### Complejidad de Implementación por Requisito

| Requisito | Complejidad | Justificación |
|-----------|-------------|---------------|
| Req 1: Refresh Tokens | Media | Sliding window requiere tracking de timestamps y lógica de renovación |
| Req 2: Passkeys + Adaptive MFA | **Alta** | WebAuthn es complejo, requiere manejo de credenciales públicas, ceremony flows, y coordinación con Risk Score |
| Req 3: Device Fingerprinting | Media | TLS/JA3 requiere acceso a nivel de conexión, puede necesitar proxy/middleware |
| Req 4: Risk Score | **Alta** | Algoritmos estadísticos en tiempo real, requiere baseline por usuario |
| Req 5: Audit Logs | Media | Integración con message bus existente o nuevo (Kafka/RabbitMQ) |
| Req 6: Step-up Auth | Baja | Reutiliza componentes de Req 2 y Req 4 |
| Req 7: Dashboard | Media | Visualización en tiempo real, integración con Kibana |
| Req 8: Integración | Media | Modificaciones en API Gateway y middleware |

### Dependencias Críticas entre Requisitos

```
Req 4 (Risk Score) ──────┬──────> Req 2.10 (Adaptive MFA trigger)
                         │
                         └──────> Req 6.4 (Step-up for purchases)
                         │
                         └──────> Req 8.4 (API Gateway enrichment)

Req 3 (Device Fingerprint) ────> Req 4 (Risk Score input)

Req 2 (Passkeys) ──────────────> Req 6.3 (Step-up verification)
```

### Orden de Implementación Recomendado

1. **Fase 1 - Fundamentos**: Req 1 (Tokens), Req 3 (Fingerprinting básico), Req 5 (Audit Logs)
2. **Fase 2 - Risk Engine**: Req 4 (Risk Score completo con algoritmos)
3. **Fase 3 - Autenticación Avanzada**: Req 2 (Passkeys + Adaptive MFA)
4. **Fase 4 - Integración**: Req 6 (Step-up), Req 8 (Microservicios)
5. **Fase 5 - Observabilidad**: Req 7 (Dashboard), Req 9 (Validación)

### Librerías Recomendadas para Passkeys (Req 2)

- **Backend**: `@simplewebauthn/server` (Node.js) - Maneja registration y authentication ceremonies
- **Frontend**: `@simplewebauthn/browser` - Wrapper para WebAuthn API del navegador
- **Almacenamiento**: Credenciales públicas en MongoDB con índice por `credentialId`
