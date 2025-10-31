import natural from 'natural';

/**
 * Interfaz que representa una intención reconocida por el sistema de fallback
 */
export interface SimpleFallbackIntent {
    name: string;
    confidence: number;
    entities: { [key: string]: string };
}

/**
 * SimpleFallbackRecognizer - Sistema de fallback simple para reconocimiento de intenciones
 * 
 * Esta clase proporciona un sistema de respaldo cuando Ollama no está disponible.
 * Utiliza la librería 'natural' de Node.js para tokenización y matching de patrones básicos.
 * NO depende de Python ni spaCy.
 * 
 * Funcionalidades:
 * - Reconocimiento de intenciones básicas mediante matching de keywords
 * - Extracción simple de entidades (categorías de productos, marcas)
 * - Tokenización de texto en español
 */
export class SimpleFallbackRecognizer {
    private tokenizer: natural.WordTokenizer;
    private intentPatterns: Map<string, string[]>;

    constructor() {
        // Inicializar tokenizador de palabras
        this.tokenizer = new natural.WordTokenizer();

        // Cargar patrones de intenciones predefinidos
        this.intentPatterns = this.loadPatterns();
    }

    /**
     * Carga los patrones de intenciones con sus keywords asociadas
     * 
     * @returns Map con nombre de intención y array de keywords
     */
    private loadPatterns(): Map<string, string[]> {
        return new Map([
            // Búsqueda de productos
            [
                'product_search',
                [
                    'busco', 'buscar', 'quiero', 'comprar', 'necesito', 'me interesa',
                    'laptop', 'portátil', 'ordenador', 'móvil', 'celular', 'tablet',
                    'auriculares', 'teclado', 'ratón', 'mouse', 'monitor', 'pantalla',
                    'componente', 'procesador', 'tarjeta', 'memoria', 'disco'
                ]
            ],

            // Información de productos
            [
                'product_info',
                [
                    'información', 'info', 'características', 'especificaciones',
                    'detalles', 'precio', 'costo', 'cuánto', 'cuesta', 'vale', 'disponible',
                    'stock', 'hay', 'tienen', 'compatible', 'compatibilidad'
                ]
            ],

            // Saludos
            [
                'greeting',
                [
                    'hola', 'buenos', 'buenas', 'saludos', 'hey', 'qué tal',
                    'buen día', 'buenas tardes', 'buenas noches'
                ]
            ],

            // Despedidas
            [
                'goodbye',
                [
                    'adiós', 'hasta', 'luego', 'chao', 'gracias', 'bye',
                    'nos vemos', 'hasta pronto', 'hasta luego'
                ]
            ],

            // Solicitud de soporte
            [
                'support_request',
                [
                    'ayuda', 'problema', 'soporte', 'contactar', 'humano',
                    'agente', 'asistencia', 'no entiendo', 'no funciona',
                    'error', 'fallo', 'reclamo', 'queja'
                ]
            ],

            // Consulta de pedido
            [
                'order_inquiry',
                [
                    'pedido', 'orden', 'compra', 'rastreo', 'rastrear', 'seguimiento',
                    'envío', 'entrega', 'dónde', 'cuándo', 'llega',
                    'estado', 'tracking'
                ]
            ]
        ]);
    }

    /**
     * Reconoce la intención del texto proporcionado
     * 
     * Proceso:
     * 1. Tokeniza el texto en palabras individuales
     * 2. Compara tokens contra patrones de cada intención
     * 3. Calcula confidence basado en número de matches
     * 4. Retorna la intención con mayor confidence
     * 
     * @param text - Texto del usuario a analizar
     * @returns SimpleFallbackIntent con nombre, confidence y entidades
     */
    public recognizeIntent(text: string): SimpleFallbackIntent {
        const textLower = text.toLowerCase();
        const tokens = this.tokenizer.tokenize(textLower) || [];

        let bestMatch = { name: 'unknown', confidence: 0 };

        // Iterar sobre cada patrón de intención
        for (const [intent, keywords] of this.intentPatterns) {
            // Contar cuántas keywords coinciden exactamente con los tokens
            let exactMatches = 0;
            let partialMatches = 0;

            for (const keyword of keywords) {
                for (const token of tokens) {
                    // Coincidencia exacta
                    if (token === keyword) {
                        exactMatches++;
                        break;
                    }
                    // Coincidencia parcial (solo para palabras largas)
                    else if (keyword.length > 4 && token.length > 4) {
                        if (token.includes(keyword) || keyword.includes(token)) {
                            partialMatches++;
                            break;
                        }
                    }
                }
            }

            // Calcular confidence: exactas valen más que parciales
            const totalMatches = exactMatches + (partialMatches * 0.5);
            const confidence = totalMatches > 0
                ? Math.min(totalMatches / 2, 1.0) // Normalizar a máximo 1.0
                : 0;

            // Actualizar mejor match si este tiene mayor confidence
            if (confidence > bestMatch.confidence) {
                bestMatch = { name: intent, confidence };
            }
        }

        // Extraer entidades del texto
        const entities = this.extractSimpleEntities(textLower, tokens);

        return {
            ...bestMatch,
            entities
        };
    }

    /**
     * Extrae entidades básicas del texto (categorías de productos, marcas)
     * 
     * Este método implementa extracción simple de entidades sin NLP complejo:
     * - Detecta categorías de productos mediante matching de keywords
     * - Detecta marcas comunes de tecnología
     * - Extrae menciones de precio
     * - NO requiere Python, spaCy ni modelos de ML
     * 
     * @param text - Texto en minúsculas
     * @param tokens - Array de tokens del texto
     * @returns Objeto con entidades encontradas (PRODUCT_TYPE, BRAND, PRICE_MENTION)
     */
    private extractSimpleEntities(
        text: string,
        tokens: string[]
    ): { [key: string]: string } {
        const entities: { [key: string]: string } = {};

        // ===== DETECTAR CATEGORÍAS DE PRODUCTOS =====
        // Lista exhaustiva de categorías de productos tecnológicos
        const categories = [
            // Computadoras
            'laptop', 'portátil', 'ordenador', 'computadora', 'pc', 'notebook',
            // Móviles
            'móvil', 'celular', 'smartphone', 'teléfono', 'iphone', 'android',
            // Tablets
            'tablet', 'tableta', 'ipad',
            // Audio
            'auriculares', 'audífonos', 'headphones', 'altavoz', 'altavoces', 'speaker',
            // Periféricos
            'teclado', 'keyboard', 'ratón', 'mouse', 'webcam', 'micrófono',
            // Monitores
            'monitor', 'pantalla', 'display', 'televisor', 'tv',
            // Componentes
            'procesador', 'cpu', 'tarjeta', 'gpu', 'gráfica', 'placa',
            'memoria', 'ram', 'disco', 'ssd', 'hdd', 'almacenamiento',
            'fuente', 'alimentación', 'refrigeración', 'ventilador',
            // Redes
            'router', 'switch', 'modem', 'wifi', 'ethernet',
            // Gaming
            'consola', 'playstation', 'xbox', 'nintendo', 'joystick', 'gamepad',
            // Impresoras
            'impresora', 'escáner', 'multifunción'
        ];

        // Buscar coincidencia de categoría en los tokens
        let foundCategory: string | undefined;
        let bestCategoryMatch = '';

        for (const token of tokens) {
            for (const cat of categories) {
                // Coincidencia exacta (prioridad máxima)
                if (token === cat) {
                    foundCategory = cat;
                    bestCategoryMatch = cat;
                    break;
                }
                // El token contiene la categoría completa (mínimo 4 caracteres)
                else if (cat.length >= 4 && token.includes(cat)) {
                    if (!foundCategory || cat.length > bestCategoryMatch.length) {
                        foundCategory = token;
                        bestCategoryMatch = cat;
                    }
                }
                // La categoría contiene el token completo (mínimo 4 caracteres)
                else if (token.length >= 4 && cat.includes(token)) {
                    if (!foundCategory || token.length > bestCategoryMatch.length) {
                        foundCategory = token;
                        bestCategoryMatch = cat;
                    }
                }
            }
            if (foundCategory && token === bestCategoryMatch) break;
        }

        if (foundCategory) {
            entities['PRODUCT_TYPE'] = bestCategoryMatch || foundCategory;
        }

        // ===== DETECTAR MARCAS COMUNES =====
        // Lista exhaustiva de marcas de tecnología
        const brands = [
            // Computadoras y laptops
            'apple', 'samsung', 'hp', 'dell', 'asus', 'lenovo', 'acer', 'msi',
            'razer', 'alienware', 'microsoft', 'surface', 'huawei', 'xiaomi',
            // Componentes
            'intel', 'amd', 'nvidia', 'corsair', 'kingston', 'crucial', 'western',
            'seagate', 'sandisk', 'gigabyte', 'evga', 'zotac',
            // Periféricos
            'logitech', 'razer', 'steelseries', 'hyperx', 'roccat', 'cooler master',
            // Móviles
            'motorola', 'nokia', 'oneplus', 'google', 'realme', 'oppo', 'vivo',
            'honor', 'zte', 'blackberry',
            // Audio
            'sony', 'bose', 'sennheiser', 'jbl', 'beats', 'audio-technica',
            // Monitores y TV
            'lg', 'benq', 'viewsonic', 'philips', 'panasonic', 'toshiba',
            // Redes
            'tp-link', 'netgear', 'linksys', 'cisco', 'd-link', 'ubiquiti'
        ];

        // Buscar coincidencia de marca en los tokens
        let foundBrand: string | undefined;
        let bestBrandMatch = '';

        for (const token of tokens) {
            for (const brand of brands) {
                // Coincidencia exacta (prioridad máxima)
                if (token === brand) {
                    foundBrand = brand;
                    bestBrandMatch = brand;
                    break;
                }
                // El token contiene la marca completa (mínimo 3 caracteres)
                else if (brand.length >= 3 && token.includes(brand)) {
                    if (!foundBrand || brand.length > bestBrandMatch.length) {
                        foundBrand = token;
                        bestBrandMatch = brand;
                    }
                }
                // La marca contiene el token completo (mínimo 3 caracteres)
                else if (token.length >= 3 && brand.includes(token)) {
                    if (!foundBrand || token.length > bestBrandMatch.length) {
                        foundBrand = token;
                        bestBrandMatch = brand;
                    }
                }
            }
            if (foundBrand && token === bestBrandMatch) break;
        }

        if (foundBrand) {
            entities['BRAND'] = bestBrandMatch || foundBrand;
        }

        // ===== DETECTAR MENCIONES DE PRECIO =====
        // Patrones para detectar precios en diferentes formatos
        const pricePatterns = [
            /(\d+)\s*(euros?|€)/i,           // "500 euros", "500€"
            /(\d+)\s*(dolares?|\$|usd)/i,    // "500 dólares", "$500"
            /menos\s+de\s+(\d+)/i,           // "menos de 500"
            /más\s+de\s+(\d+)/i,             // "más de 500"
            /entre\s+(\d+)\s+y\s+(\d+)/i,   // "entre 500 y 1000"
            /hasta\s+(\d+)/i,                // "hasta 500"
            /alrededor\s+de\s+(\d+)/i        // "alrededor de 500"
        ];

        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                // Extraer el primer número encontrado
                entities['PRICE_MENTION'] = match[1];
                break;
            }
        }

        return entities;
    }

    /**
     * Genera una respuesta de fallback simple basada en la intención reconocida
     * 
     * @param intent - Intención reconocida
     * @returns Mensaje de respuesta apropiado
     */
    public generateFallbackResponse(
        intent: SimpleFallbackIntent
    ): string {
        const responses: { [key: string]: string } = {
            'product_search': this.generateProductSearchResponse(intent),
            'product_info': this.generateProductInfoResponse(intent),
            'greeting': '¡Hola! Bienvenido a TechNovaStore. ¿En qué puedo ayudarte hoy?',
            'goodbye': '¡Gracias por visitar TechNovaStore! Que tengas un excelente día.',
            'support_request': 'Entiendo que necesitas ayuda. Por favor, contacta con nuestro equipo de soporte en soporte@technovastore.com o llama al +34 900 123 456.',
            'order_inquiry': 'Para consultar el estado de tu pedido, por favor ingresa tu número de orden en la sección "Mis Pedidos" de tu cuenta.',
            'unknown': 'Disculpa, no estoy seguro de entender tu consulta. ¿Podrías reformularla o ser más específico? También puedes contactar con nuestro equipo de soporte.'
        };

        const response = responses[intent.name] || responses['unknown'];

        return `${response}\n\n_Nota: Modo básico activo. Algunas funciones limitadas._`;
    }

    /**
     * Genera respuesta específica para búsqueda de productos
     */
    private generateProductSearchResponse(intent: SimpleFallbackIntent): string {
        const productType = intent.entities['PRODUCT_TYPE'];
        const brand = intent.entities['BRAND'];

        let response = 'Puedo ayudarte a buscar productos. ';

        if (productType && brand) {
            response += `Veo que buscas ${productType} de la marca ${brand}. `;
        } else if (productType) {
            response += `Veo que buscas ${productType}. `;
        } else if (brand) {
            response += `Veo que te interesa la marca ${brand}. `;
        }

        response += 'Por favor, visita nuestra página de productos o usa el buscador para ver nuestro catálogo completo.';

        return response;
    }

    /**
     * Genera respuesta específica para información de productos
     */
    private generateProductInfoResponse(intent: SimpleFallbackIntent): string {
        const productType = intent.entities['PRODUCT_TYPE'];

        let response = 'Para obtener información detallada sobre productos, ';

        if (productType) {
            response += `incluyendo ${productType}, `;
        }

        response += 'te recomiendo visitar la página específica del producto donde encontrarás especificaciones completas, precios y disponibilidad.';

        return response;
    }
}
