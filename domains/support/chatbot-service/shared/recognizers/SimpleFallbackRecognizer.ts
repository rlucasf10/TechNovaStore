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
     */
    private loadPatterns(): Map<string, string[]> {
        return new Map([
            // Búsqueda de productos
            [
                'product_search',
                [
                    'busco', 'buscar', 'comprar', 'necesito', 'me interesa',
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
            ],

            // Comparación de precios
            [
                'price_comparison',
                [
                    'comparar', 'comparación', 'precios', 'diferencia', 'mejor',
                    'más barato', 'económico', 'versus', 'vs', 'entre',
                    'cuál es mejor', 'cuál conviene', 'opciones'
                ]
            ]
        ]);
    }

    /**
     * Reconoce la intención del texto proporcionado
     */
    public recognizeIntent(text: string): SimpleFallbackIntent {
        const textLower = text.toLowerCase();
        const tokens = this.tokenizer.tokenize(textLower) || [];

        let bestMatch = { name: 'unknown', confidence: 0 };

        // Iterar sobre cada patrón de intención
        for (const [intent, keywords] of this.intentPatterns) {
            let exactMatches = 0;
            let partialMatches = 0;

            for (const keyword of keywords) {
                // Buscar en el texto completo
                if (textLower.includes(keyword)) {
                    exactMatches++;
                    continue;
                }

                // Buscar en tokens individuales
                for (const token of tokens) {
                    if (token === keyword) {
                        exactMatches++;
                        break;
                    } else if (keyword.length > 4 && token.length > 4) {
                        if (token.includes(keyword) || keyword.includes(token)) {
                            partialMatches++;
                            break;
                        }
                    }
                }
            }

            // Calcular confidence
            const totalMatches = exactMatches + (partialMatches * 0.5);
            let confidence = totalMatches > 0
                ? Math.min(0.5 + (totalMatches * 0.3), 1.0)
                : 0;

            // Boost para intenciones específicas
            if (intent === 'price_comparison' && confidence > 0) {
                confidence = Math.min(confidence + 0.35, 1.0);
            }
            if (intent === 'product_search' && totalMatches < 2) {
                confidence = confidence * 0.8;
            }

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
     */
    private extractSimpleEntities(
        text: string,
        tokens: string[]
    ): { [key: string]: string } {
        const entities: { [key: string]: string } = {};

        // Detectar categorías de productos
        const categories = [
            'laptop', 'portátil', 'ordenador', 'computadora', 'pc', 'notebook',
            'móvil', 'celular', 'smartphone', 'teléfono', 'iphone', 'android',
            'tablet', 'tableta', 'ipad',
            'auriculares', 'audífonos', 'headphones', 'altavoz', 'altavoces', 'speaker',
            'teclado', 'keyboard', 'ratón', 'mouse', 'webcam', 'micrófono',
            'monitor', 'pantalla', 'display', 'televisor', 'tv',
            'procesador', 'cpu', 'tarjeta', 'gpu', 'gráfica', 'placa',
            'memoria', 'ram', 'disco', 'ssd', 'hdd', 'almacenamiento'
        ];

        let foundCategory: string | undefined;
        let bestCategoryMatch = '';

        for (const token of tokens) {
            for (const cat of categories) {
                if (token === cat) {
                    foundCategory = cat;
                    bestCategoryMatch = cat;
                    break;
                } else if (cat.length >= 4 && token.includes(cat)) {
                    if (!foundCategory || cat.length > bestCategoryMatch.length) {
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

        // Detectar marcas comunes
        const brands = [
            'apple', 'samsung', 'hp', 'dell', 'asus', 'lenovo', 'acer', 'msi',
            'razer', 'alienware', 'microsoft', 'surface', 'huawei', 'xiaomi',
            'intel', 'amd', 'nvidia', 'corsair', 'kingston', 'crucial',
            'logitech', 'steelseries', 'hyperx', 'roccat',
            'motorola', 'nokia', 'oneplus', 'google', 'realme', 'oppo',
            'sony', 'bose', 'sennheiser', 'jbl', 'beats',
            'lg', 'benq', 'viewsonic', 'philips'
        ];

        let foundBrand: string | undefined;
        let bestBrandMatch = '';

        for (const token of tokens) {
            for (const brand of brands) {
                if (token === brand) {
                    foundBrand = brand;
                    bestBrandMatch = brand;
                    break;
                } else if (brand.length >= 3 && token.includes(brand)) {
                    if (!foundBrand || brand.length > bestBrandMatch.length) {
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

        // Detectar menciones de precio
        const pricePatterns = [
            /(\d+)\s*(euros?|€)/i,
            /(\d+)\s*(dolares?|\$|usd)/i,
            /menos\s+de\s+(\d+)/i,
            /más\s+de\s+(\d+)/i,
            /entre\s+(\d+)\s+y\s+(\d+)/i,
            /hasta\s+(\d+)/i
        ];

        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                entities['PRICE_MENTION'] = match[1];
                break;
            }
        }

        return entities;
    }
}
