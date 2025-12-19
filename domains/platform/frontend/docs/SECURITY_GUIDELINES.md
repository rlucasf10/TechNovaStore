# Guías de Seguridad - Frontend TechNovaStore

Este documento establece las mejores prácticas de seguridad para el manejo de datos sensibles en el frontend.

## 📋 Tabla de Contenidos

1. [Principios Generales](#-principios-generales)
2. [Datos Sensibles](#-datos-sensibles)
3. [Almacenamiento Seguro](#-almacenamiento-seguro)
4. [Logging Seguro](#-logging-seguro)
5. [Manejo de Tarjetas de Crédito](#-manejo-de-tarjetas-de-crédito)
6. [Variables de Entorno](#-variables-de-entorno)
7. [Checklist de Seguridad](#-checklist-de-seguridad)

---

## 🔐 Principios Generales

### Regla de Oro
**NUNCA almacenar datos sensibles en localStorage o sessionStorage**

Los datos sensibles incluyen:
- Contraseñas
- Números de tarjeta completos
- CVV/CVC
- Tokens de autenticación (usar httpOnly cookies)
- Información personal identificable (PII)

### Principio de Mínimo Privilegio
Solo almacenar y transmitir la información mínima necesaria para la funcionalidad.

---

## 🚫 Datos Sensibles

### Categorías de Datos Sensibles

#### 1. Autenticación
- ❌ Contraseñas (nunca almacenar en frontend)
- ❌ Tokens de acceso (usar httpOnly cookies)
- ❌ API Keys
- ❌ Secrets

#### 2. Información Financiera
- ❌ Números de tarjeta completos
- ❌ CVV/CVC
- ✅ Últimos 4 dígitos (enmascarados: `**** **** **** 1234`)
- ✅ Marca de tarjeta (Visa, Mastercard, etc.)
- ✅ Mes/Año de expiración

#### 3. Información Personal
- ⚠️ Email (enmascarar en logs: `j***@example.com`)
- ⚠️ Teléfono (enmascarar en logs)
- ❌ Número de seguridad social
- ❌ Número de identificación fiscal

---

## 💾 Almacenamiento Seguro

### ✅ Permitido en localStorage

```typescript
// Preferencias de usuario (no sensibles)
localStorage.setItem('theme', 'dark')
localStorage.setItem('language', 'es')

// IDs de carrito (no sensibles)
localStorage.setItem('cart_items', JSON.stringify(cartItems))

// Configuración de UI
localStorage.setItem('sidebar_collapsed', 'true')
```

### ❌ NUNCA en localStorage

```typescript
// ❌ MAL - NUNCA hacer esto
localStorage.setItem('password', userPassword)
localStorage.setItem('auth_token', token) // Usar httpOnly cookies
localStorage.setItem('card_number', '4242424242424242')
localStorage.setItem('cvv', '123')
```

### ✅ Uso de httpOnly Cookies (Backend)

Los tokens de autenticación deben manejarse mediante httpOnly cookies configuradas en el backend:

```typescript
// Backend (Node.js/Express)
res.cookie('auth_token', token, {
  httpOnly: true,  // No accesible desde JavaScript
  secure: true,    // Solo HTTPS en producción
  sameSite: 'strict', // Protección CSRF
  maxAge: 3600000  // 1 hora
})
```

### ✅ Uso del Wrapper Seguro

```typescript
import { safeLocalStorageSet } from '@/shared/lib/security'

// Valida automáticamente que no contenga datos sensibles
try {
  safeLocalStorageSet('user_preferences', JSON.stringify(preferences))
} catch (error) {
  console.error('Intento de almacenar datos sensibles:', error)
}
```

---

## 📝 Logging Seguro

### ❌ Logging Inseguro

```typescript
// ❌ MAL - Expone datos sensibles en consola
console.log('User data:', {
  email: 'user@example.com',
  password: 'secret123',  // ❌ NUNCA loguear contraseñas
  cardNumber: '4242424242424242'  // ❌ NUNCA loguear tarjetas
})

// ❌ MAL - Loguear objetos completos sin sanitizar
console.log('Checkout data:', checkoutData)
```

### ✅ Logging Seguro

```typescript
import { secureLogger, sanitizeObject } from '@/shared/lib/security'

// ✅ BIEN - Usa el logger seguro que sanitiza automáticamente
secureLogger.log('User data:', userData)

// ✅ BIEN - Sanitiza manualmente antes de loguear
const sanitized = sanitizeObject(checkoutData)
console.log('Checkout data:', sanitized)

// ✅ BIEN - Log solo información no sensible
console.log('Payment method selected:', paymentMethod)
console.log('Order total:', orderTotal)
```

### Ejemplo de Sanitización

```typescript
// Antes de sanitizar
const userData = {
  email: 'user@example.com',
  password: 'secret123',
  cardNumber: '4242424242424242',
  cvv: '123'
}

// Después de sanitizar
const sanitized = sanitizeObject(userData)
// {
//   email: 'u***@example.com',
//   password: '***REDACTED***',
//   cardNumber: '**** **** **** 4242',
//   cvv: '***'
// }
```

---

## 💳 Manejo de Tarjetas de Crédito

### Principios PCI DSS

1. **NUNCA almacenar CVV/CVC** (ni siquiera enmascarado)
2. **NUNCA almacenar números de tarjeta completos**
3. **Usar tokenización** (Stripe, PayPal) para procesar pagos
4. **Enmascarar** números de tarjeta en UI (mostrar solo últimos 4 dígitos)

### ✅ Implementación Correcta

```typescript
import { maskCardNumber, maskCVV } from '@/shared/lib/security'

// ✅ BIEN - Enmascarar antes de almacenar
const paymentMethod = {
  cardNumber: maskCardNumber(fullCardNumber), // "**** **** **** 1234"
  cardBrand: 'visa',
  expiryMonth: '12',
  expiryYear: '2025',
  // ❌ NUNCA almacenar CVV
}

// ✅ BIEN - Tokenizar con Stripe antes de enviar al backend
const token = await stripe.createToken(cardElement)
await api.processPayment({ token: token.id })
```

### ❌ Implementación Incorrecta

```typescript
// ❌ MAL - Almacenar número completo
const paymentMethod = {
  cardNumber: '4242424242424242',  // ❌ NUNCA
  cvv: '123',  // ❌ NUNCA
}

// ❌ MAL - Enviar datos de tarjeta sin tokenizar
await api.processPayment({
  cardNumber: '4242424242424242',
  cvv: '123'
})
```

### Validación de Tarjetas

```typescript
import { 
  validateCardNumberLuhn,
  detectCardType,
  validateCVV 
} from '@/features/commerce/utils/cardValidation'

// ✅ BIEN - Validar en frontend antes de enviar
const isValid = validateCardNumberLuhn(cardNumber)
const cardType = detectCardType(cardNumber)
const isCVVValid = validateCVV(cvv, cardType)

if (isValid && isCVVValid) {
  // Tokenizar y procesar
  const token = await stripe.createToken(cardElement)
  // Enviar solo el token, NO los datos de la tarjeta
}
```

---

## 🔑 Variables de Entorno

### Configuración de Secrets

**NUNCA** commitear secrets en el código. Usar variables de entorno.

#### ✅ Archivo `.env.local` (NO commitear)

```bash
# API Keys (NUNCA commitear)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # Solo backend

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...  # Solo backend

# URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

#### ✅ Archivo `.env.example` (Commitear)

```bash
# API Keys (valores de ejemplo)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Uso en Código

```typescript
// ✅ BIEN - Usar variables de entorno
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!stripeKey) {
  throw new Error('Stripe key not configured')
}

// ❌ MAL - Hardcodear secrets
const stripeKey = 'pk_test_abc123...'  // ❌ NUNCA
```

### Prefijos de Variables

- `NEXT_PUBLIC_*` - Expuestas al cliente (solo para keys públicas)
- Sin prefijo - Solo disponibles en servidor (para secrets)

---

## ✅ Checklist de Seguridad

### Antes de Commitear

- [ ] No hay contraseñas hardcodeadas
- [ ] No hay API keys hardcodeadas
- [ ] No hay tokens hardcodeados
- [ ] `.env.local` está en `.gitignore`
- [ ] Se usa `secureLogger` para logs con datos de usuario
- [ ] No se almacenan datos sensibles en localStorage
- [ ] Los números de tarjeta se enmascaran antes de mostrar
- [ ] No se loguean CVV ni contraseñas

### Antes de Producción

- [ ] Todas las variables de entorno están configuradas
- [ ] HTTPS está habilitado
- [ ] httpOnly cookies están configuradas
- [ ] CORS está configurado correctamente
- [ ] Rate limiting está implementado
- [ ] Validación de inputs en frontend y backend
- [ ] Sanitización de datos antes de loguear
- [ ] Tokenización de tarjetas implementada (Stripe/PayPal)

### Revisión de Código

- [ ] No hay `console.log` con datos sensibles
- [ ] No hay `localStorage.setItem` con datos sensibles
- [ ] Se usan las utilidades de `@/shared/lib/security`
- [ ] Los formularios de pago usan tokenización
- [ ] Los errores no exponen información sensible

---

## 📚 Recursos Adicionales

### Utilidades de Seguridad

Todas las utilidades de seguridad están en:
```
domains/platform/frontend/src/shared/lib/security.ts
```

Funciones disponibles:
- `maskCardNumber()` - Enmascara números de tarjeta
- `maskCVV()` - Enmascara CVV
- `maskEmail()` - Enmascara emails
- `maskToken()` - Enmascara tokens
- `sanitizeObject()` - Sanitiza objetos completos
- `secureLogger` - Logger que sanitiza automáticamente
- `safeLocalStorageSet()` - Wrapper seguro para localStorage
- `containsSensitiveData()` - Detecta datos sensibles

### Estándares de Seguridad

- [PCI DSS](https://www.pcisecuritystandards.org/) - Estándar de seguridad para tarjetas
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Vulnerabilidades web más comunes
- [GDPR](https://gdpr.eu/) - Regulación de protección de datos (Europa)

---

## 🚨 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** crear un issue público
2. Contactar al equipo de seguridad: security@technovastore.com
3. Proporcionar detalles de la vulnerabilidad
4. Esperar confirmación antes de divulgar

---

## 📝 Notas Finales

La seguridad es responsabilidad de todos. Siempre:

1. **Pensar antes de almacenar** - ¿Realmente necesito guardar esto?
2. **Pensar antes de loguear** - ¿Esto contiene datos sensibles?
3. **Pensar antes de enviar** - ¿Estoy exponiendo información innecesaria?

**Cuando tengas dudas, pregunta al equipo de seguridad.**

---

*Última actualización: Diciembre 2025*
