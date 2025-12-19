# Auditoría de Seguridad - Frontend TechNovaStore

**Fecha**: Diciembre 2025  
**Estado**: 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

---

## 🚨 Problemas Críticos Encontrados

### 1. Tokens en localStorage (CRÍTICO)

**Problema**: Estamos almacenando `auth_token` en localStorage, lo cual viola nuestras propias guías de seguridad y expone los tokens a ataques XSS.

**Archivos afectados**:
- `src/features/customer/services/auth.service.ts` (líneas 596, 873)
- `src/features/customer/store/auth.store.ts` (líneas 46, 106)
- `src/shared/lib/axios.ts` (línea 73)
- `src/shared/lib/api.ts` (línea 65)
- `src/shared/services/wishlistService.ts` (línea 81)
- `src/shared/services/orderService.ts` (línea 94)
- `src/shared/services/shipmentService.ts` (línea 25)
- `src/shared/services/recommenderService.ts` (línea 228)
- `src/shared/services/campaignService.ts` (línea 33)
- `src/shared/services/ticket.service.ts` (línea 27)
- `src/shared/components/ui/CookieConsent.tsx` (línea 80)
- `src/app/pedidos/[id]/page.tsx` (línea 148)

**Solución requerida**:
1. ✅ El backend YA está configurado para usar httpOnly cookies
2. ❌ El frontend NO debe almacenar ni leer tokens de localStorage
3. ❌ El frontend NO debe enviar tokens en headers Authorization
4. ✅ Los tokens se envían automáticamente con `withCredentials: true`

**Acción**:
- Eliminar TODAS las referencias a `localStorage.getItem('auth_token')`
- Eliminar TODAS las líneas que hacen `localStorage.setItem('auth_token', ...)`
- Eliminar TODAS las líneas que agregan `Authorization: Bearer ${token}`
- Confiar en las cookies httpOnly que el backend ya está enviando

---

### 2. console.log sin sanitizar (MEDIO)

**Problema**: Hay múltiples `console.log` que podrían estar logueando datos sensibles sin sanitizar.

**Archivos con más riesgo**:
- `src/features/customer/services/auth.service.ts` - Loguea respuestas de autenticación
- `src/shared/services/orderService.ts` - Loguea datos de pedidos
- `src/features/commerce/components/checkout/PaymentForm.tsx` - Ya usa secureLogger ✅

**Solución requerida**:
- Reemplazar `console.log` con `secureLogger.log` en archivos que manejan datos de usuario
- Reemplazar `console.error` con `secureLogger.error` en archivos que manejan datos de usuario

**Prioridad**: MEDIA (no expone datos directamente, pero puede filtrar información en logs)

---

### 3. Datos de usuario en localStorage (BAJO)

**Problema**: El store de auth persiste datos de usuario en localStorage.

**Archivo afectado**:
- `src/features/customer/store/auth.store.ts`

**Estado actual**: ✅ PARCIALMENTE SEGURO
- Solo persiste datos no sensibles (id, email, nombre, rol)
- NO persiste tokens ni contraseñas
- Usa `partialize` para filtrar datos

**Acción**: NINGUNA - La implementación actual es aceptable

---

## 📋 Plan de Corrección

### Fase 1: Eliminar tokens de localStorage (CRÍTICO)

**Archivos a modificar**:

1. **auth.service.ts**
   - Eliminar líneas 596, 598, 873, 875 (localStorage.setItem)
   - Eliminar console.log de tokens

2. **auth.store.ts**
   - Eliminar líneas 46, 106 (localStorage.getItem)
   - Eliminar verificación de token (ya no es necesaria)

3. **axios.ts**
   - Eliminar líneas 73-76 (Authorization header)
   - Confiar en cookies httpOnly

4. **api.ts**
   - Eliminar líneas 65-68 (Authorization header)
   - Confiar en cookies httpOnly

5. **Todos los servicios** (wishlist, order, shipment, recommender, campaign, ticket)
   - Eliminar Authorization headers
   - Confiar en cookies httpOnly

6. **Páginas** (pedidos/\[id\]/page.tsx)
   - Eliminar verificación de token
   - Confiar en cookies httpOnly

### Fase 2: Sanitizar logs (MEDIO)

**Archivos a modificar**:

1. **auth.service.ts**
   - Reemplazar console.log con secureLogger.log
   - Sanitizar respuestas antes de loguear

2. **orderService.ts**
   - Reemplazar console.log con secureLogger.log
   - Sanitizar datos de pedidos

---

## ✅ Checklist de Corrección

### Tokens en localStorage
- [ ] Eliminar localStorage.setItem('auth_token') en auth.service.ts
- [ ] Eliminar localStorage.getItem('auth_token') en auth.store.ts
- [ ] Eliminar Authorization headers en axios.ts
- [ ] Eliminar Authorization headers en api.ts
- [ ] Eliminar Authorization headers en wishlistService.ts
- [ ] Eliminar Authorization headers en orderService.ts
- [ ] Eliminar Authorization headers en shipmentService.ts
- [ ] Eliminar Authorization headers en recommenderService.ts
- [ ] Eliminar Authorization headers en campaignService.ts
- [ ] Eliminar Authorization headers en ticket.service.ts
- [ ] Eliminar verificación de token en pedidos/\[id\]/page.tsx
- [ ] Eliminar verificación de token en CookieConsent.tsx

### Logging Seguro
- [ ] Reemplazar console.log en auth.service.ts
- [ ] Reemplazar console.log en orderService.ts
- [ ] Verificar que no se loguean datos sensibles

### Verificación
- [ ] Ejecutar tests
- [ ] Verificar que la autenticación funciona con cookies
- [ ] Verificar que no hay tokens en localStorage
- [ ] Verificar que no hay errores de TypeScript

---

## 🔍 Notas Adicionales

### ¿Por qué httpOnly cookies son más seguras?

1. **No accesibles desde JavaScript**: Los tokens en httpOnly cookies NO pueden ser leídos por JavaScript, lo que previene ataques XSS.

2. **Enviadas automáticamente**: El navegador envía las cookies automáticamente con cada request al mismo dominio.

3. **Protección CSRF**: Con `sameSite: 'strict'` o `'lax'`, las cookies no se envían en requests cross-site.

4. **Secure flag**: En producción, las cookies solo se envían por HTTPS.

### ¿Cómo funciona con httpOnly cookies?

```typescript
// ❌ ANTES (INSEGURO)
// Frontend almacena token
localStorage.setItem('auth_token', token)

// Frontend envía token en header
headers: { Authorization: `Bearer ${token}` }

// ✅ DESPUÉS (SEGURO)
// Backend envía token en cookie httpOnly
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
})

// Frontend NO hace nada - el navegador envía la cookie automáticamente
// Solo necesita withCredentials: true en axios
```

---

**Última actualización**: Diciembre 2025
