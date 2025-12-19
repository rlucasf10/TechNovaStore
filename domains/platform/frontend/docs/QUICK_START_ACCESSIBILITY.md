# Guía Rápida de Accesibilidad de Colores

## 🚀 Inicio Rápido

### Verificar Contraste

```bash
# Ejecutar script de verificación
docker exec technovastore-frontend node scripts/check-contrast.js
```

**Resultado esperado**: ✅ 20/20 pruebas pasadas

## 🎨 Colores Seguros para Usar

### Sobre Fondo Blanco

```tsx
// ✅ USAR ESTOS COLORES
<p className="text-gray-900">Texto principal</p>
<p className="text-gray-800">Texto secundario</p>
<p className="text-gray-700">Texto terciario</p>
<p className="text-gray-600">Texto muted</p>
<p className="text-gray-500">Placeholders (mínimo)</p>

// Colores semánticos
<p className="text-success">Mensaje de éxito</p>
<p className="text-error">Mensaje de error</p>
<p className="text-warning">Mensaje de advertencia</p>
<p className="text-info">Mensaje informativo</p>

// Enlaces
<a className="text-primary-600">Enlace</a>
```

```tsx
// ❌ NO USAR ESTOS COLORES
<p className="text-gray-400">Contraste insuficiente</p>
<p className="text-gray-300">Contraste insuficiente</p>
```

### Sobre Fondo Oscuro

```tsx
// ✅ USAR ESTOS COLORES
<div className="bg-gray-900">
  <p className="text-white">Texto principal</p>
  <p className="text-gray-400">Texto secundario</p>
</div>
```

## 🔧 Componentes Comunes

### Botones

```tsx
// ✅ Todos estos botones tienen buen contraste
<button className="bg-primary-600 text-white">Primario</button>
<button className="bg-success text-white">Éxito</button>
<button className="bg-error text-white">Error</button>
<button className="bg-warning text-white">Advertencia</button>
```

### Notificaciones Toast

```tsx
// ✅ Usa los colores semánticos ajustados
import { useNotification } from '@/store/notification.store'

const { addNotification } = useNotification()

addNotification({
  type: 'success', // ✅ Verde oscuro (#047857)
  message: 'Operación exitosa'
})

addNotification({
  type: 'error', // ✅ Rojo (#dc2626)
  message: 'Error al procesar'
})

addNotification({
  type: 'warning', // ✅ Naranja oscuro (#b45309)
  message: 'Advertencia importante'
})
```

### Mensajes de Error en Formularios

```tsx
// ✅ Usa text-error (contraste 4.83:1)
<Input
  label="Email"
  error="Email inválido"
  // El componente usa text-error automáticamente
/>

// O manualmente:
<p className="text-error text-sm mt-1">
  Este campo es obligatorio
</p>
```

## 📋 Checklist para Nuevos Componentes

Antes de crear un componente con colores:

- [ ] ¿Usa colores del sistema de diseño?
- [ ] ¿El texto tiene contraste ≥4.5:1?
- [ ] ¿Los iconos tienen contraste ≥3.0:1?
- [ ] ¿Funciona en tema claro Y oscuro?
- [ ] ¿Ejecutaste el script de verificación?

## 🛠️ Herramientas

### 1. Script Automático (Recomendado)

```bash
docker exec technovastore-frontend node scripts/check-contrast.js
```

### 2. WebAIM Contrast Checker

https://webaim.org/resources/contrastchecker/

Ingresa:
- Color de fondo (ej: #ffffff)
- Color de texto (ej: #047857)
- Verifica que pase AA para texto normal

### 3. Chrome DevTools

1. Inspeccionar elemento
2. Ver "Accessibility" tab
3. Revisar "Contrast ratio"

## ⚠️ Errores Comunes

### ❌ Error 1: Usar colores claros sobre blanco

```tsx
// ❌ MAL - Contraste insuficiente
<p className="text-gray-400">Texto</p>

// ✅ BIEN - Contraste suficiente
<p className="text-gray-600">Texto</p>
```

### ❌ Error 2: Usar colores viejos de success/error/warning

```tsx
// ❌ MAL - Colores viejos (no cumplen WCAG)
<p style={{ color: '#10b981' }}>Éxito</p>

// ✅ BIEN - Usa clases del sistema
<p className="text-success">Éxito</p>
```

### ❌ Error 3: No verificar en tema oscuro

```tsx
// ⚠️ VERIFICAR - ¿Funciona en oscuro?
<div className="bg-gray-100">
  <p className="text-gray-900">Texto</p>
</div>

// ✅ MEJOR - Considera tema oscuro
<div className="bg-gray-100 dark:bg-gray-800">
  <p className="text-gray-900 dark:text-white">Texto</p>
</div>
```

## 📚 Documentación Completa

Para más detalles, consulta:

- `docs/ACCESSIBILITY_COLORS.md` - Guía completa de colores
- `docs/CONTRAST_VERIFICATION_CHECKLIST.md` - Lista de verificación
- `docs/CONTRAST_CHANGES_SUMMARY.md` - Resumen de cambios
- `scripts/README_CONTRAST.md` - Guía del script

## 🆘 Ayuda

### ¿Necesitas un color que no está en la lista?

1. Verifica el contraste con WebAIM
2. Si pasa (≥4.5:1), úsalo
3. Si no pasa, busca un tono más oscuro
4. Actualiza el script si es una combinación común

### ¿El script falla después de tus cambios?

1. Revisa qué combinación falló
2. Ajusta el color para cumplir el contraste mínimo
3. Ejecuta el script nuevamente
4. Documenta el cambio

### ¿Dudas sobre accesibilidad?

- Consulta WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- Pregunta al equipo de accesibilidad
- Usa las herramientas de verificación

## ✅ Resumen

**Regla de oro**: Si usas los colores del sistema de diseño (text-gray-X, text-success, text-error, etc.), ya estás cumpliendo con WCAG 2.1 AA.

**Verificación**: Ejecuta `node scripts/check-contrast.js` después de cambios de colores.

**Documentación**: Todo está en `docs/ACCESSIBILITY_COLORS.md`.

---

**Última actualización**: 14 de enero de 2025  
**Estado**: ✅ Todos los colores cumplen WCAG 2.1 AA
