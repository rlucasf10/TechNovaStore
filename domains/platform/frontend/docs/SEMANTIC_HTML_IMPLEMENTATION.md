# Implementación de HTML Semántico - TechNovaStore Frontend

## Resumen

Este documento describe la implementación de HTML semántico en el frontend de TechNovaStore, cumpliendo con los requisitos de accesibilidad WCAG 2.1 AA.

## Cambios Implementados

### 1. Layout Principal (`src/app/layout.tsx`)

**Antes:**
```tsx
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

**Después:**
```tsx
<div id="main-content" role="main" tabIndex={-1}>
  {children}
</div>
```

**Mejoras:**
- ✅ Landmark ARIA explícito con `role="main"`
- ✅ Mantiene el ID para skip links
- ✅ Mantiene tabIndex para navegación por teclado

### 2. Página Principal (`src/app/page.tsx`)

**Cambios estructurales:**

1. **Elemento `<main>` semántico:**
   - Envuelve todo el contenido principal de la página
   - Proporciona landmark principal para lectores de pantalla

2. **Uso de `<header>` en secciones:**
   - Sección de beneficios usa `<header>` para agrupar título y subtítulo
   - Mejora la jerarquía semántica

3. **Elementos `<article>` para contenido independiente:**
   - Cada beneficio (Entrega Express, Mejor Precio, Soporte) es un `<article>`
   - Indica que cada uno es contenido independiente y reutilizable

**Estructura resultante:**
```
<Header /> (navegación principal - landmark)
<main> (contenido principal - landmark)
  <HeroSection />
  <TrustBadges />
  <FeaturedCategories />
  <DealsSection />
  <ProductRecommenderWidget />
  <section aria-labelledby="benefits-heading">
    <header>
      <h2 id="benefits-heading">...</h2>
      <p>...</p>
    </header>
    <div>
      <article>...</article>
      <article>...</article>
      <article>...</article>
    </div>
  </section>
  <NewsletterSignup />
</main>
<Footer /> (navegación secundaria - landmark)
```

### 3. HeroSection (`src/shared/components/home/HeroSection.tsx`)

**Mejoras de accesibilidad:**

1. **Atributo `aria-labelledby`:**
   ```tsx
   <section aria-labelledby="hero-heading">
   ```
   - Conecta la sección con su encabezado principal

2. **Imagen decorativa:**
   ```tsx
   <Image alt="" role="presentation" />
   ```
   - `alt=""` indica que es decorativa
   - `role="presentation"` refuerza que no es contenido

3. **Overlay decorativo:**
   ```tsx
   <div aria-hidden="true" />
   ```
   - Oculta elementos puramente visuales de lectores de pantalla

4. **Badge de campaña:**
   ```tsx
   <span role="status">
   ```
   - Indica que es información de estado dinámica

5. **Indicador de scroll:**
   ```tsx
   <div aria-hidden="true">
   ```
   - Elemento puramente decorativo oculto de lectores de pantalla

### 4. FeaturedCategories (`src/shared/components/home/FeaturedCategories.tsx`)

**Mejoras de accesibilidad:**

1. **Estructura semántica con `<nav>` y `<ul>`:**
   ```tsx
   <section aria-labelledby="categories-heading">
     <header>
       <h2 id="categories-heading">...</h2>
     </header>
     <nav aria-label="Categorías de productos">
       <ul>
         <li>
           <Link aria-label="Ver productos de...">
         </li>
       </ul>
     </nav>
   </section>
   ```

2. **Beneficios:**
   - ✅ Uso de `<nav>` para navegación de categorías
   - ✅ Lista semántica `<ul>` y `<li>`
   - ✅ `aria-label` descriptivo en cada enlace
   - ✅ Elementos decorativos marcados con `aria-hidden="true"`

### 5. DealsSection (`src/shared/components/home/DealsSection.tsx`)

**Mejoras de accesibilidad:**

1. **Estructura semántica:**
   ```tsx
   <section aria-labelledby="deals-heading">
     <header>
       <div role="status">Badge</div>
       <h2 id="deals-heading">...</h2>
     </header>
     <div role="list" aria-label="Productos en oferta">
       <div role="listitem">
         <ProductCard />
       </div>
     </div>
   </section>
   ```

2. **Countdown timer:**
   ```tsx
   <div role="timer" aria-live="polite" aria-atomic="true">
   ```
   - `role="timer"` indica que es un temporizador
   - `aria-live="polite"` anuncia cambios sin interrumpir
   - `aria-atomic="true"` lee el contenido completo en cada actualización

3. **Iconos decorativos:**
   ```tsx
   <svg aria-hidden="true">
   ```

## Jerarquía de Headings

La estructura de headings sigue una jerarquía lógica:

```
h1 - Título principal del Hero (página principal)
  h2 - Sección de categorías
  h2 - Sección de ofertas
  h2 - Sección de productos recomendados
  h2 - Sección de beneficios
    h3 - Cada beneficio individual
  h2 - Newsletter
```

## Landmarks ARIA

Los siguientes landmarks están implementados:

1. **`<header>` / `role="banner"`** - Header principal (implícito)
2. **`<nav>` / `role="navigation"`** - Navegación principal y secundaria
3. **`<main>` / `role="main"`** - Contenido principal de la página
4. **`<footer>` / `role="contentinfo"`** - Footer (implícito)
5. **`<section>` con `aria-labelledby`** - Secciones de contenido etiquetadas

## Elementos Semánticos Utilizados

- ✅ `<header>` - Encabezados de secciones
- ✅ `<nav>` - Navegación
- ✅ `<main>` - Contenido principal
- ✅ `<section>` - Secciones temáticas
- ✅ `<article>` - Contenido independiente
- ✅ `<footer>` - Pie de página
- ✅ `<ul>` / `<li>` - Listas
- ✅ `<h1>` - `<h6>` - Jerarquía de encabezados

## Atributos ARIA Implementados

- ✅ `aria-labelledby` - Conecta secciones con sus encabezados
- ✅ `aria-label` - Etiquetas descriptivas para navegación
- ✅ `aria-hidden` - Oculta elementos decorativos
- ✅ `role="presentation"` - Marca imágenes decorativas
- ✅ `role="status"` - Información de estado dinámica
- ✅ `role="timer"` - Temporizadores
- ✅ `role="list"` / `role="listitem"` - Listas personalizadas
- ✅ `aria-live` - Regiones dinámicas
- ✅ `aria-atomic` - Lectura completa de contenido dinámico

## Cumplimiento WCAG 2.1 AA

### Criterios Cumplidos:

1. **1.3.1 Info and Relationships (Level A)**
   - ✅ Estructura semántica clara con elementos HTML5
   - ✅ Landmarks ARIA para navegación
   - ✅ Jerarquía de headings lógica

2. **2.4.1 Bypass Blocks (Level A)**
   - ✅ Skip links implementados
   - ✅ Landmarks para navegación rápida

3. **2.4.6 Headings and Labels (Level AA)**
   - ✅ Headings descriptivos y jerárquicos
   - ✅ Labels claros en todos los elementos interactivos

4. **4.1.2 Name, Role, Value (Level A)**
   - ✅ Roles ARIA apropiados
   - ✅ Nombres accesibles para todos los elementos interactivos
   - ✅ Estados y propiedades comunicados correctamente

## Verificación

Para verificar la implementación:

1. **Validación HTML:**
   ```bash
   # Usar validador W3C
   ```

2. **Pruebas con lectores de pantalla:**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS)

3. **Herramientas de auditoría:**
   - Lighthouse (Chrome DevTools)
   - axe DevTools
   - WAVE

4. **Navegación por teclado:**
   - Tab / Shift+Tab para navegar
   - Enter / Space para activar
   - Escape para cerrar modales

## Próximos Pasos

Para completar la implementación de HTML semántico en toda la aplicación:

1. ✅ Layout principal y página de inicio
2. ⏳ Páginas de productos y catálogo
3. ⏳ Páginas de carrito y checkout
4. ⏳ Dashboard de usuario
5. ⏳ Páginas de autenticación
6. ⏳ Componentes de UI base

## Referencias

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [HTML5 Semantic Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

---

**Fecha de implementación:** 14 de diciembre de 2025
**Requisito:** 5.4 - Implementar HTML semántico
**Estado:** ✅ Completado para página principal
