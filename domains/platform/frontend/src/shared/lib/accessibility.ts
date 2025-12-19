/**
 * Utilidades de Accesibilidad
 * 
 * Funciones helper para mejorar la accesibilidad de la aplicación
 * según las pautas WCAG 2.1 nivel AA
 * 
 * Requisito: 5.1 - Textos alternativos descriptivos para todas las imágenes
 */

/**
 * Genera un texto alternativo descriptivo para imágenes de productos
 * 
 * @param productName - Nombre del producto
 * @param brand - Marca del producto (opcional)
 * @param category - Categoría del producto (opcional)
 * @param imageIndex - Índice de la imagen (para múltiples imágenes)
 * @returns Texto alternativo descriptivo
 * 
 * @example
 * getProductImageAlt('Laptop Dell XPS 15', 'Dell', 'Laptops', 0)
 * // Returns: "Laptop Dell XPS 15 de Dell - Imagen principal"
 */
export function getProductImageAlt(
  productName: string,
  brand?: string,
  category?: string,
  imageIndex?: number
): string {
  let alt = productName;

  if (brand && !productName.toLowerCase().includes(brand.toLowerCase())) {
    alt += ` de ${brand}`;
  }

  if (category && !productName.toLowerCase().includes(category.toLowerCase())) {
    alt += ` - ${category}`;
  }

  if (imageIndex !== undefined) {
    if (imageIndex === 0) {
      alt += ' - Imagen principal';
    } else {
      alt += ` - Imagen ${imageIndex + 1}`;
    }
  }

  return alt;
}

/**
 * Genera un texto alternativo para miniaturas de productos
 * 
 * @param productName - Nombre del producto
 * @param imageIndex - Índice de la miniatura
 * @returns Texto alternativo para miniatura
 * 
 * @example
 * getProductThumbnailAlt('Laptop Dell XPS 15', 2)
 * // Returns: "Laptop Dell XPS 15 - Miniatura 3"
 */
export function getProductThumbnailAlt(
  productName: string,
  imageIndex: number
): string {
  return `${productName} - Miniatura ${imageIndex + 1}`;
}

/**
 * Genera un texto alternativo para avatares de usuario
 * 
 * @param userName - Nombre del usuario
 * @param context - Contexto adicional (opcional)
 * @returns Texto alternativo para avatar
 * 
 * @example
 * getUserAvatarAlt('Juan Pérez', 'perfil')
 * // Returns: "Foto de perfil de Juan Pérez"
 */
export function getUserAvatarAlt(
  userName: string,
  context?: 'perfil' | 'comentario' | 'review'
): string {
  const contextText = context ? ` de ${context}` : '';
  return `Foto${contextText} de ${userName}`;
}

/**
 * Genera un texto alternativo para imágenes de categorías
 * 
 * @param categoryName - Nombre de la categoría
 * @param productCount - Número de productos en la categoría (opcional)
 * @returns Texto alternativo para categoría
 * 
 * @example
 * getCategoryImageAlt('Laptops', 150)
 * // Returns: "Categoría Laptops - 150 productos disponibles"
 */
export function getCategoryImageAlt(
  categoryName: string,
  productCount?: number
): string {
  let alt = `Categoría ${categoryName}`;

  if (productCount !== undefined) {
    alt += ` - ${productCount} producto${productCount !== 1 ? 's' : ''} disponible${productCount !== 1 ? 's' : ''}`;
  }

  return alt;
}

/**
 * Genera un texto alternativo para logos de marcas
 * 
 * @param brandName - Nombre de la marca
 * @returns Texto alternativo para logo de marca
 * 
 * @example
 * getBrandLogoAlt('Dell')
 * // Returns: "Logo de Dell"
 */
export function getBrandLogoAlt(brandName: string): string {
  return `Logo de ${brandName}`;
}

/**
 * Genera un texto alternativo para imágenes de reviews
 * 
 * @param productName - Nombre del producto
 * @param userName - Nombre del usuario que subió la imagen
 * @param imageIndex - Índice de la imagen
 * @returns Texto alternativo para imagen de review
 * 
 * @example
 * getReviewImageAlt('Laptop Dell XPS 15', 'Juan Pérez', 0)
 * // Returns: "Foto de Laptop Dell XPS 15 compartida por Juan Pérez - Imagen 1"
 */
export function getReviewImageAlt(
  productName: string,
  userName: string,
  imageIndex: number
): string {
  return `Foto de ${productName} compartida por ${userName} - Imagen ${imageIndex + 1}`;
}

/**
 * Genera un texto alternativo para imágenes decorativas
 * (debe ser string vacío según WCAG 2.1)
 * 
 * @returns String vacío para imágenes decorativas
 * 
 * @example
 * <img src="decoration.svg" alt={getDecorativeImageAlt()} />
 */
export function getDecorativeImageAlt(): string {
  return '';
}

/**
 * Genera un texto alternativo para imágenes de placeholder
 * 
 * @param context - Contexto del placeholder
 * @returns Texto alternativo para placeholder
 * 
 * @example
 * getPlaceholderImageAlt('producto')
 * // Returns: "Imagen de producto no disponible"
 */
export function getPlaceholderImageAlt(
  context: 'producto' | 'usuario' | 'categoría' | 'marca'
): string {
  return `Imagen de ${context} no disponible`;
}

/**
 * Genera un texto alternativo para imágenes de campañas/banners
 * 
 * @param campaignTitle - Título de la campaña
 * @param discount - Descuento ofrecido (opcional)
 * @returns Texto alternativo para banner de campaña
 * 
 * @example
 * getCampaignBannerAlt('Black Friday', 50)
 * // Returns: "Banner de campaña Black Friday - Hasta 50% de descuento"
 */
export function getCampaignBannerAlt(
  campaignTitle: string,
  discount?: number
): string {
  let alt = `Banner de campaña ${campaignTitle}`;

  if (discount !== undefined) {
    alt += ` - Hasta ${discount}% de descuento`;
  }

  return alt;
}

/**
 * Genera un aria-label descriptivo para botones de acción
 * 
 * @param action - Acción del botón
 * @param context - Contexto adicional
 * @returns Aria-label descriptivo
 * 
 * @example
 * getActionAriaLabel('agregar al carrito', 'Laptop Dell XPS 15')
 * // Returns: "Agregar Laptop Dell XPS 15 al carrito"
 */
export function getActionAriaLabel(
  action: string,
  context?: string
): string {
  const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
  
  if (context) {
    return `${capitalizedAction} ${context}`;
  }
  
  return capitalizedAction;
}

/**
 * Genera un aria-label para controles de cantidad
 * 
 * @param action - 'incrementar' o 'decrementar'
 * @param productName - Nombre del producto
 * @returns Aria-label para control de cantidad
 * 
 * @example
 * getQuantityControlAriaLabel('incrementar', 'Laptop Dell XPS 15')
 * // Returns: "Incrementar cantidad de Laptop Dell XPS 15"
 */
export function getQuantityControlAriaLabel(
  action: 'incrementar' | 'decrementar',
  productName: string
): string {
  return `${action.charAt(0).toUpperCase() + action.slice(1)} cantidad de ${productName}`;
}

/**
 * Genera un aria-label para navegación de imágenes
 * 
 * @param direction - 'anterior' o 'siguiente'
 * @param context - Contexto adicional (opcional)
 * @returns Aria-label para navegación
 * 
 * @example
 * getNavigationAriaLabel('siguiente', 'imagen del producto')
 * // Returns: "Siguiente imagen del producto"
 */
export function getNavigationAriaLabel(
  direction: 'anterior' | 'siguiente',
  context?: string
): string {
  const directionText = direction.charAt(0).toUpperCase() + direction.slice(1);
  
  if (context) {
    return `${directionText} ${context}`;
  }
  
  return directionText;
}

/**
 * Valida si un texto alternativo es descriptivo y cumple con WCAG 2.1
 * 
 * @param alt - Texto alternativo a validar
 * @param minLength - Longitud mínima recomendada (default: 5)
 * @param maxLength - Longitud máxima recomendada (default: 125)
 * @returns true si el alt text es válido
 * 
 * @example
 * isValidAltText('Laptop Dell XPS 15')
 * // Returns: true
 * 
 * isValidAltText('img')
 * // Returns: false (muy corto)
 */
export function isValidAltText(
  alt: string,
  minLength: number = 5,
  maxLength: number = 125
): boolean {
  // Permitir string vacío para imágenes decorativas
  if (alt === '') return true;

  // Validar longitud
  if (alt.length < minLength || alt.length > maxLength) {
    return false;
  }

  // Evitar textos genéricos no descriptivos
  const genericTexts = [
    'imagen',
    'image',
    'foto',
    'photo',
    'picture',
    'img',
    'pic',
  ];

  const lowerAlt = alt.toLowerCase().trim();
  if (genericTexts.includes(lowerAlt)) {
    return false;
  }

  return true;
}

/**
 * Genera un caption descriptivo para videos
 * 
 * @param videoTitle - Título del video
 * @param duration - Duración del video en segundos (opcional)
 * @param language - Idioma del video (opcional)
 * @returns Caption descriptivo para video
 * 
 * @example
 * getVideoCaption('Tutorial de instalación', 180, 'es')
 * // Returns: "Tutorial de instalación - 3:00 minutos - Español"
 */
export function getVideoCaption(
  videoTitle: string,
  duration?: number,
  language?: string
): string {
  let caption = videoTitle;

  if (duration !== undefined) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    caption += ` - ${minutes}:${seconds.toString().padStart(2, '0')} minutos`;
  }

  if (language) {
    const languageNames: Record<string, string> = {
      es: 'Español',
      en: 'Inglés',
      fr: 'Francés',
      de: 'Alemán',
      it: 'Italiano',
      pt: 'Portugués',
    };
    caption += ` - ${languageNames[language] || language}`;
  }

  return caption;
}

/**
 * Genera atributos de accesibilidad completos para una imagen
 * 
 * @param alt - Texto alternativo
 * @param role - Rol ARIA (opcional)
 * @param ariaLabel - Aria-label adicional (opcional)
 * @returns Objeto con atributos de accesibilidad
 * 
 * @example
 * const attrs = getImageAccessibilityAttrs('Laptop Dell XPS 15', 'img')
 * // <img {...attrs} />
 */
export function getImageAccessibilityAttrs(
  alt: string,
  role?: string,
  ariaLabel?: string
): {
  alt: string;
  role?: string;
  'aria-label'?: string;
  loading?: 'lazy' | 'eager';
} {
  const attrs: any = { alt };

  if (role) {
    attrs.role = role;
  }

  if (ariaLabel) {
    attrs['aria-label'] = ariaLabel;
  }

  // Lazy loading por defecto para mejorar rendimiento
  attrs.loading = 'lazy';

  return attrs;
}
