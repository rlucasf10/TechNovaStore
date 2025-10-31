import { ProductInfo } from '../knowledge/ProductKnowledgeBase';

/**
 * Formatea información de productos en un contexto estructurado
 * para inyectar en el prompt de Ollama
 */
export class ProductContextFormatter {
    /**
     * Formatea una lista de productos en un contexto legible para el LLM
     * @param products Lista de productos a formatear
     * @returns String con el contexto formateado, o mensaje indicando que no hay productos
     */
    static formatProductContext(products: ProductInfo[]): string {
        // Manejar caso de 0 productos encontrados
        if (!products || products.length === 0) {
            return 'No se encontraron productos que coincidan con la consulta. Por favor, sugiere al cliente que reformule su búsqueda o contacte con soporte para asistencia personalizada.';
        }

        let context = 'PRODUCTOS DISPONIBLES:\n\n';

        products.forEach((product, index) => {
            // Formateo estructurado: nombre, SKU, marca, precio, disponibilidad
            context += `${index + 1}. ${product.name}\n`;
            context += `   - SKU: ${product.sku}\n`;
            context += `   - Marca: ${product.brand}\n`;
            context += `   - Precio: €${product.price.toFixed(2)}\n`;
            context += `   - Disponibilidad: ${product.availability ? 'En stock ✓' : 'Agotado ✗'}\n`;

            // Incluir descripción (máximo 200 caracteres)
            if (product.description && product.description.trim().length > 0) {
                const truncatedDescription = product.description.length > 200
                    ? product.description.substring(0, 197) + '...'
                    : product.description;
                context += `   - Descripción: ${truncatedDescription}\n`;
            }

            // Incluir especificaciones técnicas clave (máximo 5)
            if (product.specifications && Object.keys(product.specifications).length > 0) {
                context += `   - Especificaciones técnicas:\n`;
                
                const specEntries = Object.entries(product.specifications);
                const limitedSpecs = specEntries.slice(0, 5);

                limitedSpecs.forEach(([key, value]) => {
                    // Formatear la clave para que sea más legible
                    const formattedKey = this.formatSpecificationKey(key);
                    // Formatear el valor para que sea conciso
                    const formattedValue = this.formatSpecificationValue(value);
                    
                    if (formattedValue) {
                        context += `     * ${formattedKey}: ${formattedValue}\n`;
                    }
                });
            }

            context += '\n';
        });

        return context;
    }

    /**
     * Formatea la clave de una especificación para hacerla más legible
     * @param key Clave de la especificación
     * @returns Clave formateada
     */
    private static formatSpecificationKey(key: string): string {
        // Convertir snake_case o camelCase a formato legible
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Formatea el valor de una especificación para que sea conciso
     * @param value Valor de la especificación
     * @returns Valor formateado o null si no es válido
     */
    private static formatSpecificationValue(value: any): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        // Si es un objeto o array, convertir a JSON compacto
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                // Para arrays, unir con comas
                return value.join(', ');
            } else {
                // Para objetos, convertir a string compacto
                return JSON.stringify(value);
            }
        }

        // Para strings, truncar si es muy largo
        const stringValue = String(value);
        if (stringValue.length > 100) {
            return stringValue.substring(0, 97) + '...';
        }

        return stringValue;
    }

    /**
     * Formatea un único producto (útil para consultas específicas)
     * @param product Producto a formatear
     * @returns String con el producto formateado
     */
    static formatSingleProduct(product: ProductInfo): string {
        return this.formatProductContext([product]);
    }

    /**
     * Genera un resumen compacto de productos (solo nombres y precios)
     * Útil cuando hay muchos productos y se necesita una vista rápida
     * @param products Lista de productos
     * @returns String con resumen compacto
     */
    static formatCompactSummary(products: ProductInfo[]): string {
        if (!products || products.length === 0) {
            return 'No hay productos disponibles.';
        }

        let summary = 'RESUMEN DE PRODUCTOS:\n\n';

        products.forEach((product, index) => {
            const availability = product.availability ? '✓' : '✗';
            summary += `${index + 1}. ${product.name} - €${product.price.toFixed(2)} [${availability}]\n`;
        });

        return summary;
    }
}
