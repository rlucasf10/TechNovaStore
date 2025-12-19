import natural from 'natural';
import { logger } from '../utils/logger';

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
     * MEJORADO: Muchos más patrones y variaciones
     */
    private loadPatterns(): Map<string, string[]> {
        return new Map([
            // Búsqueda/Recomendación de productos - AMPLIADO
            [
                'product_search',
                [
                    // Verbos de búsqueda
                    'busco', 'buscar', 'buscando', 'comprar', 'necesito', 'quiero',
                    'me interesa', 'interesado', 'quisiera', 'deseo', 'querría',
                    // Verbos de recomendación (con y sin tildes)
                    'recomienda', 'recomiendame', 'recomendacion', 'recomiéndame',
                    'recomendación', 'recomiendas', 'recomendarme', 'sugieres',
                    'sugiere', 'sugerencia', 'aconsejas', 'aconseja',
                    // Verbos de mostrar
                    'muestra', 'muestrame', 'muéstrame', 'enseña', 'enséñame',
                    'dame', 'dime', 'ver', 'mostrar', 'enseñar',
                    // Sustantivos de productos
                    'productos', 'producto', 'artículos', 'articulos', 'cosas',
                    'opciones', 'alternativas', 'ofertas', 'catalogo', 'catálogo',
                    // Categorías de productos
                    'laptop', 'laptops', 'portátil', 'portatil', 'portátiles',
                    'ordenador', 'ordenadores', 'computadora', 'computadoras', 'pc',
                    'móvil', 'movil', 'móviles', 'celular', 'celulares', 'smartphone',
                    'tablet', 'tablets', 'tableta', 'ipad',
                    'auriculares', 'auricular', 'cascos', 'headphones', 'audífonos',
                    'teclado', 'teclados', 'keyboard',
                    'ratón', 'raton', 'ratones', 'mouse',
                    'monitor', 'monitores', 'pantalla', 'pantallas', 'display',
                    'webcam', 'cámara', 'camara', 'micrófono', 'microfono', 'micro',
                    'altavoz', 'altavoces', 'speaker', 'speakers', 'bocina',
                    'componente', 'componentes', 'hardware',
                    'procesador', 'procesadores', 'cpu',
                    'tarjeta', 'tarjetas', 'gráfica', 'grafica', 'gpu', 'nvidia', 'amd',
                    'memoria', 'memorias', 'ram',
                    'disco', 'discos', 'ssd', 'hdd', 'almacenamiento',
                    'impresora', 'impresoras', 'escáner', 'scanner',
                    'router', 'routers', 'switch', 'cable', 'cables', 'hub',
                    // Contextos de uso
                    'gaming', 'gamer', 'juegos', 'trabajo', 'oficina', 'estudio',
                    'diseño', 'edición', 'streaming', 'programar', 'programación',
                    // Palabras clave de tienda
                    'technovastore', 'tienda', 'venden', 'vendéis', 'tienen'
                ]
            ],

            // Información de productos - AMPLIADO
            [
                'product_info',
                [
                    'información', 'informacion', 'info', 'detalles', 'detalle',
                    'características', 'caracteristicas', 'especificaciones', 'specs',
                    'ficha', 'técnica', 'tecnica', 'descripción', 'descripcion',
                    'precio', 'precios', 'costo', 'coste', 'vale', 'valen',
                    'cuánto', 'cuanto', 'cuesta', 'cuestan',
                    'disponible', 'disponibilidad', 'stock', 'existencias',
                    'hay', 'tienen', 'tenéis', 'queda', 'quedan',
                    'compatible', 'compatibilidad', 'funciona con',
                    'dimensiones', 'peso', 'tamaño', 'color', 'colores',
                    'garantía', 'garantia', 'warranty'
                ]
            ],

            // Saludos - AMPLIADO
            [
                'greeting',
                [
                    'hola', 'ola', 'hi', 'hello', 'hey', 'buenas', 'buenos',
                    'qué tal', 'que tal', 'cómo estás', 'como estas',
                    'buen día', 'buen dia', 'buenos días', 'buenos dias',
                    'buenas tardes', 'buenas noches', 'saludos', 'wenas',
                    'qué onda', 'que onda', 'qué hay', 'que hay'
                ]
            ],

            // Despedidas - AMPLIADO
            [
                'goodbye',
                [
                    'adiós', 'adios', 'hasta luego', 'hasta pronto', 'hasta mañana',
                    'chao', 'chau', 'bye', 'byebye', 'nos vemos', 'me voy',
                    'gracias', 'muchas gracias', 'thank you', 'thanks',
                    'perfecto', 'genial', 'vale', 'ok', 'de acuerdo',
                    'eso es todo', 'nada más', 'nada mas'
                ]
            ],

            // Solicitud de soporte - AMPLIADO
            [
                'support_request',
                [
                    'ayuda', 'ayúdame', 'ayudame', 'help', 'socorro',
                    'problema', 'problemas', 'issue', 'error', 'fallo', 'bug',
                    'no funciona', 'no va', 'no anda', 'roto', 'estropeado',
                    'soporte', 'support', 'técnico', 'tecnico', 'asistencia',
                    'contactar', 'contacto', 'llamar', 'email', 'teléfono',
                    'humano', 'persona', 'agente', 'operador', 'representante',
                    'reclamo', 'reclamación', 'queja', 'quejarme', 'denunciar',
                    'devolver', 'devolución', 'devolucion', 'reembolso', 'refund',
                    'no entiendo', 'confundido', 'perdido', 'no sé', 'no se'
                ]
            ],

            // Consulta de pedido - AMPLIADO
            [
                'order_inquiry',
                [
                    'pedido', 'pedidos', 'orden', 'ordenes', 'order',
                    'compra', 'compras', 'purchase',
                    'rastreo', 'rastrear', 'tracking', 'track',
                    'seguimiento', 'seguir', 'localizar', 'ubicar',
                    'envío', 'envio', 'envíos', 'shipping', 'paquete',
                    'entrega', 'entregar', 'delivery', 'llegar', 'llegará',
                    'dónde', 'donde', 'cuándo', 'cuando', 'estado',
                    'mi pedido', 'mi compra', 'mi paquete', 'mi envío'
                ]
            ],

            // Comparación - AMPLIADO
            [
                'price_comparison',
                [
                    'comparar', 'comparación', 'comparacion', 'compare',
                    'diferencia', 'diferencias', 'versus', 'vs', 'contra',
                    'mejor', 'mejores', 'peor', 'peores',
                    'más barato', 'mas barato', 'económico', 'economico', 'barato',
                    'más caro', 'mas caro', 'premium', 'gama alta',
                    'cuál es mejor', 'cual es mejor', 'cuál conviene', 'cual conviene',
                    'qué me recomiendas entre', 'entre estos', 'entre estas',
                    'opciones', 'alternativas', 'elegir', 'decidir'
                ]
            ],

            // Información de la tienda - NUEVO
            [
                'store_info',
                [
                    'technovastore', 'tienda', 'empresa', 'negocio', 'compañía',
                    'quiénes sois', 'quienes sois', 'quién eres', 'quien eres',
                    'qué es', 'que es', 'sobre', 'acerca de', 'información de',
                    'horario', 'horarios', 'abierto', 'cerrado', 'abren', 'cierran',
                    'dirección', 'direccion', 'ubicación', 'ubicacion', 'dónde están',
                    'envíos', 'envios', 'métodos de pago', 'formas de pago',
                    'devoluciones', 'política', 'politica', 'términos', 'condiciones'
                ]
            ],

            // Ofertas y promociones - NUEVO
            [
                'offers',
                [
                    'oferta', 'ofertas', 'promoción', 'promocion', 'promociones',
                    'descuento', 'descuentos', 'rebaja', 'rebajas', 'sale',
                    'black friday', 'cyber monday', 'navidad', 'reyes',
                    'cupón', 'cupon', 'código', 'codigo', 'voucher',
                    'gratis', 'regalo', 'regalos', 'sorteo', 'concurso',
                    'barato', 'baratos', 'económico', 'economico', 'ganga'
                ]
            ]
        ]);
    }

    /**
     * Reconoce la intención del texto proporcionado
     * MEJORADO: Mejor lógica de matching y patrones regex adicionales
     */
    public recognizeIntent(text: string): SimpleFallbackIntent {
        const textLower = text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Normalizar acentos
        const tokens = this.tokenizer.tokenize(textLower) || [];

        // PASO 1: Verificar patrones regex de alta prioridad
        const regexMatch = this.matchRegexPatterns(textLower);
        if (regexMatch.confidence > 0.7) {
            const entities = this.extractSimpleEntities(text.toLowerCase(), tokens);
            return { ...regexMatch, entities };
        }

        // PASO 2: Matching por keywords
        let bestMatch = { name: 'unknown', confidence: 0 };

        for (const [intent, keywords] of this.intentPatterns) {
            let exactMatches = 0;
            let partialMatches = 0;
            let phraseMatches = 0;

            for (const keyword of keywords) {
                // Normalizar keyword también
                const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                // Buscar frases completas en el texto (mayor peso)
                if (normalizedKeyword.includes(' ') && textLower.includes(normalizedKeyword)) {
                    phraseMatches++;
                    continue;
                }

                // Buscar en el texto completo
                if (textLower.includes(normalizedKeyword)) {
                    exactMatches++;
                    continue;
                }

                // Buscar en tokens individuales con fuzzy matching
                for (const token of tokens) {
                    if (token === normalizedKeyword) {
                        exactMatches++;
                        break;
                    } else if (normalizedKeyword.length >= 4 && token.length >= 3) {
                        // Fuzzy matching para palabras similares
                        if (token.includes(normalizedKeyword) || normalizedKeyword.includes(token)) {
                            partialMatches++;
                            break;
                        }
                        // Distancia de Levenshtein simple para typos
                        if (this.isSimilar(token, normalizedKeyword)) {
                            partialMatches += 0.5;
                            break;
                        }
                    }
                }
            }

            // Calcular confidence con pesos mejorados
            const totalMatches = (phraseMatches * 2) + exactMatches + (partialMatches * 0.5);
            let confidence = totalMatches > 0
                ? Math.min(0.4 + (totalMatches * 0.2), 1.0)
                : 0;

            // Boost para intenciones específicas según contexto
            if (intent === 'product_search' && totalMatches >= 1) {
                confidence = Math.min(confidence + 0.2, 1.0);
            }
            if (intent === 'greeting' && tokens.length <= 3) {
                confidence = Math.min(confidence + 0.3, 1.0);
            }
            if (intent === 'goodbye' && tokens.length <= 5) {
                confidence = Math.min(confidence + 0.2, 1.0);
            }

            if (confidence > bestMatch.confidence) {
                bestMatch = { name: intent, confidence };
            }
        }

        // PASO 3: Si no hay match claro, usar heurísticas
        if (bestMatch.confidence < 0.5) {
            const heuristicMatch = this.applyHeuristics(textLower, tokens);
            if (heuristicMatch.confidence > bestMatch.confidence) {
                bestMatch = heuristicMatch;
            }
        }

        // Extraer entidades del texto
        const entities = this.extractSimpleEntities(text.toLowerCase(), tokens);

        logger.debug('Intención reconocida por SimpleFallbackRecognizer', { 
            textPreview: text.substring(0, 50), 
            intent: bestMatch.name, 
            confidence: bestMatch.confidence 
        });

        return {
            ...bestMatch,
            entities
        };
    }

    /**
     * Verifica patrones regex de alta prioridad
     */
    private matchRegexPatterns(text: string): { name: string; confidence: number } {
        // Patrones de alta prioridad con regex
        const patterns: Array<{ pattern: RegExp; intent: string; confidence: number }> = [
            // Recomendaciones de productos
            { pattern: /recomi[eé]nd(a|ame|as)?\s*(\d+\s*)?(productos?|algo)?/i, intent: 'product_search', confidence: 0.9 },
            { pattern: /mu[eé]str(a|ame)?\s*(\d+\s*)?(productos?)?/i, intent: 'product_search', confidence: 0.9 },
            { pattern: /dame\s*(\d+\s*)?(productos?|opciones?)?/i, intent: 'product_search', confidence: 0.85 },
            { pattern: /busco\s+(un|una|unos|unas|alg[uú]n)?/i, intent: 'product_search', confidence: 0.85 },
            { pattern: /necesito\s+(un|una|comprar)?/i, intent: 'product_search', confidence: 0.85 },
            { pattern: /quiero\s+(un|una|comprar|ver)?/i, intent: 'product_search', confidence: 0.8 },
            { pattern: /\d+\s+productos?\s+(de\s+)?technovastore/i, intent: 'product_search', confidence: 0.95 },
            { pattern: /qu[eé]\s+(productos?|cosas?)\s+(tienes?|vend[eé]is?|hay)/i, intent: 'product_search', confidence: 0.85 },
            
            // Saludos
            { pattern: /^(hola|hi|hey|buenas?|buenos?|saludos?)[\s!.,]*$/i, intent: 'greeting', confidence: 0.95 },
            { pattern: /^(qu[eé]\s+tal|c[oó]mo\s+est[aá]s?)[\s?!]*$/i, intent: 'greeting', confidence: 0.9 },
            
            // Despedidas
            { pattern: /^(adi[oó]s|chao?|bye|hasta\s+luego)[\s!.,]*$/i, intent: 'goodbye', confidence: 0.95 },
            { pattern: /^(gracias|muchas\s+gracias|thanks?)[\s!.,]*$/i, intent: 'goodbye', confidence: 0.85 },
            
            // Pedidos
            { pattern: /mi\s+(pedido|compra|paquete|env[ií]o)/i, intent: 'order_inquiry', confidence: 0.9 },
            { pattern: /(d[oó]nde|cu[aá]ndo)\s+(est[aá]|llega)/i, intent: 'order_inquiry', confidence: 0.85 },
            { pattern: /rastr(eo|ear)|tracking|seguimiento/i, intent: 'order_inquiry', confidence: 0.9 },
            
            // Soporte
            { pattern: /(problema|error|no\s+funciona|ayuda)/i, intent: 'support_request', confidence: 0.85 },
            { pattern: /(hablar|contactar)\s+(con\s+)?(humano|persona|agente)/i, intent: 'support_request', confidence: 0.95 },
            { pattern: /(queja|reclamo|devol(ver|uci[oó]n))/i, intent: 'support_request', confidence: 0.9 },
            
            // Comparación
            { pattern: /(comparar?|vs|versus|diferencia)/i, intent: 'price_comparison', confidence: 0.85 },
            { pattern: /cu[aá]l\s+(es\s+)?mejor/i, intent: 'price_comparison', confidence: 0.9 },
            
            // Info de tienda
            { pattern: /qu[eé]\s+es\s+technovastore/i, intent: 'store_info', confidence: 0.95 },
            { pattern: /(horario|direcci[oó]n|ubicaci[oó]n)/i, intent: 'store_info', confidence: 0.85 },
            
            // Ofertas
            { pattern: /(oferta|descuento|promoci[oó]n|rebaja)/i, intent: 'offers', confidence: 0.85 },
            { pattern: /black\s*friday|cyber\s*monday/i, intent: 'offers', confidence: 0.9 },
            
            // Precios
            { pattern: /cu[aá]nto\s+(cuesta|vale|es)/i, intent: 'product_info', confidence: 0.85 },
            { pattern: /precio\s+(de|del)/i, intent: 'product_info', confidence: 0.85 },
        ];

        for (const { pattern, intent, confidence } of patterns) {
            if (pattern.test(text)) {
                return { name: intent, confidence };
            }
        }

        return { name: 'unknown', confidence: 0 };
    }

    /**
     * Aplica heurísticas cuando no hay match claro
     */
    private applyHeuristics(text: string, tokens: string[]): { name: string; confidence: number } {
        // Si menciona números + productos, probablemente quiere productos
        if (/\d+/.test(text) && /(producto|laptop|monitor|teclado|auricular)/i.test(text)) {
            return { name: 'product_search', confidence: 0.7 };
        }

        // Si es muy corto y tiene signos de interrogación, probablemente es pregunta
        if (tokens.length <= 3 && text.includes('?')) {
            return { name: 'product_info', confidence: 0.5 };
        }

        // Si menciona technovastore, probablemente quiere info o productos
        if (/technovastore/i.test(text)) {
            return { name: 'product_search', confidence: 0.6 };
        }

        // Si tiene palabras de acción de compra
        if (/(comprar|adquirir|llevar|pedir)/i.test(text)) {
            return { name: 'product_search', confidence: 0.65 };
        }

        return { name: 'unknown', confidence: 0 };
    }

    /**
     * Verifica si dos strings son similares (para typos)
     */
    private isSimilar(str1: string, str2: string): boolean {
        if (Math.abs(str1.length - str2.length) > 2) return false;
        
        let differences = 0;
        const minLen = Math.min(str1.length, str2.length);
        
        for (let i = 0; i < minLen; i++) {
            if (str1[i] !== str2[i]) differences++;
            if (differences > 2) return false;
        }
        
        return differences <= 2;
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
