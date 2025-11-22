import natural from 'natural';

export interface ExtractedKeywords {
    categories: string[];
    brands: string[];
    technicalSpecs: { [key: string]: string };
    generalKeywords: string[];
    normalizedText: string;
}

export class KeywordExtractor {
    private tokenizer: natural.WordTokenizer;

    private readonly productCategories = new Map<string, string[]>([
        ['laptop', ['laptop', 'portátil', 'ordenador portátil', 'notebook', 'ultrabook']],
        ['desktop', ['ordenador', 'pc', 'computadora', 'desktop', 'torre']],
        ['móvil', ['móvil', 'celular', 'smartphone', 'teléfono', 'iphone', 'android']],
        ['tablet', ['tablet', 'tableta', 'ipad']],
        ['monitor', ['monitor', 'pantalla', 'display']],
        ['teclado', ['teclado', 'keyboard']],
        ['ratón', ['ratón', 'mouse', 'trackpad']],
        ['auriculares', ['auriculares', 'audífonos', 'headphones', 'cascos']],
        ['almacenamiento', ['disco duro', 'ssd', 'hdd', 'pendrive', 'usb', 'memoria']],
        ['componentes', ['procesador', 'cpu', 'gpu', 'tarjeta gráfica', 'ram', 'placa base']]
    ]);

    private readonly brands = [
        'apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'asus', 'acer', 'lenovo',
        'microsoft', 'huawei', 'xiaomi', 'logitech', 'razer', 'corsair', 'kingston',
        'intel', 'amd', 'nvidia', 'gigabyte', 'msi'
    ];

    private readonly stopwords = new Set([
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no',
        'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'busco', 'buscar',
        'quiero', 'necesito', 'me', 'gustaría'
    ]);

    constructor() {
        this.tokenizer = new natural.WordTokenizer();
    }

    extractKeywords(userMessage: string): ExtractedKeywords {
        const normalizedText = this.normalizeText(userMessage);
        const categories = this.extractCategories(normalizedText);
        const brands = this.extractBrands(normalizedText);
        const technicalSpecs = this.extractTechnicalSpecs(userMessage);
        const generalKeywords = this.extractGeneralKeywords(normalizedText, categories, brands);

        return {
            categories,
            brands,
            technicalSpecs,
            generalKeywords,
            normalizedText
        };
    }

    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    private extractCategories(normalizedText: string): string[] {
        const foundCategories: string[] = [];

        for (const [category, synonyms] of this.productCategories) {
            for (const synonym of synonyms) {
                const normalizedSynonym = this.normalizeText(synonym);
                if (normalizedText.includes(normalizedSynonym)) {
                    foundCategories.push(category);
                    break;
                }
            }
        }

        return [...new Set(foundCategories)];
    }

    private extractBrands(normalizedText: string): string[] {
        const foundBrands: string[] = [];

        for (const brand of this.brands) {
            const normalizedBrand = this.normalizeText(brand);
            if (normalizedText.includes(normalizedBrand)) {
                foundBrands.push(brand);
            }
        }

        return [...new Set(foundBrands)];
    }

    private extractTechnicalSpecs(text: string): { [key: string]: string } {
        const specs: { [key: string]: string } = {};
        const patterns = [
            { pattern: /(\d+)\s*(gb|mb)\s*(de\s*)?(ram|memoria)/gi, type: 'ram' },
            { pattern: /(\d+)\s*(gb|tb)\s*(de\s*)?(ssd|hdd|almacenamiento)/gi, type: 'storage' },
            { pattern: /(intel|amd|ryzen|core)\s*(i\d|ryzen\s*\d|m\d)[\w\s-]*/gi, type: 'processor' },
            { pattern: /(\d+\.?\d*)\s*(pulgadas|"|inch|hz)/gi, type: 'screen' }
        ];

        for (const { pattern, type } of patterns) {
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

    private extractGeneralKeywords(
        normalizedText: string,
        categories: string[],
        brands: string[]
    ): string[] {
        const tokens = this.tokenizer.tokenize(normalizedText) || [];

        const filteredTokens = tokens.filter(token =>
            token.length > 2 &&
            !this.stopwords.has(token) &&
            !this.isNumber(token)
        );

        const allKeywords = [
            ...filteredTokens,
            ...categories,
            ...brands
        ];

        return [...new Set(allKeywords)];
    }

    private isNumber(str: string): boolean {
        return !isNaN(Number(str));
    }
}
