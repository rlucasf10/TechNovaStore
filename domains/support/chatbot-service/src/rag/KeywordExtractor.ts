import natural from 'natural';

/**
 * Interfaz para los keywords extraídos del mensaje del usuario
 */
export interface ExtractedKeywords {
    // Categorías de productos identificadas
    categories: string[];
    // Marcas mencionadas
    brands: string[];
    // Especificaciones técnicas mencionadas
    technicalSpecs: { [key: string]: string };
    // Keywords generales para búsqueda
    generalKeywords: string[];
    // Texto original normalizado
    normalizedText: string;
}

/**
 * Clase para extraer keywords, categorías, marcas y especificaciones técnicas
 * de los mensajes de usuario usando la librería 'natural' de Node.js
 */
export class KeywordExtractor {
    private tokenizer: natural.WordTokenizer;

    // Diccionarios de categorías de productos (en español)
    private readonly productCategories = new Map<string, string[]>([
        ['laptop', ['laptop', 'portátil', 'ordenador portátil', 'notebook', 'ultrabook', 'chromebook']],
        ['desktop', ['ordenador', 'pc', 'computadora', 'desktop', 'torre']],
        ['móvil', ['móvil', 'celular', 'smartphone', 'teléfono', 'iphone', 'android']],
        ['tablet', ['tablet', 'tableta', 'ipad']],
        ['monitor', ['monitor', 'pantalla', 'display']],
        ['teclado', ['teclado', 'keyboard']],
        ['ratón', ['ratón', 'mouse', 'trackpad']],
        ['auriculares', ['auriculares', 'audífonos', 'headphones', 'cascos']],
        ['impresora', ['impresora', 'printer', 'escáner', 'scanner']],
        ['cámara', ['cámara', 'webcam', 'camera']],
        ['almacenamiento', ['disco duro', 'ssd', 'hdd', 'pendrive', 'usb', 'memoria']],
        ['componentes', ['procesador', 'cpu', 'gpu', 'tarjeta gráfica', 'ram', 'placa base', 'motherboard']],
        ['red', ['router', 'switch', 'wifi', 'ethernet', 'modem']],
        ['software', ['software', 'programa', 'aplicación', 'licencia', 'windows', 'office']]
    ]);

    // Diccionario de marcas comunes
    private readonly brands = [
        'apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'asus', 'acer', 'lenovo',
        'microsoft', 'huawei', 'xiaomi', 'oppo', 'oneplus', 'google', 'motorola',
        'logitech', 'razer', 'corsair', 'kingston', 'sandisk', 'seagate', 'wd',
        'intel', 'amd', 'nvidia', 'gigabyte', 'msi', 'asrock', 'evga',
        'tp-link', 'netgear', 'linksys', 'cisco', 'canon', 'epson', 'brother'
    ];

    // Patrones para especificaciones técnicas
    private readonly techSpecPatterns = [
        // Memoria RAM
        { pattern: /(\d+)\s*(gb|mb)\s*(de\s*)?(ram|memoria)/gi, type: 'ram' },
        // Almacenamiento
        { pattern: /(\d+)\s*(gb|tb)\s*(de\s*)?(ssd|hdd|almacenamiento|disco)/gi, type: 'storage' },
        // Procesador
        { pattern: /(intel|amd|ryzen|core)\s*(i\d|ryzen\s*\d|m\d)[\w\s-]*/gi, type: 'processor' },
        // Pantalla
        { pattern: /(\d+\.?\d*)\s*(pulgadas|"|inch|hz)/gi, type: 'screen' },
        // Tarjeta gráfica
        { pattern: /(nvidia|amd|geforce|radeon|gtx|rtx)\s*[\w\s-]*/gi, type: 'gpu' },
        // Sistema operativo
        { pattern: /(windows|linux|macos|android|ios)\s*[\d\w\s]*/gi, type: 'os' },
        // Conectividad
        { pattern: /(wifi|bluetooth|usb|hdmi|ethernet|5g|4g)\s*[\d\w\s.]*/gi, type: 'connectivity' }
    ];

    // Palabras vacías en español (stopwords)
    private readonly stopwords = new Set([
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
        'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
        'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
        'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
        'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo',
        'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
        'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
        'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
        'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
        'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
        'busco', 'buscar', 'quiero', 'necesito', 'me', 'gustaría', 'quisiera',
        'estoy', 'buscando', 'interesa', 'interesado', 'comprar', 'adquirir'
    ]);

    constructor() {
        this.tokenizer = new natural.WordTokenizer();
    }

    /**
     * Extrae keywords, categorías, marcas y especificaciones técnicas del mensaje del usuario
     * @param userMessage Mensaje del usuario
     * @returns Objeto con los keywords extraídos
     */
    extractKeywords(userMessage: string): ExtractedKeywords {
        // Normalizar texto
        const normalizedText = this.normalizeText(userMessage);

        // Extraer categorías de productos
        const categories = this.extractCategories(normalizedText);

        // Extraer marcas
        const brands = this.extractBrands(normalizedText);

        // Extraer especificaciones técnicas
        const technicalSpecs = this.extractTechnicalSpecs(userMessage);

        // Extraer keywords generales
        const generalKeywords = this.extractGeneralKeywords(normalizedText, categories, brands);

        return {
            categories,
            brands,
            technicalSpecs,
            generalKeywords,
            normalizedText
        };
    }

    /**
     * Normaliza el texto: lowercase, elimina acentos, etc.
     */
    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .trim();
    }

    /**
     * Extrae categorías de productos del texto
     */
    private extractCategories(normalizedText: string): string[] {
        const foundCategories: string[] = [];

        for (const [category, synonyms] of this.productCategories) {
            for (const synonym of synonyms) {
                const normalizedSynonym = this.normalizeText(synonym);
                if (normalizedText.includes(normalizedSynonym)) {
                    foundCategories.push(category);
                    break; // Solo agregar la categoría una vez
                }
            }
        }

        return [...new Set(foundCategories)]; // Eliminar duplicados
    }

    /**
     * Extrae marcas mencionadas en el texto
     */
    private extractBrands(normalizedText: string): string[] {
        const foundBrands: string[] = [];

        for (const brand of this.brands) {
            const normalizedBrand = this.normalizeText(brand);
            if (normalizedText.includes(normalizedBrand)) {
                foundBrands.push(brand);
            }
        }

        return [...new Set(foundBrands)]; // Eliminar duplicados
    }

    /**
     * Extrae especificaciones técnicas usando patrones regex
     */
    private extractTechnicalSpecs(text: string): { [key: string]: string } {
        const specs: { [key: string]: string } = {};

        for (const { pattern, type } of this.techSpecPatterns) {
            const matches = text.matchAll(pattern);
            const values: string[] = [];

            for (const match of matches) {
                values.push(match[0].trim());
            }

            if (values.length > 0) {
                specs[type] = values.join(', ');
            }
        }

        return specs;
    }

    /**
     * Extrae keywords generales para búsqueda, excluyendo stopwords
     */
    private extractGeneralKeywords(
        normalizedText: string,
        categories: string[],
        brands: string[]
    ): string[] {
        // Tokenizar el texto
        const tokens = this.tokenizer.tokenize(normalizedText) || [];

        // Filtrar stopwords y tokens muy cortos
        const filteredTokens = tokens.filter(token =>
            token.length > 2 &&
            !this.stopwords.has(token) &&
            !this.isNumber(token)
        );

        // Combinar con categorías y marcas encontradas
        const allKeywords = [
            ...filteredTokens,
            ...categories,
            ...brands
        ];

        // Eliminar duplicados y retornar
        return [...new Set(allKeywords)];
    }

    /**
     * Verifica si un string es un número
     */
    private isNumber(str: string): boolean {
        return !isNaN(Number(str));
    }

    /**
     * Obtiene las categorías disponibles
     */
    getAvailableCategories(): string[] {
        return Array.from(this.productCategories.keys());
    }

    /**
     * Obtiene las marcas disponibles
     */
    getAvailableBrands(): string[] {
        return [...this.brands];
    }
}
