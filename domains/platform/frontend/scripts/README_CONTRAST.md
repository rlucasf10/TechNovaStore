# Verificación de Contraste de Colores

## Descripción

Este directorio contiene herramientas para verificar que todos los colores de la aplicación cumplan con los estándares de accesibilidad WCAG 2.1 Nivel AA.

## Script de Verificación

### `check-contrast.js`

Script automatizado que verifica el contraste de todas las combinaciones de colores usadas en la aplicación.

#### Uso

```bash
# Desde el contenedor de Docker
docker exec technovastore-frontend node scripts/check-contrast.js

# Desde el directorio del frontend (si estás dentro del contenedor)
node scripts/check-contrast.js
```

#### Salida

El script verifica:
- ✅ Contraste mínimo 4.5:1 para texto normal
- ✅ Contraste mínimo 3.0:1 para texto grande (≥18px o ≥14px bold)

Ejemplo de salida:

```
================================================================================
VERIFICACIÓN DE CONTRASTE DE COLORES - WCAG 2.1 AA
================================================================================

COMBINACIONES DE TEXTO Y FONDO:

Texto principal sobre fondo blanco
  bg-white + text-gray-900
  Ratio: 17.74:1
  ✅ Texto normal (≥4.5:1): PASA
  ✅ Texto grande (≥3.0:1): PASA

...

================================================================================
RESUMEN:
Total de pruebas: 20
✅ Pasadas: 20 (100.0%)
❌ Fallidas: 0 (0.0%)
================================================================================

✅ ¡Excelente! Todas las combinaciones cumplen con WCAG 2.1 AA
```

## Colores Ajustados

Los siguientes colores fueron ajustados para cumplir con WCAG 2.1 AA:

| Color | Antes | Después | Contraste |
|-------|-------|---------|-----------|
| Success | `#10b981` (2.54:1) ❌ | `#047857` (5.48:1) ✅ |
| Error | `#ef4444` (3.76:1) ❌ | `#dc2626` (4.83:1) ✅ |
| Warning | `#f59e0b` (2.15:1) ❌ | `#b45309` (5.02:1) ✅ |

## Integración en CI/CD

Para integrar la verificación de contraste en tu pipeline de CI/CD:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Check

on: [push, pull_request]

jobs:
  contrast-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd domains/platform/frontend && npm install
      - name: Check color contrast
        run: cd domains/platform/frontend && node scripts/check-contrast.js
```

## Herramientas Adicionales

### Verificación Manual

Para verificar manualmente el contraste de colores:

1. **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
2. **Color Contrast Analyzer**: https://www.tpgi.com/color-contrast-checker/
3. **Chrome DevTools**: Lighthouse > Accessibility

### Extensiones de Navegador

- **axe DevTools**: Extensión para Chrome/Firefox que verifica accesibilidad
- **WAVE**: Extensión que evalúa la accesibilidad de páginas web
- **Contrast**: Extensión simple para verificar contraste de colores

## Componentes Verificados

Los siguientes componentes han sido verificados para cumplir con WCAG 2.1 AA:

- ✅ **ChatWidget**: Header, mensajes, inputs
- ✅ **Toast/Notificaciones**: Success, error, warning, info
- ✅ **Botones**: Primary, secondary, danger, ghost
- ✅ **Formularios**: Inputs, labels, mensajes de error
- ✅ **Página de Inicio**: Hero, cards, texto
- ✅ **Catálogo de Productos**: Cards, filtros, toolbar
- ✅ **Dashboard de Usuario**: Sidebar, cards, estadísticas
- ✅ **Panel de Administrador**: Tablas, gráficos, alertas

## Pautas de Desarrollo

### Al Agregar Nuevos Colores

1. **Verifica el contraste** antes de usar el color en producción
2. **Ejecuta el script** después de agregar nuevas combinaciones
3. **Actualiza el script** si agregas nuevas combinaciones comunes
4. **Documenta** los cambios en `ACCESSIBILITY_COLORS.md`

### Colores Seguros

Usa estos colores que ya están verificados:

**Texto sobre fondo blanco:**
- `text-gray-900` (17.74:1) ✅
- `text-gray-800` (14.68:1) ✅
- `text-gray-700` (10.31:1) ✅
- `text-gray-600` (7.56:1) ✅
- `text-gray-500` (4.83:1) ✅ (mínimo aceptable)
- `text-primary-600` (5.17:1) ✅
- `text-success` (5.48:1) ✅
- `text-error` (4.83:1) ✅
- `text-warning` (5.02:1) ✅

**Texto sobre fondo oscuro:**
- `text-white` sobre `bg-gray-900` (17.74:1) ✅
- `text-gray-400` sobre `bg-gray-900` (6.99:1) ✅

### Colores a Evitar

**NO uses estos colores para texto sobre fondo blanco:**
- ❌ `text-gray-400` (3.09:1) - Contraste insuficiente
- ❌ `text-gray-300` (1.89:1) - Contraste insuficiente
- ❌ Colores claros sin verificar

## Recursos

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

## Soporte

Si tienes preguntas sobre accesibilidad de colores:

1. Consulta `docs/ACCESSIBILITY_COLORS.md`
2. Ejecuta el script de verificación
3. Usa herramientas de verificación manual
4. Contacta al equipo de accesibilidad

---

**Última actualización**: 14 de enero de 2025  
**Mantenedor**: Equipo de Frontend TechNovaStore
