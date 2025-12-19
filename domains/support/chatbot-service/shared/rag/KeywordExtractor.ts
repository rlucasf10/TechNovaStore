/**
 * KEYWORD EXTRACTOR PROFESIONAL - TechNovaStore RAG System
 * 
 * Sistema de extracción de keywords de nivel empresarial:
 * - Fuzzy matching para corrección de errores ortográficos
 * - Expansión semántica de queries
 * - Detección de intención multi-nivel
 * - Extracción de especificaciones técnicas avanzada
 * - Soporte multiidioma (ES/EN)
 * - Sistema de sinónimos exhaustivo
 */

import natural from 'natural';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface ExtractedKeywords {
  categories: string[];
  brands: string[];
  technicalSpecs: { [key: string]: string };
  generalKeywords: string[];
  expandedKeywords: string[];
  normalizedText: string;
  intent: IntentType;
  subIntent?: SubIntentType;
  priceRange?: PriceRange;
  preferences: UserPreferences;
  confidence: number;
}

export interface PriceRange {
  min?: number;
  max?: number;
  currency: 'EUR' | 'USD';
  flexibility: 'strict' | 'flexible';
}

export interface UserPreferences {
  usage: string[];
  features: string[];
  quality: 'budget' | 'midrange' | 'premium' | 'any';
  portability: 'portable' | 'desktop' | 'any';
  aesthetic: string[];
}


export type IntentType = 
  | 'search' 
  | 'recommendation' 
  | 'comparison' 
  | 'info' 
  | 'price_check'
  | 'availability'
  | 'support'
  | 'general';

export type SubIntentType =
  | 'best_for_gaming'
  | 'best_for_work'
  | 'best_for_study'
  | 'best_value'
  | 'cheapest'
  | 'most_powerful'
  | 'most_portable'
  | 'newest'
  | 'popular'
  | 'alternative_to';

interface CategoryDefinition {
  canonical: string;
  synonyms: string[];
  relatedCategories: string[];
  typicalBrands: string[];
  priceRange: { min: number; max: number };
}

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

export class KeywordExtractor {
  private tokenizer: natural.WordTokenizer;
  private metaphone: typeof natural.Metaphone;

  // TAXONOMIA DE PRODUCTOS COMPLETA
  private readonly productTaxonomy = new Map<string, CategoryDefinition>([
    ['laptop', {
      canonical: 'laptop',
      synonyms: [
        'laptop', 'laptops', 'portatil', 'portatiles', 'notebook', 'notebooks',
        'ultrabook', 'chromebook', 'macbook', 'thinkpad', 'ideapad', 'pavilion',
        'inspiron', 'xps', 'zenbook', 'vivobook', 'swift', 'spectre', 'envy',
        'omen laptop', 'predator', 'nitro', 'legion', 'rog laptop', 'tuf laptop',
        'razer blade', 'surface laptop', 'laptop gaming', 'laptop gamer',
        'portatil gaming', 'gaming laptop', 'ordenador portatil',
        'computadora portatil', 'pc portatil', 'lapto', 'laptos', 'leptop'
      ],
      relatedCategories: ['desktop', 'tablet'],
      typicalBrands: ['apple', 'hp', 'dell', 'lenovo', 'asus', 'acer', 'msi', 'razer'],
      priceRange: { min: 300, max: 4000 }
    }],
    ['desktop', {
      canonical: 'desktop',
      synonyms: [
        'desktop', 'desktops', 'ordenador', 'ordenadores', 'computadora',
        'computadoras', 'pc', 'pcs', 'torre', 'torres', 'sobremesa',
        'pc gaming', 'pc gamer', 'ordenador gaming', 'gaming pc',
        'workstation', 'mini pc', 'nuc', 'barebone', 'all in one',
        'todo en uno', 'imac', 'mac mini', 'mac studio', 'mac pro',
        'equipo', 'computador', 'compu'
      ],
      relatedCategories: ['laptop', 'componentes'],
      typicalBrands: ['apple', 'hp', 'dell', 'lenovo', 'asus', 'acer', 'msi', 'corsair', 'nzxt'],
      priceRange: { min: 400, max: 5000 }
    }],

    ['movil', {
      canonical: 'movil',
      synonyms: [
        'movil', 'moviles', 'celular', 'celulares', 'telefono', 'telefonos',
        'smartphone', 'smartphones', 'iphone', 'galaxy', 'pixel', 'oneplus',
        'xiaomi', 'redmi', 'poco', 'realme', 'oppo', 'vivo', 'huawei', 'honor',
        'motorola', 'moto', 'nokia', 'sony xperia', 'gaming phone', 'rog phone',
        'mobile', 'phone', 'cell phone', 'handset', 'celu', 'fono', 'smartfone'
      ],
      relatedCategories: ['tablet', 'smartwatch', 'auriculares'],
      typicalBrands: ['apple', 'samsung', 'xiaomi', 'google', 'oneplus', 'huawei', 'oppo', 'motorola'],
      priceRange: { min: 100, max: 1500 }
    }],
    ['tablet', {
      canonical: 'tablet',
      synonyms: [
        'tablet', 'tablets', 'tableta', 'tabletas', 'ipad', 'ipads',
        'galaxy tab', 'surface', 'surface pro', 'fire tablet', 'kindle fire',
        'lenovo tab', 'xiaomi pad', 'huawei matepad', 'tableta grafica',
        'drawing tablet', 'wacom', 'xp-pen', 'huion', 'e-reader', 'ereader',
        'kindle', 'lector electronico'
      ],
      relatedCategories: ['movil', 'laptop'],
      typicalBrands: ['apple', 'samsung', 'microsoft', 'lenovo', 'amazon', 'huawei', 'wacom'],
      priceRange: { min: 100, max: 2000 }
    }],
    ['monitor', {
      canonical: 'monitor',
      synonyms: [
        'monitor', 'monitores', 'pantalla', 'pantallas', 'display', 'displays',
        'monitor gaming', 'monitor gamer', 'gaming monitor', 'monitor curvo',
        'curved monitor', 'ultrawide', 'monitor 4k', 'monitor 2k', 'monitor qhd',
        'monitor 144hz', 'monitor 240hz', 'monitor ips', 'monitor oled',
        'monitor profesional', 'segundo monitor', 'screen'
      ],
      relatedCategories: ['tarjeta grafica', 'desktop'],
      typicalBrands: ['lg', 'samsung', 'dell', 'asus', 'acer', 'benq', 'msi', 'aoc', 'viewsonic'],
      priceRange: { min: 100, max: 2000 }
    }],
    ['teclado', {
      canonical: 'teclado',
      synonyms: [
        'teclado', 'teclados', 'keyboard', 'keyboards', 'teclado mecanico',
        'mechanical keyboard', 'teclado gaming', 'teclado gamer', 'gaming keyboard',
        'teclado rgb', 'teclado inalambrico', 'wireless keyboard', 'teclado bluetooth',
        'teclado ergonomico', 'teclado compacto', 'teclado 60', 'teclado tkl',
        'numpad', 'keycaps', 'switches', 'cherry mx', 'gateron', 'hot swap'
      ],
      relatedCategories: ['raton', 'auriculares'],
      typicalBrands: ['logitech', 'razer', 'corsair', 'steelseries', 'hyperx', 'ducky', 'keychron'],
      priceRange: { min: 20, max: 300 }
    }],

    ['raton', {
      canonical: 'raton',
      synonyms: [
        'raton', 'ratones', 'mouse', 'mouses', 'mice', 'raton gaming',
        'mouse gaming', 'raton gamer', 'mouse gamer', 'gaming mouse',
        'raton inalambrico', 'wireless mouse', 'raton bluetooth', 'mouse bluetooth',
        'raton ergonomico', 'ergonomic mouse', 'vertical mouse', 'trackball',
        'trackpad', 'touchpad', 'mousepad', 'alfombrilla', 'desk mat', 'mause'
      ],
      relatedCategories: ['teclado', 'alfombrilla'],
      typicalBrands: ['logitech', 'razer', 'corsair', 'steelseries', 'zowie', 'pulsar', 'finalmouse'],
      priceRange: { min: 10, max: 200 }
    }],
    ['auriculares', {
      canonical: 'auriculares',
      synonyms: [
        'auriculares', 'auricular', 'audifonos', 'headphones', 'headphone',
        'cascos', 'casco', 'headset', 'headsets', 'auriculares gaming',
        'gaming headset', 'auriculares inalambricos', 'wireless headphones',
        'auriculares bluetooth', 'noise cancelling', 'anc', 'tws', 'earbuds',
        'airpods', 'galaxy buds', 'buds', 'in-ear', 'over-ear', 'on-ear',
        'auriculares profesionales', 'studio headphones', 'hifi', 'hi-fi'
      ],
      relatedCategories: ['microfono', 'altavoces'],
      typicalBrands: ['sony', 'bose', 'sennheiser', 'apple', 'samsung', 'jabra', 'hyperx', 'steelseries'],
      priceRange: { min: 20, max: 500 }
    }],
    ['altavoces', {
      canonical: 'altavoces',
      synonyms: [
        'altavoz', 'altavoces', 'speaker', 'speakers', 'parlante', 'parlantes',
        'bocina', 'bocinas', 'altavoz bluetooth', 'bluetooth speaker',
        'altavoz portatil', 'altavoz inteligente', 'smart speaker', 'echo',
        'alexa', 'google home', 'homepod', 'soundbar', 'barra de sonido',
        'subwoofer', 'home theater', 'home cinema', '2.1', '5.1', '7.1', 'surround'
      ],
      relatedCategories: ['auriculares', 'microfono'],
      typicalBrands: ['jbl', 'bose', 'sony', 'marshall', 'harman kardon', 'sonos', 'logitech'],
      priceRange: { min: 20, max: 1000 }
    }],
    ['microfono', {
      canonical: 'microfono',
      synonyms: [
        'microfono', 'microfonos', 'mic', 'mics', 'microfono usb', 'usb microphone',
        'microfono streaming', 'microfono podcast', 'microfono gaming',
        'microfono condensador', 'condenser microphone', 'microfono dinamico',
        'microfono cardioide', 'lavalier', 'microfono inalambrico',
        'blue yeti', 'shure', 'rode', 'elgato wave', 'hyperx quadcast'
      ],
      relatedCategories: ['auriculares', 'webcam'],
      typicalBrands: ['blue', 'rode', 'shure', 'audio-technica', 'elgato', 'hyperx', 'razer'],
      priceRange: { min: 30, max: 400 }
    }],

    ['almacenamiento', {
      canonical: 'almacenamiento',
      synonyms: [
        'almacenamiento', 'storage', 'disco', 'discos', 'disco duro', 'hard drive',
        'hdd', 'ssd', 'nvme', 'm.2', 'sata', 'disco externo', 'disco portatil',
        'pendrive', 'usb', 'memoria usb', 'flash drive', 'tarjeta sd', 'sd card',
        'microsd', 'tarjeta memoria', 'nas', 'servidor nas', 'raid', 'backup'
      ],
      relatedCategories: ['componentes', 'ram'],
      typicalBrands: ['samsung', 'western digital', 'wd', 'seagate', 'crucial', 'kingston', 'sandisk'],
      priceRange: { min: 20, max: 500 }
    }],
    ['componentes', {
      canonical: 'componentes',
      synonyms: [
        'componente', 'componentes', 'hardware', 'pieza', 'piezas', 'upgrade',
        'mejora', 'actualizacion', 'parts', 'pc parts', 'build', 'montar pc'
      ],
      relatedCategories: ['procesador', 'tarjeta grafica', 'ram', 'placa base'],
      typicalBrands: ['intel', 'amd', 'nvidia', 'corsair', 'asus', 'msi', 'gigabyte'],
      priceRange: { min: 50, max: 2000 }
    }],
    ['procesador', {
      canonical: 'procesador',
      synonyms: [
        'procesador', 'procesadores', 'cpu', 'cpus', 'micro', 'microprocesador',
        'intel core', 'core i3', 'core i5', 'core i7', 'core i9', 'amd ryzen',
        'ryzen 3', 'ryzen 5', 'ryzen 7', 'ryzen 9', 'threadripper', 'xeon',
        'apple m1', 'apple m2', 'apple m3', 'snapdragon', 'chip', 'processor'
      ],
      relatedCategories: ['placa base', 'refrigeracion'],
      typicalBrands: ['intel', 'amd', 'apple', 'qualcomm'],
      priceRange: { min: 80, max: 800 }
    }],
    ['tarjeta grafica', {
      canonical: 'tarjeta grafica',
      synonyms: [
        'tarjeta grafica', 'tarjetas graficas', 'gpu', 'gpus', 'grafica', 'graphics card',
        'video card', 'nvidia', 'geforce', 'rtx', 'gtx', 'rtx 3060', 'rtx 3070',
        'rtx 3080', 'rtx 3090', 'rtx 4060', 'rtx 4070', 'rtx 4080', 'rtx 4090',
        'amd radeon', 'radeon rx', 'rx 6600', 'rx 6700', 'rx 6800', 'rx 7600',
        'rx 7800', 'rx 7900', 'intel arc', 'vga', 'graphic'
      ],
      relatedCategories: ['monitor', 'procesador'],
      typicalBrands: ['nvidia', 'amd', 'asus', 'msi', 'gigabyte', 'evga', 'zotac', 'sapphire'],
      priceRange: { min: 150, max: 2000 }
    }],

    ['ram', {
      canonical: 'ram',
      synonyms: [
        'ram', 'memoria ram', 'memoria', 'memorias', 'ddr4', 'ddr5', 'dimm',
        'sodimm', 'memoria gaming', 'ram gaming', 'rgb ram', '8gb', '16gb',
        '32gb', '64gb', 'kit memoria', 'dual channel', 'memory'
      ],
      relatedCategories: ['placa base', 'procesador'],
      typicalBrands: ['corsair', 'kingston', 'crucial', 'gskill', 'hyperx', 'teamgroup'],
      priceRange: { min: 30, max: 300 }
    }],
    ['placa base', {
      canonical: 'placa base',
      synonyms: [
        'placa base', 'placa madre', 'motherboard', 'mobo', 'mainboard', 'placa',
        'socket', 'am4', 'am5', 'lga 1700', 'lga 1200', 'chipset', 'z690', 'z790',
        'b650', 'x670', 'atx', 'matx', 'mini itx', 'itx', 'eatx', 'board'
      ],
      relatedCategories: ['procesador', 'ram'],
      typicalBrands: ['asus', 'msi', 'gigabyte', 'asrock', 'biostar'],
      priceRange: { min: 60, max: 600 }
    }],
    ['fuente', {
      canonical: 'fuente',
      synonyms: [
        'fuente', 'fuente de poder', 'fuente alimentacion', 'psu', 'power supply',
        '80 plus', 'gold', 'platinum', 'titanium', 'modular', 'semi modular',
        'full modular', '500w', '600w', '650w', '750w', '850w', '1000w', 'watts'
      ],
      relatedCategories: ['gabinete', 'componentes'],
      typicalBrands: ['corsair', 'evga', 'seasonic', 'be quiet', 'cooler master', 'thermaltake'],
      priceRange: { min: 40, max: 300 }
    }],
    ['refrigeracion', {
      canonical: 'refrigeracion',
      synonyms: [
        'refrigeracion', 'cooling', 'cooler', 'enfriamiento', 'ventilador',
        'ventiladores', 'fan', 'fans', 'disipador', 'refrigeracion liquida',
        'liquid cooling', 'aio', 'watercooling', 'water cooling', 'pasta termica',
        'thermal paste', 'rgb fans', 'tower cooler', 'air cooler'
      ],
      relatedCategories: ['procesador', 'gabinete'],
      typicalBrands: ['noctua', 'corsair', 'nzxt', 'cooler master', 'be quiet', 'arctic', 'deepcool'],
      priceRange: { min: 20, max: 400 }
    }],
    ['gabinete', {
      canonical: 'gabinete',
      synonyms: [
        'gabinete', 'gabinetes', 'caja', 'cajas', 'case', 'cases', 'torre',
        'chasis', 'carcasa', 'gabinete gaming', 'case gaming', 'torre gaming',
        'mid tower', 'full tower', 'mini tower', 'gabinete rgb', 'tempered glass',
        'vidrio templado', 'tower'
      ],
      relatedCategories: ['fuente', 'refrigeracion'],
      typicalBrands: ['nzxt', 'corsair', 'lian li', 'fractal design', 'phanteks', 'cooler master'],
      priceRange: { min: 40, max: 400 }
    }],

    ['gaming', {
      canonical: 'gaming',
      synonyms: [
        'gaming', 'gamer', 'juegos', 'videojuegos', 'juego', 'videojuego',
        'esports', 'e-sports', 'competitivo', 'streamer', 'streaming',
        'setup gaming', 'setup gamer', 'battlestation', 'game', 'games', 'play'
      ],
      relatedCategories: ['laptop', 'desktop', 'monitor', 'teclado', 'raton', 'auriculares'],
      typicalBrands: ['razer', 'logitech', 'corsair', 'steelseries', 'hyperx', 'asus rog'],
      priceRange: { min: 50, max: 3000 }
    }],
    ['consola', {
      canonical: 'consola',
      synonyms: [
        'consola', 'consolas', 'videoconsola', 'console', 'playstation', 'ps4', 'ps5',
        'xbox', 'xbox one', 'xbox series', 'xbox series x', 'xbox series s',
        'nintendo', 'switch', 'nintendo switch', 'steam deck', 'rog ally',
        'mando', 'mandos', 'controller', 'gamepad', 'joystick', 'dualshock', 'dualsense'
      ],
      relatedCategories: ['gaming', 'auriculares'],
      typicalBrands: ['sony', 'microsoft', 'nintendo', 'valve', 'asus'],
      priceRange: { min: 50, max: 600 }
    }],
    ['redes', {
      canonical: 'redes',
      synonyms: [
        'red', 'redes', 'networking', 'router', 'routers', 'wifi', 'wi-fi',
        'wireless', 'modem', 'switch de red', 'switch ethernet', 'hub',
        'access point', 'punto de acceso', 'repetidor', 'extensor wifi',
        'mesh', 'wifi mesh', 'wifi 6', 'wifi 6e', 'wifi 7', 'ethernet',
        'cable red', 'cable ethernet', 'rj45', 'cat6', 'adaptador wifi',
        'tarjeta red', 'plc', 'powerline', 'network'
      ],
      relatedCategories: ['accesorios'],
      typicalBrands: ['tp-link', 'netgear', 'asus', 'linksys', 'ubiquiti', 'd-link'],
      priceRange: { min: 20, max: 400 }
    }],
    ['camara', {
      canonical: 'camara',
      synonyms: [
        'camara', 'camaras', 'camera', 'webcam', 'webcams', 'camara web',
        'streaming cam', 'camara digital', 'dslr', 'mirrorless', 'reflex',
        'camara deportiva', 'action cam', 'gopro', 'dji', 'drone', 'drones',
        'camara seguridad', 'camara ip', 'ring', 'nest cam', 'arlo',
        'objetivo', 'lente', 'lentes', 'tripode'
      ],
      relatedCategories: ['microfono', 'streaming'],
      typicalBrands: ['logitech', 'razer', 'elgato', 'sony', 'canon', 'nikon', 'gopro', 'dji'],
      priceRange: { min: 30, max: 2000 }
    }],

    ['impresora', {
      canonical: 'impresora',
      synonyms: [
        'impresora', 'impresoras', 'printer', 'printers', 'multifuncion',
        'impresora laser', 'impresora tinta', 'inkjet', 'impresora fotografica',
        'impresora 3d', '3d printer', 'escaner', 'scanner', 'toner', 'cartucho',
        'cartuchos', 'tinta', 'tintas', 'papel fotografico'
      ],
      relatedCategories: ['accesorios'],
      typicalBrands: ['hp', 'epson', 'canon', 'brother', 'xerox', 'samsung'],
      priceRange: { min: 50, max: 500 }
    }],
    ['smartwatch', {
      canonical: 'smartwatch',
      synonyms: [
        'smartwatch', 'smartwatches', 'reloj inteligente', 'relojes inteligentes',
        'apple watch', 'galaxy watch', 'fitbit', 'garmin', 'amazfit',
        'pulsera actividad', 'fitness tracker', 'band', 'mi band', 'wearable'
      ],
      relatedCategories: ['movil', 'auriculares'],
      typicalBrands: ['apple', 'samsung', 'garmin', 'fitbit', 'amazfit', 'huawei', 'xiaomi'],
      priceRange: { min: 30, max: 800 }
    }],
    ['smart home', {
      canonical: 'smart home',
      synonyms: [
        'smart home', 'hogar inteligente', 'domotica', 'bombilla inteligente',
        'smart bulb', 'enchufe inteligente', 'smart plug', 'termostato inteligente',
        'nest', 'ring doorbell', 'timbre inteligente', 'cerradura inteligente',
        'smart lock', 'sensor', 'sensores', 'automatizacion', 'home automation'
      ],
      relatedCategories: ['redes', 'altavoces'],
      typicalBrands: ['philips hue', 'ring', 'nest', 'amazon', 'google', 'xiaomi', 'tp-link'],
      priceRange: { min: 15, max: 300 }
    }],
    ['silla', {
      canonical: 'silla',
      synonyms: [
        'silla', 'sillas', 'silla gaming', 'silla gamer', 'gaming chair',
        'silla oficina', 'silla ergonomica', 'escritorio', 'escritorios',
        'mesa gaming', 'desk', 'standing desk', 'escritorio elevable',
        'chair', 'office chair'
      ],
      relatedCategories: ['gaming', 'accesorios'],
      typicalBrands: ['secretlab', 'noblechairs', 'dxracer', 'autonomous', 'ikea', 'herman miller'],
      priceRange: { min: 100, max: 800 }
    }],
    ['accesorios', {
      canonical: 'accesorios',
      synonyms: [
        'accesorio', 'accesorios', 'accessory', 'accessories', 'gadget', 'gadgets',
        'funda', 'fundas', 'case', 'cover', 'protector', 'protector pantalla',
        'cargador', 'cargadores', 'charger', 'cable', 'cables', 'adaptador',
        'hub usb', 'dock', 'docking station', 'soporte', 'stand', 'brazo monitor',
        'organizador cables', 'luz led', 'tira led', 'rgb', 'iluminacion'
      ],
      relatedCategories: ['movil', 'laptop'],
      typicalBrands: ['anker', 'belkin', 'ugreen', 'baseus', 'spigen', 'elago'],
      priceRange: { min: 5, max: 200 }
    }]
  ]);


  // MARCAS EXHAUSTIVAS
  private readonly allBrands = new Set([
    // Computadoras
    'apple', 'macbook', 'imac', 'mac', 'hp', 'hewlett packard', 'omen', 'pavilion', 'envy', 'spectre', 'victus',
    'dell', 'alienware', 'xps', 'inspiron', 'latitude', 'precision',
    'lenovo', 'thinkpad', 'ideapad', 'legion', 'yoga',
    'asus', 'rog', 'republic of gamers', 'tuf', 'zenbook', 'vivobook', 'proart',
    'acer', 'predator', 'nitro', 'aspire', 'swift', 'msi', 'raider', 'stealth', 'katana',
    'microsoft', 'surface', 'samsung', 'galaxy', 'huawei', 'matebook', 'gigabyte', 'aorus', 'aero', 'razer', 'blade',
    // Moviles
    'iphone', 'xiaomi', 'redmi', 'poco', 'mi', 'oneplus', 'oppo', 'vivo', 'realme', 'honor',
    'google', 'pixel', 'motorola', 'moto', 'nokia', 'sony', 'xperia', 'nothing', 'zte', 'tcl',
    // Componentes
    'intel', 'amd', 'ryzen', 'threadripper', 'epyc', 'athlon', 'qualcomm', 'snapdragon', 'mediatek', 'exynos',
    'nvidia', 'geforce', 'rtx', 'gtx', 'quadro', 'radeon', 'rx', 'vega', 'intel arc',
    'corsair', 'vengeance', 'dominator', 'kingston', 'hyperx', 'fury', 'crucial', 'ballistix',
    'gskill', 'g.skill', 'trident', 'ripjaws', 'samsung evo', 'samsung pro',
    'western digital', 'wd', 'sandisk', 'seagate', 'barracuda', 'firecuda', 'toshiba', 'hynix',
    // Perifericos
    'logitech', 'logi', 'steelseries', 'ducky', 'keychron', 'akko', 'glorious',
    'roccat', 'cooler master', 'thermaltake', 'zowie', 'benq', 'finalmouse', 'pulsar',
    // Audio
    'bose', 'sennheiser', 'audio technica', 'audiotechnica', 'beyerdynamic', 'akg', 'shure', 'jabra',
    'jbl', 'harman kardon', 'marshall', 'bang olufsen', 'beats', 'skullcandy', 'anker', 'soundcore',
    'astro', 'turtle beach', 'epos', 'blue', 'rode', 'elgato',
    // Monitores
    'lg', 'ultragear', 'ultrawide', 'viewsonic', 'aoc', 'philips',
    // Redes
    'tp-link', 'tplink', 'netgear', 'linksys', 'ubiquiti', 'unifi', 'd-link', 'dlink',
    // Gaming
    'playstation', 'ps', 'xbox', 'nintendo', 'valve', 'steam',
    // Otros
    'belkin', 'ugreen', 'baseus', 'nzxt', 'lian li', 'fractal design', 'phanteks', 'be quiet',
    'noctua', 'arctic', 'deepcool', 'ekwb', 'secretlab', 'noblechairs', 'dxracer', 'autonomous',
    'avermedia', 'blackmagic', 'wacom', 'xp-pen', 'huion', 'gaomon',
    'gopro', 'dji', 'insta360', 'ring', 'nest', 'arlo', 'eufy',
    'fitbit', 'garmin', 'amazfit', 'polar', 'suunto', 'asrock', 'biostar', 'evga', 'zotac', 'sapphire',
    'seasonic', 'teamgroup', 'epson', 'canon', 'brother', 'xerox', 'spigen', 'elago'
  ]);


  // STOPWORDS COMPLETAS (ES/EN)
  private readonly stopwords = new Set([
    // Espanol - Articulos y preposiciones
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a',
    'ante', 'bajo', 'con', 'contra', 'desde', 'en', 'entre', 'hacia', 'hasta',
    'para', 'por', 'segun', 'sin', 'sobre', 'tras',
    // Espanol - Verbos comunes
    'ser', 'estar', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver', 'dar', 'saber',
    'querer', 'llegar', 'pasar', 'deber', 'poner', 'busco', 'buscar', 'buscando',
    'quiero', 'querria', 'quisiera', 'necesito', 'necesitar', 'dame', 'dime',
    'muestrame', 'ensename', 'recomienda', 'recomiendame', 'sugiere', 'sugiereme',
    'ayuda', 'ayudame', 'tengo', 'hay', 'tiene', 'tienen', 'tienes',
    // Espanol - Pronombres
    'yo', 'tu', 'el', 'ella', 'nosotros', 'vosotros', 'ellos', 'me', 'te', 'se',
    'nos', 'os', 'le', 'les', 'lo', 'mi', 'mis', 'su', 'sus', 'nuestro', 'nuestra',
    'que', 'cual', 'quien', 'como', 'donde', 'cuando', 'cuanto',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
    'algo', 'alguien', 'alguno', 'alguna', 'algunos', 'algunas',
    'nada', 'nadie', 'ninguno', 'ninguna', 'todo', 'toda', 'todos', 'todas',
    'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'mismos', 'mismas',
    'muy', 'mas', 'menos', 'mucho', 'mucha', 'muchos', 'muchas',
    'poco', 'poca', 'pocos', 'pocas', 'bastante', 'bastantes',
    'tambien', 'tampoco', 'ademas', 'si', 'no', 'ya', 'aun', 'todavia',
    'ahora', 'antes', 'despues', 'luego', 'siempre', 'nunca',
    'aqui', 'alli', 'ahi', 'bien', 'mal', 'mejor', 'peor',
    'solo', 'solamente', 'unicamente', 'porque', 'aunque', 'pero', 'sino', 'pues', 'entonces',
    'asi', 'tan', 'tanto', 'tanta', 'tantos', 'tantas',
    // Ingles
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'can',
    'show', 'give', 'find', 'get', 'want', 'need', 'looking', 'search', 'recommend', 'suggest', 'help', 'please'
  ]);


  // PATRONES DE INTENCION
  private readonly intentPatterns = {
    recommendation: [
      /recomi[eé]nd/i, /sugi[eé]r/i, /acons[eé]j/i, /qu[eé]\s+(me\s+)?recomiendas/i,
      /cu[aá]l\s+(es\s+)?(el\s+)?mejor/i, /cu[aá]les\s+son\s+(los\s+)?mejores/i,
      /mejor(es)?\s+(para|de)/i, /top\s+\d+/i, /los\s+\d+\s+mejores/i,
      /opciones?\s+(para|de)/i, /alternativas?\s+(a|para|de)/i,
      /vale\s+la\s+pena/i, /deber[ií]a\s+comprar/i, /qu[eé]\s+compro/i,
      /recommend/i, /suggest/i, /best\s+(for|of)/i, /top\s+picks/i,
      /dame\s+\d+/i, /muestrame\s+\d+/i, /ensename\s+\d+/i
    ],
    search: [
      /busco/i, /buscando/i, /buscar/i, /encontrar/i, /necesito/i, /quiero/i,
      /quisiera/i, /querr[ií]a/i, /tienes?/i, /tienen/i, /hay/i, /existe/i,
      /d[oó]nde\s+(puedo\s+)?(encontrar|comprar|conseguir)/i, /venden/i, /disponible/i,
      /looking\s+for/i, /searching/i, /find/i, /where\s+can/i, /do\s+you\s+have/i
    ],
    comparison: [
      /compar/i, /diferencia/i, /versus/i, /vs\.?/i, /mejor\s+que/i, /peor\s+que/i,
      /entre\s+.+\s+y\s+/i, /cu[aá]l\s+es\s+mejor/i, /qu[eé]\s+diferencia/i,
      /compare/i, /difference/i, /better\s+than/i, /which\s+is\s+better/i
    ],
    info: [
      /qu[eé]\s+es/i, /c[oó]mo\s+funciona/i, /para\s+qu[eé]\s+sirve/i,
      /caracter[ií]sticas/i, /especificaciones/i, /specs/i,
      /informaci[oó]n\s+(sobre|de)/i, /detalles\s+(de|sobre)/i,
      /cu[aá]nto\s+(cuesta|vale|pesa|mide)/i, /precio\s+(de)/i,
      /what\s+is/i, /how\s+does/i, /features/i, /specifications/i, /tell\s+me\s+about/i
    ],
    price_check: [
      /precio/i, /cuesta/i, /vale/i, /cost/i, /price/i, /cuanto\s+sale/i,
      /presupuesto/i, /budget/i, /barato/i, /economico/i, /cheap/i, /affordable/i
    ],
    availability: [
      /stock/i, /disponible/i, /disponibilidad/i, /hay\s+en/i, /tienen\s+en/i,
      /available/i, /in\s+stock/i, /out\s+of\s+stock/i
    ]
  };

  // PATRONES DE PRECIO
  private readonly pricePatterns = [
    { pattern: /menos\s+de\s+(\d+)/i, type: 'max' },
    { pattern: /por\s+debajo\s+de\s+(\d+)/i, type: 'max' },
    { pattern: /m[aá]ximo\s+(\d+)/i, type: 'max' },
    { pattern: /hasta\s+(\d+)/i, type: 'max' },
    { pattern: /no\s+m[aá]s\s+de\s+(\d+)/i, type: 'max' },
    { pattern: /m[aá]s\s+de\s+(\d+)/i, type: 'min' },
    { pattern: /por\s+encima\s+de\s+(\d+)/i, type: 'min' },
    { pattern: /m[ií]nimo\s+(\d+)/i, type: 'min' },
    { pattern: /desde\s+(\d+)/i, type: 'min' },
    { pattern: /entre\s+(\d+)\s+y\s+(\d+)/i, type: 'range' },
    { pattern: /(\d+)\s*[-–]\s*(\d+)/i, type: 'range' },
    { pattern: /under\s+(\d+)/i, type: 'max' },
    { pattern: /below\s+(\d+)/i, type: 'max' },
    { pattern: /over\s+(\d+)/i, type: 'min' },
    { pattern: /above\s+(\d+)/i, type: 'min' },
    { pattern: /(\d+)\s*[€$]/i, type: 'exact' },
    { pattern: /[€$]\s*(\d+)/i, type: 'exact' },
    { pattern: /(\d+)\s*(euros?|dollars?)/i, type: 'exact' },
    { pattern: /presupuesto\s+(\d+)/i, type: 'exact' },
    { pattern: /budget\s+(\d+)/i, type: 'exact' }
  ];


  // PATRONES DE USO/PROPOSITO
  private readonly usagePatterns = [
    { pattern: /para\s+(gaming|juegos|jugar)/i, keywords: ['gaming', 'gamer', 'juegos'] },
    { pattern: /para\s+(trabajo|oficina|trabajar)/i, keywords: ['oficina', 'trabajo', 'profesional'] },
    { pattern: /para\s+(estudio|estudiar|universidad|estudiante)/i, keywords: ['estudiante', 'estudio'] },
    { pattern: /para\s+(edici[oó]n|editar)\s*(video|foto|audio)?/i, keywords: ['edicion', 'creativo', 'profesional'] },
    { pattern: /para\s+(programar|programaci[oó]n|desarrollo|coding|desarrollador)/i, keywords: ['programacion', 'desarrollo', 'coding'] },
    { pattern: /para\s+(dise[ñn]o|dise[ñn]ar|dise[ñn]ador)/i, keywords: ['diseno', 'creativo', 'profesional'] },
    { pattern: /para\s+(streaming|streamear|twitch|youtube)/i, keywords: ['streaming', 'creador', 'contenido'] },
    { pattern: /para\s+(m[uú]sica|producci[oó]n\s*musical|producir)/i, keywords: ['musica', 'audio', 'produccion'] },
    { pattern: /para\s+(viaj(ar|e)|port[aá]til|llevar)/i, keywords: ['portatil', 'viaje', 'ligero'] },
    { pattern: /para\s+(casa|hogar|dom[eé]stico|familia)/i, keywords: ['hogar', 'familia', 'domestico'] },
    { pattern: /para\s+(ni[ñn]o|ni[ñn]a|hijo|hija|peque[ñn]o)/i, keywords: ['infantil', 'nino', 'basico'] }
  ];

  // PATRONES DE CARACTERISTICAS
  private readonly featurePatterns = [
    { pattern: /(barato|econ[oó]mico|precio\s*bajo|budget|asequible)/i, keywords: ['economico', 'budget'], quality: 'budget' as const },
    { pattern: /(caro|premium|alta\s*gama|high\s*end|lujo|tope\s*de\s*gama)/i, keywords: ['premium', 'alta gama'], quality: 'premium' as const },
    { pattern: /(gama\s*media|mid\s*range|relaci[oó]n\s*calidad)/i, keywords: ['gama media'], quality: 'midrange' as const },
    { pattern: /(potente|rendimiento|performance|r[aá]pido|veloz)/i, keywords: ['potente', 'rendimiento', 'rapido'] },
    { pattern: /(silencioso|quiet|sin\s*ruido)/i, keywords: ['silencioso', 'quiet'] },
    { pattern: /(compacto|peque[ñn]o|mini|port[aá]til|ligero|liviano)/i, keywords: ['compacto', 'portatil', 'ligero'] },
    { pattern: /(grande|amplio|pantalla\s*grande)/i, keywords: ['grande', 'amplio'] },
    { pattern: /(resistente|duradero|robusto|calidad)/i, keywords: ['resistente', 'duradero', 'calidad'] },
    { pattern: /(inal[aá]mbrico|wireless|bluetooth|sin\s*cables)/i, keywords: ['inalambrico', 'wireless', 'bluetooth'] },
    { pattern: /(rgb|iluminaci[oó]n|luces|led)/i, keywords: ['rgb', 'iluminacion', 'led'] },
    { pattern: /(profesional|pro\b)/i, keywords: ['profesional', 'pro'] },
    { pattern: /(principiante|b[aá]sico|entry\s*level|iniciaci[oó]n)/i, keywords: ['basico', 'principiante', 'entry level'] },
    { pattern: /(nuevo|[uú]ltimo|reciente|2024|2025)/i, keywords: ['nuevo', 'ultimo', 'reciente'] },
    { pattern: /(popular|m[aá]s\s*vendido|best\s*seller|top\s*ventas)/i, keywords: ['popular', 'bestseller', 'top ventas'] }
  ];

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.metaphone = natural.Metaphone;
  }


  /**
   * METODO PRINCIPAL - Extrae keywords del mensaje del usuario
   */
  extractKeywords(userMessage: string): ExtractedKeywords {
    const normalizedText = this.normalizeText(userMessage);
    const intent = this.detectIntent(userMessage);
    const subIntent = this.detectSubIntent(userMessage);
    const categories = this.extractCategories(normalizedText, userMessage);
    const brands = this.extractBrands(normalizedText);
    const technicalSpecs = this.extractTechnicalSpecs(userMessage);
    const priceRange = this.extractPriceRange(userMessage);
    const preferences = this.extractPreferences(userMessage);
    const generalKeywords = this.extractGeneralKeywords(normalizedText, categories, brands);
    const expandedKeywords = this.expandKeywords(categories, brands, generalKeywords, preferences);
    const confidence = this.calculateConfidence(categories, brands, technicalSpecs, intent);

    return {
      categories,
      brands,
      technicalSpecs,
      generalKeywords,
      expandedKeywords,
      normalizedText,
      intent,
      subIntent,
      priceRange,
      preferences,
      confidence
    };
  }

  /**
   * Normaliza el texto eliminando acentos y caracteres especiales
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Detecta la intencion principal del usuario
   */
  private detectIntent(text: string): IntentType {
    for (const pattern of this.intentPatterns.recommendation) {
      if (pattern.test(text)) return 'recommendation';
    }
    for (const pattern of this.intentPatterns.price_check) {
      if (pattern.test(text)) return 'price_check';
    }
    for (const pattern of this.intentPatterns.availability) {
      if (pattern.test(text)) return 'availability';
    }
    for (const pattern of this.intentPatterns.comparison) {
      if (pattern.test(text)) return 'comparison';
    }
    for (const pattern of this.intentPatterns.info) {
      if (pattern.test(text)) return 'info';
    }
    for (const pattern of this.intentPatterns.search) {
      if (pattern.test(text)) return 'search';
    }
    return 'general';
  }

  /**
   * Detecta sub-intencion mas especifica
   */
  private detectSubIntent(text: string): SubIntentType | undefined {
    const lowerText = text.toLowerCase();
    
    if (/mejor.*(gaming|juegos|jugar)/i.test(text)) return 'best_for_gaming';
    if (/mejor.*(trabajo|oficina)/i.test(text)) return 'best_for_work';
    if (/mejor.*(estudio|estudiante)/i.test(text)) return 'best_for_study';
    if (/mejor.*(relaci[oó]n|calidad.precio|value)/i.test(text)) return 'best_value';
    if (/(m[aá]s\s*barato|cheapest|econ[oó]mico)/i.test(text)) return 'cheapest';
    if (/(m[aá]s\s*potente|powerful|rendimiento)/i.test(text)) return 'most_powerful';
    if (/(m[aá]s\s*(ligero|port[aá]til)|portable)/i.test(text)) return 'most_portable';
    if (/(nuevo|[uú]ltimo|latest|newest|reciente)/i.test(text)) return 'newest';
    if (/(popular|vendido|trending)/i.test(text)) return 'popular';
    if (/alternativa\s*(a|de|para)/i.test(text)) return 'alternative_to';
    
    return undefined;
  }


  /**
   * Extrae categorias de productos con fuzzy matching
   */
  private extractCategories(normalizedText: string, originalText: string): string[] {
    const foundCategories: string[] = [];
    const lowerOriginal = originalText.toLowerCase();

    for (const [category, definition] of this.productTaxonomy) {
      for (const synonym of definition.synonyms) {
        const normalizedSynonym = this.normalizeText(synonym);
        
        // Busqueda exacta
        if (normalizedText.includes(normalizedSynonym)) {
          foundCategories.push(definition.canonical);
          break;
        }
        
        // Busqueda en texto original (para acentos)
        if (lowerOriginal.includes(synonym.toLowerCase())) {
          foundCategories.push(definition.canonical);
          break;
        }
        
        // Fuzzy matching para errores ortograficos (distancia Levenshtein <= 2)
        const words = normalizedText.split(' ');
        for (const word of words) {
          if (word.length >= 4 && normalizedSynonym.length >= 4) {
            const distance = this.levenshteinDistance(word, normalizedSynonym);
            if (distance <= 2 && distance < word.length * 0.3) {
              foundCategories.push(definition.canonical);
              break;
            }
          }
        }
      }
    }

    return [...new Set(foundCategories)];
  }

  /**
   * Extrae marcas del texto
   */
  private extractBrands(normalizedText: string): string[] {
    const foundBrands: string[] = [];
    const words = normalizedText.split(/\s+/);

    for (const brand of this.allBrands) {
      const normalizedBrand = this.normalizeText(brand);
      
      // Busqueda exacta
      if (normalizedText.includes(normalizedBrand)) {
        foundBrands.push(brand);
        continue;
      }
      
      // Busqueda por palabra individual con fuzzy matching
      for (const word of words) {
        if (word === normalizedBrand) {
          foundBrands.push(brand);
          break;
        }
        // Fuzzy para marcas largas
        if (word.length >= 4 && normalizedBrand.length >= 4) {
          const distance = this.levenshteinDistance(word, normalizedBrand);
          if (distance <= 1) {
            foundBrands.push(brand);
            break;
          }
        }
      }
    }

    return [...new Set(foundBrands)];
  }

  /**
   * Calcula distancia de Levenshtein entre dos strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }


  /**
   * Extrae especificaciones tecnicas del texto
   */
  private extractTechnicalSpecs(text: string): { [key: string]: string } {
    const specs: { [key: string]: string } = {};
    
    const patterns = [
      // RAM
      { patterns: [/(\d+)\s*(gb|mb)\s*(de\s*)?(ram|memoria)/gi, /\b(\d+)\s*gb\s*ram\b/gi], type: 'ram' },
      // Almacenamiento
      { patterns: [/(\d+)\s*(gb|tb)\s*(de\s*)?(ssd|hdd|almacenamiento|disco|storage)/gi, /\b(\d+)\s*(gb|tb)\s*(nvme|m\.2|sata)\b/gi], type: 'storage' },
      // Procesador
      { patterns: [/(intel|amd)?\s*(core\s*)?(i[3579]|ryzen\s*[3579])[\w\s-]*/gi, /\b(i[3579]|ryzen\s*[3579])\s*\d{4,5}[a-z]*/gi], type: 'processor' },
      // Pantalla
      { patterns: [/(\d+\.?\d*)\s*(pulgadas|"|''|inch)/gi, /(\d+)\s*(hz|hertz)/gi, /(4k|uhd|fhd|qhd|1080p|1440p|2160p)/gi], type: 'screen' },
      // GPU
      { patterns: [/(rtx|gtx)\s*\d{4}(\s*ti|\s*super)?/gi, /(rx|radeon)\s*\d{4}(\s*xt)?/gi], type: 'gpu' },
      // Bateria
      { patterns: [/(\d+)\s*(mah|wh)\s*(de\s*)?(bater[ií]a)?/gi], type: 'battery' },
      // Conectividad
      { patterns: [/(wifi|wi-fi)\s*(6e?|7)?/gi, /(bluetooth)\s*(\d\.?\d?)?/gi, /(5g|4g|lte)/gi], type: 'connectivity' }
    ];

    for (const { patterns: patternList, type } of patterns) {
      const values: string[] = [];
      for (const pattern of patternList) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          const value = match[0].trim();
          if (value && !values.includes(value.toLowerCase())) {
            values.push(value);
          }
        }
      }
      if (values.length > 0) {
        specs[type] = values.join(', ');
      }
    }

    return specs;
  }

  /**
   * Extrae rango de precios del texto
   */
  private extractPriceRange(text: string): PriceRange | undefined {
    const range: PriceRange = { currency: 'EUR', flexibility: 'flexible' };

    for (const { pattern, type } of this.pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (type === 'range' && match[2]) {
          range.min = Number(match[1]);
          range.max = Number(match[2]);
          range.flexibility = 'strict';
          break;
        } else if (type === 'max') {
          range.max = Number(match[1]);
        } else if (type === 'min') {
          range.min = Number(match[1]);
        } else if (type === 'exact' && match[1]) {
          const price = Number(match[1]);
          range.min = Math.floor(price * 0.8);
          range.max = Math.ceil(price * 1.2);
        }
      }
    }

    return (range.min !== undefined || range.max !== undefined) ? range : undefined;
  }


  /**
   * Extrae preferencias del usuario
   */
  private extractPreferences(text: string): UserPreferences {
    const preferences: UserPreferences = {
      usage: [],
      features: [],
      quality: 'any',
      portability: 'any',
      aesthetic: []
    };

    // Extraer uso/proposito
    for (const { pattern, keywords } of this.usagePatterns) {
      if (pattern.test(text)) {
        preferences.usage.push(...keywords);
      }
    }

    // Extraer caracteristicas y calidad
    for (const { pattern, keywords, quality } of this.featurePatterns) {
      if (pattern.test(text)) {
        preferences.features.push(...keywords);
        if (quality) {
          preferences.quality = quality;
        }
      }
    }

    // Detectar portabilidad
    if (/(port[aá]til|ligero|liviano|viaje|llevar|compacto)/i.test(text)) {
      preferences.portability = 'portable';
    } else if (/(sobremesa|escritorio|torre|fijo)/i.test(text)) {
      preferences.portability = 'desktop';
    }

    // Detectar estetica
    const colors = ['negro', 'blanco', 'gris', 'plata', 'plateado', 'dorado', 'azul', 'rojo', 'verde', 'rosa', 'morado'];
    for (const color of colors) {
      if (text.toLowerCase().includes(color)) {
        preferences.aesthetic.push(color);
      }
    }
    if (/(rgb|iluminaci[oó]n|luces)/i.test(text)) {
      preferences.aesthetic.push('rgb');
    }

    // Eliminar duplicados
    preferences.usage = [...new Set(preferences.usage)];
    preferences.features = [...new Set(preferences.features)];
    preferences.aesthetic = [...new Set(preferences.aesthetic)];

    return preferences;
  }

  /**
   * Extrae keywords generales del texto
   */
  private extractGeneralKeywords(normalizedText: string, categories: string[], brands: string[]): string[] {
    const tokens = this.tokenizer.tokenize(normalizedText) || [];
    
    const filteredTokens = tokens.filter(token =>
      token.length > 2 &&
      !this.stopwords.has(token) &&
      !this.isNumber(token)
    );

    // Extraer n-gramas importantes
    const ngrams = this.extractNgrams(normalizedText);

    const allKeywords = [
      ...filteredTokens,
      ...ngrams,
      ...categories,
      ...brands
    ];

    return [...new Set(allKeywords)].slice(0, 25);
  }

  /**
   * Extrae n-gramas del texto
   */
  private extractNgrams(text: string): string[] {
    const words = text.split(/\s+/).filter(w => w.length > 2 && !this.stopwords.has(w));
    const ngrams: string[] = [];

    // Bigramas
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (bigram.length > 5) {
        ngrams.push(bigram);
      }
    }

    return ngrams.slice(0, 10);
  }

  private isNumber(str: string): boolean {
    return !isNaN(Number(str));
  }


  /**
   * Expande keywords con sinonimos y terminos relacionados
   */
  private expandKeywords(
    categories: string[],
    brands: string[],
    generalKeywords: string[],
    preferences: UserPreferences
  ): string[] {
    const expanded: string[] = [];

    // Expandir categorias con sinonimos y categorias relacionadas
    for (const category of categories) {
      const definition = this.productTaxonomy.get(category);
      if (definition) {
        // Agregar algunos sinonimos clave
        expanded.push(...definition.synonyms.slice(0, 5));
        // Agregar categorias relacionadas
        expanded.push(...definition.relatedCategories);
        // Agregar marcas tipicas de la categoria
        expanded.push(...definition.typicalBrands.slice(0, 3));
      }
    }

    // Expandir con keywords de uso
    expanded.push(...preferences.usage);
    expanded.push(...preferences.features);

    // Agregar variaciones de marcas
    for (const brand of brands) {
      // Agregar variaciones comunes
      if (brand === 'apple') expanded.push('mac', 'macbook', 'iphone', 'ipad');
      if (brand === 'samsung') expanded.push('galaxy');
      if (brand === 'nvidia') expanded.push('geforce', 'rtx', 'gtx');
      if (brand === 'amd') expanded.push('ryzen', 'radeon');
      if (brand === 'intel') expanded.push('core');
      if (brand === 'logitech') expanded.push('logi');
    }

    // Agregar keywords generales
    expanded.push(...generalKeywords);

    // Eliminar duplicados y limitar
    return [...new Set(expanded)].slice(0, 50);
  }

  /**
   * Calcula nivel de confianza de la extraccion
   */
  private calculateConfidence(
    categories: string[],
    brands: string[],
    technicalSpecs: { [key: string]: string },
    intent: IntentType
  ): number {
    let confidence = 0.3; // Base

    // Mas categorias = mas confianza
    if (categories.length > 0) confidence += 0.2;
    if (categories.length > 1) confidence += 0.1;

    // Marcas identificadas
    if (brands.length > 0) confidence += 0.15;

    // Especificaciones tecnicas
    const specCount = Object.keys(technicalSpecs).length;
    if (specCount > 0) confidence += 0.1;
    if (specCount > 2) confidence += 0.1;

    // Intencion clara
    if (intent !== 'general') confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  // ============================================================================
  // METODOS AVANZADOS DE BUSQUEDA SEMANTICA
  // ============================================================================

  /**
   * Busqueda fonetica usando Metaphone para encontrar palabras similares
   * Util para corregir errores de escritura severos
   */
  findPhoneticMatches(word: string, candidates: string[]): string[] {
    const wordCode = this.metaphone.process(word);
    return candidates.filter(candidate => {
      const candidateCode = this.metaphone.process(candidate);
      return wordCode === candidateCode;
    });
  }

  /**
   * Genera variaciones de una palabra para busqueda flexible
   * Incluye: plurales, singulares, variaciones comunes
   */
  generateWordVariations(word: string): string[] {
    const variations: string[] = [word];
    const normalized = this.normalizeText(word);
    
    // Plurales/singulares en español
    if (normalized.endsWith('s')) {
      variations.push(normalized.slice(0, -1)); // quitar s
      if (normalized.endsWith('es')) {
        variations.push(normalized.slice(0, -2)); // quitar es
      }
    } else {
      variations.push(normalized + 's'); // agregar s
      variations.push(normalized + 'es'); // agregar es
    }
    
    // Variaciones con/sin acento comunes
    const accentMap: { [key: string]: string } = {
      'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú',
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'
    };
    
    for (const [from, to] of Object.entries(accentMap)) {
      if (word.includes(from)) {
        variations.push(word.replace(new RegExp(from, 'g'), to));
      }
    }
    
    // Variaciones gaming/gamer
    if (normalized.includes('gaming')) {
      variations.push(normalized.replace('gaming', 'gamer'));
    }
    if (normalized.includes('gamer')) {
      variations.push(normalized.replace('gamer', 'gaming'));
    }
    
    return [...new Set(variations)];
  }

  /**
   * Detecta si el usuario esta pidiendo una cantidad especifica de productos
   */
  extractRequestedQuantity(text: string): number | undefined {
    const patterns = [
      /dame\s+(\d+)/i,
      /muestrame\s+(\d+)/i,
      /ensename\s+(\d+)/i,
      /quiero\s+(\d+)/i,
      /necesito\s+(\d+)/i,
      /(\d+)\s+productos?/i,
      /(\d+)\s+opciones?/i,
      /(\d+)\s+recomendaciones?/i,
      /top\s+(\d+)/i,
      /los\s+(\d+)\s+mejores/i,
      /(\d+)\s+alternativas?/i,
      /show\s+me\s+(\d+)/i,
      /give\s+me\s+(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= 20) {
          return num;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Detecta comparaciones entre productos o marcas
   */
  extractComparisonTargets(text: string): { item1?: string; item2?: string } {
    const patterns = [
      /(.+?)\s+(?:vs\.?|versus|contra|o)\s+(.+?)(?:\?|$)/i,
      /(?:entre|comparar?)\s+(.+?)\s+(?:y|and|&)\s+(.+?)(?:\?|$)/i,
      /(?:diferencia|diferencias)\s+(?:entre\s+)?(.+?)\s+(?:y|and|&)\s+(.+?)(?:\?|$)/i,
      /(.+?)\s+(?:mejor que|peor que|vs)\s+(.+?)(?:\?|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          item1: match[1]?.trim(),
          item2: match[2]?.trim()
        };
      }
    }
    
    return {};
  }

  /**
   * Extrae el contexto de uso especifico del producto
   */
  extractUsageContext(text: string): string[] {
    const contexts: string[] = [];
    
    const contextPatterns = [
      { pattern: /para\s+(mi\s+)?(trabajo|oficina|empresa|negocio)/i, context: 'profesional' },
      { pattern: /para\s+(mi\s+)?(casa|hogar|habitacion|cuarto)/i, context: 'hogar' },
      { pattern: /para\s+(jugar|gaming|juegos|videojuegos)/i, context: 'gaming' },
      { pattern: /para\s+(estudiar|universidad|colegio|instituto)/i, context: 'educacion' },
      { pattern: /para\s+(editar|edicion|photoshop|premiere|video|foto)/i, context: 'creacion_contenido' },
      { pattern: /para\s+(programar|desarrollo|codigo|software)/i, context: 'desarrollo' },
      { pattern: /para\s+(streaming|twitch|youtube|directo)/i, context: 'streaming' },
      { pattern: /para\s+(musica|produccion|audio|dj)/i, context: 'audio_produccion' },
      { pattern: /para\s+(viajar|viaje|llevar|transportar)/i, context: 'movilidad' },
      { pattern: /para\s+(regalo|regalar|cumpleanos|navidad)/i, context: 'regalo' },
      { pattern: /para\s+(mi\s+)?(hijo|hija|nino|nina|pequeno)/i, context: 'infantil' },
      { pattern: /para\s+(mi\s+)?(padre|madre|abuelo|abuela|mayor)/i, context: 'senior' },
      { pattern: /uso\s+(diario|cotidiano|basico|normal)/i, context: 'uso_general' },
      { pattern: /uso\s+(intensivo|profesional|exigente)/i, context: 'uso_intensivo' }
    ];
    
    for (const { pattern, context } of contextPatterns) {
      if (pattern.test(text)) {
        contexts.push(context);
      }
    }
    
    return [...new Set(contexts)];
  }
}


// ============================================================================
// CLASE AUXILIAR: SEMANTIC QUERY EXPANDER
// Expande queries del usuario para mejorar resultados de busqueda
// ============================================================================

export class SemanticQueryExpander {
  
  // Mapa de sinonimos semanticos para expansion de queries
  private static readonly semanticSynonyms: Map<string, string[]> = new Map([
    // Adjetivos de rendimiento
    ['potente', ['alto rendimiento', 'rapido', 'veloz', 'powerful', 'high performance', 'gaming']],
    ['rapido', ['veloz', 'potente', 'fast', 'quick', 'alto rendimiento']],
    ['lento', ['basico', 'economico', 'entry level']],
    
    // Adjetivos de precio
    ['barato', ['economico', 'asequible', 'budget', 'cheap', 'affordable', 'low cost', 'precio bajo']],
    ['caro', ['premium', 'alta gama', 'high end', 'expensive', 'lujo', 'tope de gama']],
    ['economico', ['barato', 'asequible', 'budget', 'affordable']],
    
    // Adjetivos de tamaño
    ['grande', ['amplio', 'espacioso', 'large', 'big', 'xl']],
    ['pequeno', ['compacto', 'mini', 'small', 'portable', 'ligero']],
    ['ligero', ['liviano', 'portatil', 'light', 'lightweight', 'ultraligero']],
    
    // Adjetivos de calidad
    ['bueno', ['calidad', 'recomendado', 'good', 'quality', 'fiable']],
    ['mejor', ['top', 'premium', 'best', 'superior', 'excelente', 'optimo']],
    ['profesional', ['pro', 'workstation', 'enterprise', 'business', 'comercial']],
    
    // Conectividad
    ['inalambrico', ['wireless', 'bluetooth', 'sin cables', 'wifi']],
    ['bluetooth', ['inalambrico', 'wireless', 'bt']],
    
    // Gaming
    ['gaming', ['gamer', 'juegos', 'videojuegos', 'esports', 'competitivo']],
    ['gamer', ['gaming', 'juegos', 'para jugar', 'videojuegos']],
    
    // Uso
    ['trabajo', ['oficina', 'profesional', 'business', 'productividad', 'work']],
    ['estudio', ['estudiante', 'universidad', 'educacion', 'aprendizaje']],
    ['casa', ['hogar', 'domestico', 'home', 'personal', 'familia']]
  ]);

  // Mapa de productos relacionados por categoria
  private static readonly relatedProducts: Map<string, string[]> = new Map([
    ['laptop', ['raton', 'teclado', 'monitor', 'mochila', 'soporte', 'hub usb', 'webcam']],
    ['desktop', ['monitor', 'teclado', 'raton', 'auriculares', 'webcam', 'altavoces']],
    ['monitor', ['brazo monitor', 'cable hdmi', 'cable displayport', 'hub usb']],
    ['teclado', ['raton', 'alfombrilla', 'reposamuñecas', 'keycaps']],
    ['raton', ['alfombrilla', 'teclado', 'bungee']],
    ['auriculares', ['microfono', 'soporte auriculares', 'amplificador', 'dac']],
    ['movil', ['funda', 'protector pantalla', 'cargador', 'auriculares', 'smartwatch']],
    ['tablet', ['funda', 'teclado', 'stylus', 'soporte']],
    ['consola', ['mando', 'auriculares', 'soporte', 'cargador mandos', 'juegos']],
    ['camara', ['tripode', 'tarjeta sd', 'objetivo', 'flash', 'bolsa']]
  ]);

  /**
   * Expande una query con sinonimos semanticos
   */
  static expandQuery(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const expanded: string[] = [query];
    
    for (const word of words) {
      const synonyms = this.semanticSynonyms.get(word);
      if (synonyms) {
        for (const synonym of synonyms) {
          expanded.push(query.replace(new RegExp(word, 'gi'), synonym));
        }
      }
    }
    
    return [...new Set(expanded)];
  }

  /**
   * Obtiene productos relacionados para cross-selling
   */
  static getRelatedProducts(category: string): string[] {
    return this.relatedProducts.get(category) || [];
  }

  /**
   * Genera queries alternativas basadas en el contexto
   */
  static generateAlternativeQueries(originalQuery: string, intent: IntentType): string[] {
    const alternatives: string[] = [];
    const lowerQuery = originalQuery.toLowerCase();
    
    if (intent === 'recommendation') {
      // Agregar variaciones de recomendacion
      if (!lowerQuery.includes('mejor')) {
        alternatives.push(`mejor ${originalQuery}`);
      }
      if (!lowerQuery.includes('recomendado')) {
        alternatives.push(`${originalQuery} recomendado`);
      }
      if (!lowerQuery.includes('top')) {
        alternatives.push(`top ${originalQuery}`);
      }
    }
    
    if (intent === 'search') {
      // Agregar variaciones de busqueda
      alternatives.push(`comprar ${originalQuery}`);
      alternatives.push(`${originalQuery} disponible`);
    }
    
    return alternatives;
  }
}


// ============================================================================
// CLASE AUXILIAR: SPELLING CORRECTOR
// Corrector ortografico especializado en tecnologia
// ============================================================================

export class TechSpellingCorrector {
  
  // Diccionario de correcciones comunes en tecnologia
  private static readonly corrections: Map<string, string> = new Map([
    // Laptops
    ['lapto', 'laptop'], ['laptos', 'laptops'], ['laptot', 'laptop'],
    ['leptop', 'laptop'], ['laptob', 'laptop'], ['notbook', 'notebook'],
    ['notebuk', 'notebook'], ['portatíl', 'portatil'], ['ultrabok', 'ultrabook'],
    ['macbok', 'macbook'], ['mackbook', 'macbook'], ['thinkpat', 'thinkpad'],
    
    // Moviles
    ['smartfone', 'smartphone'], ['smartphon', 'smartphone'], ['iphone', 'iphone'],
    ['ifone', 'iphone'], ['aifon', 'iphone'], ['samung', 'samsung'],
    ['samsun', 'samsung'], ['xiaome', 'xiaomi'], ['huawey', 'huawei'],
    ['huawei', 'huawei'], ['oneplus', 'oneplus'], ['wanplus', 'oneplus'],
    
    // Componentes
    ['procesador', 'procesador'], ['prosesador', 'procesador'], ['cpu', 'cpu'],
    ['grafica', 'grafica'], ['grafika', 'grafica'], ['gpu', 'gpu'],
    ['nvidia', 'nvidia'], ['nvidea', 'nvidia'], ['nvdia', 'nvidia'],
    ['geforce', 'geforce'], ['geforse', 'geforce'], ['radeon', 'radeon'],
    ['radion', 'radeon'], ['ryzen', 'ryzen'], ['raizen', 'ryzen'],
    
    // Perifericos
    ['teclao', 'teclado'], ['tecaldo', 'teclado'], ['keybord', 'keyboard'],
    ['keyboad', 'keyboard'], ['keyboar', 'keyboard'], ['mause', 'mouse'],
    ['mousse', 'mouse'], ['raton', 'raton'], ['auriculars', 'auriculares'],
    ['auricualres', 'auriculares'], ['headphons', 'headphones'],
    
    // Monitores
    ['monito', 'monitor'], ['monitr', 'monitor'], ['pantala', 'pantalla'],
    ['dispaly', 'display'], ['ultrawide', 'ultrawide'], ['ultrawaid', 'ultrawide'],
    
    // Marcas
    ['logitec', 'logitech'], ['lojitech', 'logitech'], ['razer', 'razer'],
    ['raiser', 'razer'], ['corsiar', 'corsair'], ['corsari', 'corsair'],
    ['steelseries', 'steelseries'], ['stilseries', 'steelseries'],
    ['hyperx', 'hyperx'], ['hiperx', 'hyperx'], ['asus', 'asus'],
    ['azus', 'asus'], ['acer', 'acer'], ['azer', 'acer'],
    ['lenovo', 'lenovo'], ['lenobvo', 'lenovo'], ['dell', 'dell'],
    ['del', 'dell'], ['msi', 'msi'], ['gigabyte', 'gigabyte'],
    ['gigabite', 'gigabyte'], ['asrock', 'asrock'], ['azrock', 'asrock'],
    
    // Almacenamiento
    ['ssd', 'ssd'], ['hdd', 'hdd'], ['nvme', 'nvme'], ['emvme', 'nvme'],
    ['pendrive', 'pendrive'], ['pendraiv', 'pendrive'], ['usb', 'usb'],
    
    // Audio
    ['microfno', 'microfono'], ['microono', 'microfono'], ['altavos', 'altavoces'],
    ['speakr', 'speaker'], ['bose', 'bose'], ['bos', 'bose'],
    ['sennheiser', 'sennheiser'], ['senheiser', 'sennheiser'],
    
    // Gaming
    ['gamin', 'gaming'], ['geiming', 'gaming'], ['gamer', 'gamer'],
    ['geimer', 'gamer'], ['playstation', 'playstation'], ['pleisteision', 'playstation'],
    ['xbox', 'xbox'], ['exbox', 'xbox'], ['nintendo', 'nintendo'],
    ['nintento', 'nintendo'], ['switch', 'switch'], ['suitch', 'switch'],
    
    // Redes
    ['router', 'router'], ['ruter', 'router'], ['wifi', 'wifi'],
    ['waifi', 'wifi'], ['bluetooth', 'bluetooth'], ['blutooth', 'bluetooth'],
    ['bluethooth', 'bluetooth']
  ]);

  /**
   * Corrige errores ortograficos en el texto
   */
  static correct(text: string): string {
    let corrected = text.toLowerCase();
    
    for (const [wrong, right] of this.corrections) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    return corrected;
  }

  /**
   * Sugiere correcciones para una palabra
   */
  static suggest(word: string): string | null {
    const lower = word.toLowerCase();
    return this.corrections.get(lower) || null;
  }

  /**
   * Verifica si una palabra tiene errores conocidos
   */
  static hasKnownError(word: string): boolean {
    return this.corrections.has(word.toLowerCase());
  }
}


// ============================================================================
// CLASE AUXILIAR: PRODUCT ATTRIBUTE EXTRACTOR
// Extrae atributos especificos de productos del texto
// ============================================================================

export class ProductAttributeExtractor {
  
  /**
   * Extrae atributos de pantalla/monitor
   */
  static extractScreenAttributes(text: string): {
    size?: string;
    resolution?: string;
    refreshRate?: string;
    panelType?: string;
    curved?: boolean;
  } {
    const attrs: ReturnType<typeof this.extractScreenAttributes> = {};
    
    // Tamaño
    const sizeMatch = text.match(/(\d+\.?\d*)\s*(pulgadas|"|''|inch)/i);
    if (sizeMatch) attrs.size = `${sizeMatch[1]}"`;
    
    // Resolucion
    if (/4k|uhd|2160p|3840/i.test(text)) attrs.resolution = '4K';
    else if (/2k|qhd|1440p|2560/i.test(text)) attrs.resolution = '2K/QHD';
    else if (/fhd|full\s*hd|1080p|1920/i.test(text)) attrs.resolution = 'Full HD';
    else if (/hd|720p|1280/i.test(text)) attrs.resolution = 'HD';
    
    // Tasa de refresco
    const refreshMatch = text.match(/(\d+)\s*(hz|hertz)/i);
    if (refreshMatch) attrs.refreshRate = `${refreshMatch[1]}Hz`;
    
    // Tipo de panel
    if (/\bips\b/i.test(text)) attrs.panelType = 'IPS';
    else if (/\bva\b/i.test(text)) attrs.panelType = 'VA';
    else if (/\boled\b/i.test(text)) attrs.panelType = 'OLED';
    else if (/\btn\b/i.test(text)) attrs.panelType = 'TN';
    else if (/mini\s*led/i.test(text)) attrs.panelType = 'Mini-LED';
    
    // Curvo
    attrs.curved = /curv(o|ed|a)/i.test(text);
    
    return attrs;
  }

  /**
   * Extrae atributos de procesador
   */
  static extractProcessorAttributes(text: string): {
    brand?: string;
    series?: string;
    generation?: string;
    model?: string;
  } {
    const attrs: ReturnType<typeof this.extractProcessorAttributes> = {};
    
    // Intel
    if (/intel|core\s*i/i.test(text)) {
      attrs.brand = 'Intel';
      const seriesMatch = text.match(/core\s*(i[3579])/i);
      if (seriesMatch) attrs.series = seriesMatch[1].toUpperCase();
      const modelMatch = text.match(/(i[3579])[-\s]*(\d{4,5}[a-z]*)/i);
      if (modelMatch) attrs.model = `${modelMatch[1]}-${modelMatch[2]}`;
    }
    
    // AMD
    if (/amd|ryzen/i.test(text)) {
      attrs.brand = 'AMD';
      const seriesMatch = text.match(/ryzen\s*([3579])/i);
      if (seriesMatch) attrs.series = `Ryzen ${seriesMatch[1]}`;
      const modelMatch = text.match(/ryzen\s*[3579]\s*(\d{4}[a-z]*)/i);
      if (modelMatch) attrs.model = modelMatch[1];
    }
    
    // Apple
    if (/apple\s*m[123]|m[123]\s*(pro|max|ultra)?/i.test(text)) {
      attrs.brand = 'Apple';
      const modelMatch = text.match(/m([123])\s*(pro|max|ultra)?/i);
      if (modelMatch) {
        attrs.series = `M${modelMatch[1]}`;
        if (modelMatch[2]) attrs.model = modelMatch[2];
      }
    }
    
    return attrs;
  }

  /**
   * Extrae atributos de GPU
   */
  static extractGPUAttributes(text: string): {
    brand?: string;
    series?: string;
    model?: string;
    vram?: string;
  } {
    const attrs: ReturnType<typeof this.extractGPUAttributes> = {};
    
    // NVIDIA
    if (/nvidia|geforce|rtx|gtx/i.test(text)) {
      attrs.brand = 'NVIDIA';
      if (/rtx\s*(\d{4})/i.test(text)) {
        attrs.series = 'RTX';
        const modelMatch = text.match(/rtx\s*(\d{4})(\s*ti|\s*super)?/i);
        if (modelMatch) attrs.model = `RTX ${modelMatch[1]}${modelMatch[2] || ''}`.trim();
      } else if (/gtx\s*(\d{4})/i.test(text)) {
        attrs.series = 'GTX';
        const modelMatch = text.match(/gtx\s*(\d{4})(\s*ti|\s*super)?/i);
        if (modelMatch) attrs.model = `GTX ${modelMatch[1]}${modelMatch[2] || ''}`.trim();
      }
    }
    
    // AMD
    if (/amd|radeon|rx\s*\d/i.test(text)) {
      attrs.brand = 'AMD';
      attrs.series = 'Radeon RX';
      const modelMatch = text.match(/rx\s*(\d{4})(\s*xt)?/i);
      if (modelMatch) attrs.model = `RX ${modelMatch[1]}${modelMatch[2] || ''}`.trim();
    }
    
    // VRAM
    const vramMatch = text.match(/(\d+)\s*gb\s*(vram|gddr|memoria\s*grafica)/i);
    if (vramMatch) attrs.vram = `${vramMatch[1]}GB`;
    
    return attrs;
  }

  /**
   * Extrae atributos de almacenamiento
   */
  static extractStorageAttributes(text: string): {
    type?: string;
    capacity?: string;
    interface?: string;
  } {
    const attrs: ReturnType<typeof this.extractStorageAttributes> = {};
    
    // Tipo
    if (/\bssd\b/i.test(text)) attrs.type = 'SSD';
    else if (/\bhdd\b|disco\s*duro/i.test(text)) attrs.type = 'HDD';
    else if (/\bnvme\b/i.test(text)) attrs.type = 'NVMe SSD';
    
    // Capacidad
    const capacityMatch = text.match(/(\d+)\s*(tb|gb)/i);
    if (capacityMatch) {
      attrs.capacity = `${capacityMatch[1]}${capacityMatch[2].toUpperCase()}`;
    }
    
    // Interfaz
    if (/nvme|m\.2/i.test(text)) attrs.interface = 'NVMe M.2';
    else if (/sata/i.test(text)) attrs.interface = 'SATA';
    else if (/usb/i.test(text)) attrs.interface = 'USB';
    
    return attrs;
  }

  /**
   * Extrae atributos de RAM
   */
  static extractRAMAttributes(text: string): {
    capacity?: string;
    type?: string;
    speed?: string;
  } {
    const attrs: ReturnType<typeof this.extractRAMAttributes> = {};
    
    // Capacidad
    const capacityMatch = text.match(/(\d+)\s*gb\s*(de\s*)?(ram|memoria)?/i);
    if (capacityMatch) attrs.capacity = `${capacityMatch[1]}GB`;
    
    // Tipo
    if (/ddr5/i.test(text)) attrs.type = 'DDR5';
    else if (/ddr4/i.test(text)) attrs.type = 'DDR4';
    else if (/ddr3/i.test(text)) attrs.type = 'DDR3';
    
    // Velocidad
    const speedMatch = text.match(/(\d{4,5})\s*(mhz|mt\/s)/i);
    if (speedMatch) attrs.speed = `${speedMatch[1]}MHz`;
    
    return attrs;
  }
}


// ============================================================================
// CLASE AUXILIAR: URGENCY DETECTOR
// Detecta nivel de urgencia en la solicitud del usuario
// ============================================================================

export class UrgencyDetector {
  
  // Patrones de urgencia con niveles
  private static readonly urgencyPatterns: Array<{ pattern: RegExp; level: 'critical' | 'high' | 'medium' | 'low' }> = [
    // Urgencia crítica
    { pattern: /urgente|urgentisimo|emergencia|ahora\s*mismo|ya\s*mismo|inmediato|inmediatamente/i, level: 'critical' },
    { pattern: /lo\s*necesito\s*(ya|ahora|hoy)|para\s*hoy|hoy\s*mismo|cuanto\s*antes/i, level: 'critical' },
    { pattern: /asap|urgent|emergency|right\s*now|immediately/i, level: 'critical' },
    
    // Urgencia alta
    { pattern: /para\s*mañana|mañana\s*mismo|lo\s*antes\s*posible|pronto|rapido/i, level: 'high' },
    { pattern: /esta\s*semana|en\s*(\d|un|dos|tres)\s*dias?|cuanto\s*tarda/i, level: 'high' },
    { pattern: /tomorrow|as\s*soon\s*as|quickly|fast|asap/i, level: 'high' },
    
    // Urgencia media
    { pattern: /proxima\s*semana|en\s*una\s*semana|pronto|cuando\s*pueda/i, level: 'medium' },
    { pattern: /next\s*week|soon|when\s*possible/i, level: 'medium' },
    
    // Urgencia baja (solo explorando)
    { pattern: /sin\s*prisa|cuando\s*sea|no\s*hay\s*prisa|solo\s*(mirando|viendo|explorando)/i, level: 'low' },
    { pattern: /just\s*(looking|browsing)|no\s*rush|take\s*your\s*time/i, level: 'low' }
  ];

  /**
   * Detecta el nivel de urgencia del mensaje
   */
  static detect(text: string): {
    level: 'critical' | 'high' | 'medium' | 'low' | 'none';
    indicators: string[];
    needsImmediateAttention: boolean;
  } {
    const indicators: string[] = [];
    let detectedLevel: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
    
    for (const { pattern, level } of this.urgencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        indicators.push(match[0]);
        // Mantener el nivel más alto detectado
        if (detectedLevel === 'none' || 
            this.getLevelPriority(level) > this.getLevelPriority(detectedLevel)) {
          detectedLevel = level;
        }
      }
    }
    
    return {
      level: detectedLevel,
      indicators,
      needsImmediateAttention: detectedLevel === 'critical' || detectedLevel === 'high'
    };
  }

  private static getLevelPriority(level: string): number {
    const priorities: { [key: string]: number } = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1,
      'none': 0
    };
    return priorities[level] || 0;
  }

  /**
   * Genera mensaje de respuesta apropiado segun urgencia
   */
  static getUrgencyResponse(level: 'critical' | 'high' | 'medium' | 'low' | 'none'): string {
    const responses: { [key: string]: string } = {
      'critical': '¡Entendido! Te ayudo de inmediato.',
      'high': 'Perfecto, te muestro las opciones disponibles rápidamente.',
      'medium': 'Sin problema, aquí tienes algunas opciones.',
      'low': 'Claro, tómate tu tiempo para explorar.',
      'none': ''
    };
    return responses[level] || '';
  }
}

// ============================================================================
// CLASE AUXILIAR: NEGATION DETECTOR
// Detecta negaciones y exclusiones en las preferencias del usuario
// ============================================================================

export class NegationDetector {
  
  // Patrones de negacion
  private static readonly negationPatterns = [
    // Español
    { pattern: /no\s+quiero\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /sin\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /nada\s+de\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /que\s+no\s+(?:sea|tenga)\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /evitar\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /excepto\s+(.+?)(?:\.|,|$)/gi, type: 'exception' },
    { pattern: /menos\s+(.+?)(?:\.|,|$)/gi, type: 'exception' },
    { pattern: /pero\s+no\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /nunca\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /odio\s+(.+?)(?:\.|,|$)/gi, type: 'strong_exclusion' },
    { pattern: /detesto\s+(.+?)(?:\.|,|$)/gi, type: 'strong_exclusion' },
    
    // Inglés
    { pattern: /(?:i\s+)?don'?t\s+want\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /without\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /no\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /not\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /avoid\s+(.+?)(?:\.|,|$)/gi, type: 'exclusion' },
    { pattern: /except\s+(.+?)(?:\.|,|$)/gi, type: 'exception' },
    { pattern: /hate\s+(.+?)(?:\.|,|$)/gi, type: 'strong_exclusion' }
  ];

  // Elementos comunes que se excluyen
  private static readonly commonExclusions = new Map<string, string[]>([
    ['rgb', ['rgb', 'luces', 'iluminacion', 'led', 'colores']],
    ['gaming', ['gaming', 'gamer', 'juegos']],
    ['apple', ['apple', 'mac', 'macbook', 'iphone', 'ipad']],
    ['windows', ['windows', 'microsoft', 'pc']],
    ['caro', ['caro', 'premium', 'alta gama', 'expensive']],
    ['barato', ['barato', 'economico', 'budget', 'cheap']],
    ['grande', ['grande', 'big', 'large', 'pesado']],
    ['pequeno', ['pequeno', 'small', 'mini', 'compacto']],
    ['inalambrico', ['inalambrico', 'wireless', 'bluetooth', 'sin cables']],
    ['cable', ['cable', 'cableado', 'wired', 'con cable']],
    ['tactil', ['tactil', 'touch', 'touchscreen', 'pantalla tactil']],
    ['mecanico', ['mecanico', 'mechanical', 'switches']],
    ['membrana', ['membrana', 'membrane']],
    ['curvo', ['curvo', 'curved']],
    ['plano', ['plano', 'flat']]
  ]);

  /**
   * Detecta negaciones y exclusiones en el texto
   */
  static detect(text: string): {
    exclusions: string[];
    exceptions: string[];
    strongExclusions: string[];
    excludedCategories: string[];
    excludedBrands: string[];
    excludedFeatures: string[];
  } {
    const result = {
      exclusions: [] as string[],
      exceptions: [] as string[],
      strongExclusions: [] as string[],
      excludedCategories: [] as string[],
      excludedBrands: [] as string[],
      excludedFeatures: [] as string[]
    };
    
    for (const { pattern, type } of this.negationPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const excluded = match[1]?.trim().toLowerCase();
        if (excluded) {
          if (type === 'exclusion') {
            result.exclusions.push(excluded);
          } else if (type === 'exception') {
            result.exceptions.push(excluded);
          } else if (type === 'strong_exclusion') {
            result.strongExclusions.push(excluded);
          }
          
          // Categorizar la exclusion
          this.categorizeExclusion(excluded, result);
        }
      }
    }
    
    // Eliminar duplicados
    result.exclusions = [...new Set(result.exclusions)];
    result.exceptions = [...new Set(result.exceptions)];
    result.strongExclusions = [...new Set(result.strongExclusions)];
    result.excludedCategories = [...new Set(result.excludedCategories)];
    result.excludedBrands = [...new Set(result.excludedBrands)];
    result.excludedFeatures = [...new Set(result.excludedFeatures)];
    
    return result;
  }

  private static categorizeExclusion(
    excluded: string,
    result: ReturnType<typeof NegationDetector.detect>
  ): void {
    // Verificar si es una marca conocida
    const knownBrands = ['apple', 'samsung', 'xiaomi', 'huawei', 'sony', 'lg', 'asus', 
                         'acer', 'dell', 'hp', 'lenovo', 'msi', 'razer', 'logitech',
                         'corsair', 'nvidia', 'amd', 'intel'];
    for (const brand of knownBrands) {
      if (excluded.includes(brand)) {
        result.excludedBrands.push(brand);
        return;
      }
    }
    
    // Verificar si es una caracteristica comun
    for (const [key, synonyms] of this.commonExclusions) {
      for (const synonym of synonyms) {
        if (excluded.includes(synonym)) {
          result.excludedFeatures.push(key);
          return;
        }
      }
    }
    
    // Verificar si es una categoria
    const categories = ['laptop', 'desktop', 'movil', 'tablet', 'monitor', 'teclado',
                        'raton', 'auriculares', 'altavoces'];
    for (const category of categories) {
      if (excluded.includes(category)) {
        result.excludedCategories.push(category);
        return;
      }
    }
  }

  /**
   * Filtra resultados basandose en las exclusiones detectadas
   */
  static shouldExclude(item: { brand?: string; category?: string; features?: string[] }, 
                       exclusions: ReturnType<typeof NegationDetector.detect>): boolean {
    // Verificar marca
    if (item.brand && exclusions.excludedBrands.includes(item.brand.toLowerCase())) {
      return true;
    }
    
    // Verificar categoria
    if (item.category && exclusions.excludedCategories.includes(item.category.toLowerCase())) {
      return true;
    }
    
    // Verificar caracteristicas
    if (item.features) {
      for (const feature of item.features) {
        if (exclusions.excludedFeatures.includes(feature.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }
}


// ============================================================================
// CLASE AUXILIAR: CONVERSATION CONTEXT TRACKER
// Rastrea el contexto de la conversacion para mejorar resultados
// ============================================================================

export class ConversationContextTracker {
  private history: ConversationTurn[] = [];
  private userPreferences: Map<string, any> = new Map();
  private mentionedProducts: Set<string> = new Set();
  private mentionedCategories: Set<string> = new Set();
  private mentionedBrands: Set<string> = new Set();
  private excludedItems: Set<string> = new Set();
  private priceContext?: { min?: number; max?: number };

  /**
   * Agrega un turno a la conversacion
   */
  addTurn(turn: ConversationTurn): void {
    this.history.push(turn);
    
    // Actualizar contexto basado en el turno
    if (turn.extractedKeywords) {
      // Agregar categorias mencionadas
      for (const cat of turn.extractedKeywords.categories) {
        this.mentionedCategories.add(cat);
      }
      
      // Agregar marcas mencionadas
      for (const brand of turn.extractedKeywords.brands) {
        this.mentionedBrands.add(brand);
      }
      
      // Actualizar preferencias
      if (turn.extractedKeywords.preferences) {
        for (const usage of turn.extractedKeywords.preferences.usage) {
          this.userPreferences.set('usage', usage);
        }
        if (turn.extractedKeywords.preferences.quality !== 'any') {
          this.userPreferences.set('quality', turn.extractedKeywords.preferences.quality);
        }
      }
      
      // Actualizar contexto de precio
      if (turn.extractedKeywords.priceRange) {
        this.priceContext = turn.extractedKeywords.priceRange;
      }
    }
    
    // Rastrear productos mencionados en respuestas del bot
    if (turn.role === 'assistant' && turn.mentionedProducts) {
      for (const product of turn.mentionedProducts) {
        this.mentionedProducts.add(product);
      }
    }
  }

  /**
   * Obtiene el contexto acumulado de la conversacion
   */
  getContext(): ConversationContext {
    return {
      turnCount: this.history.length,
      mentionedCategories: Array.from(this.mentionedCategories),
      mentionedBrands: Array.from(this.mentionedBrands),
      mentionedProducts: Array.from(this.mentionedProducts),
      excludedItems: Array.from(this.excludedItems),
      userPreferences: Object.fromEntries(this.userPreferences),
      priceContext: this.priceContext,
      lastIntent: this.history.length > 0 
        ? this.history[this.history.length - 1].extractedKeywords?.intent 
        : undefined,
      conversationTopics: this.extractTopics()
    };
  }

  /**
   * Detecta si el usuario esta haciendo una pregunta de seguimiento
   */
  isFollowUpQuestion(text: string): boolean {
    const followUpPatterns = [
      /^y\s+(que|cual|como)/i,
      /^(ese|esa|esos|esas|este|esta|estos|estas)\b/i,
      /^(el|la|los|las)\s+(mismo|misma|primero|segundo|tercero)/i,
      /^algo\s+(mas|mejor|similar|parecido)/i,
      /^(otra|otro|otras|otros)\s+(opcion|alternativa)/i,
      /^que\s+tal\s+(el|la|ese|esa)/i,
      /^(me\s+)?gusta\s+(ese|esa|el|la)/i,
      /^(no\s+)?me\s+convence/i,
      /^(mas|menos)\s+(caro|barato|potente|grande)/i,
      /^tiene(s|n)?\s+(algo|otro)/i,
      /^what\s+about/i,
      /^how\s+about/i,
      /^and\s+(what|which|how)/i
    ];
    
    return followUpPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Resuelve referencias a productos mencionados anteriormente
   */
  resolveReference(text: string): string | null {
    const referencePatterns = [
      { pattern: /^(ese|esa|este|esta)\b/i, index: -1 },
      { pattern: /(el|la)\s+primer[oa]?\b/i, index: 0 },
      { pattern: /(el|la)\s+segund[oa]?\b/i, index: 1 },
      { pattern: /(el|la)\s+tercer[oa]?\b/i, index: 2 },
      { pattern: /(el|la)\s+cuart[oa]?\b/i, index: 3 },
      { pattern: /(el|la)\s+[uú]ltim[oa]?\b/i, index: -1 }
    ];
    
    const products = Array.from(this.mentionedProducts);
    
    for (const { pattern, index } of referencePatterns) {
      if (pattern.test(text)) {
        const resolvedIndex = index === -1 ? products.length - 1 : index;
        if (resolvedIndex >= 0 && resolvedIndex < products.length) {
          return products[resolvedIndex];
        }
      }
    }
    
    return null;
  }

  /**
   * Extrae los temas principales de la conversacion
   */
  private extractTopics(): string[] {
    const topics: string[] = [];
    
    if (this.mentionedCategories.size > 0) {
      topics.push(...Array.from(this.mentionedCategories));
    }
    
    const usagePrefs = this.userPreferences.get('usage');
    if (usagePrefs) {
      topics.push(usagePrefs);
    }
    
    return [...new Set(topics)];
  }

  /**
   * Agrega un item a la lista de exclusiones
   */
  addExclusion(item: string): void {
    this.excludedItems.add(item.toLowerCase());
  }

  /**
   * Limpia el historial de conversacion
   */
  clear(): void {
    this.history = [];
    this.userPreferences.clear();
    this.mentionedProducts.clear();
    this.mentionedCategories.clear();
    this.mentionedBrands.clear();
    this.excludedItems.clear();
    this.priceContext = undefined;
  }

  /**
   * Obtiene el historial completo
   */
  getHistory(): ConversationTurn[] {
    return [...this.history];
  }

  /**
   * Obtiene los ultimos N turnos
   */
  getRecentTurns(n: number): ConversationTurn[] {
    return this.history.slice(-n);
  }
}

// Interfaces para el tracker de conversacion
interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  extractedKeywords?: ExtractedKeywords;
  mentionedProducts?: string[];
}

interface ConversationContext {
  turnCount: number;
  mentionedCategories: string[];
  mentionedBrands: string[];
  mentionedProducts: string[];
  excludedItems: string[];
  userPreferences: { [key: string]: any };
  priceContext?: { min?: number; max?: number };
  lastIntent?: IntentType;
  conversationTopics: string[];
}
