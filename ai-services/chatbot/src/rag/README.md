# RAG (Retrieval Augmented Generation)

Esta carpeta contiene los componentes relacionados con la implementación de RAG (Retrieval Augmented Generation) para el chatbot conversacional con Ollama.

## Componentes

### KeywordExtractor

Clase responsable de extraer información estructurada de los mensajes del usuario:

- **Categorías de productos**: Identifica tipos de productos mencionados (laptop, móvil, tablet, etc.)
- **Marcas**: Detecta marcas específicas mencionadas en el mensaje
- **Especificaciones técnicas**: Extrae especificaciones como RAM, almacenamiento, procesador, etc.
- **Keywords generales**: Genera keywords para búsqueda en el catálogo de productos

#### Uso

```typescript
import { KeywordExtractor } from './rag/KeywordExtractor';

const extractor = new KeywordExtractor();
const result = extractor.extractKeywords('Busco una laptop Dell con 16GB de RAM');

console.log(result.categories);      // ['laptop', 'componentes']
console.log(result.brands);          // ['dell']
console.log(result.technicalSpecs);  // { ram: '16GB de RAM' }
console.log(result.generalKeywords); // ['laptop', 'dell', '16gb', 'ram', ...]
```

#### Características

- **Sin dependencias de Python**: Usa únicamente la librería 'natural' de Node.js
- **Soporte para español**: Optimizado para detectar términos en español
- **Normalización de texto**: Elimina acentos y normaliza el texto para mejor matching
- **Stopwords**: Filtra palabras vacías comunes en español
- **Patrones técnicos**: Usa regex para detectar especificaciones técnicas complejas

## Próximos componentes

- **ProductRetriever**: Recuperará productos del ProductKnowledgeBase basándose en los keywords extraídos

### ProductContextFormatter

Clase responsable de formatear productos recuperados en un contexto estructurado para inyectar en el prompt de Ollama.

#### Características

- **Formateo estructurado**: Incluye nombre, SKU, marca, precio y disponibilidad
- **Descripción truncada**: Limita descripciones a 200 caracteres máximo
- **Especificaciones técnicas**: Incluye hasta 5 especificaciones clave
- **Manejo de casos vacíos**: Proporciona mensaje apropiado cuando no hay productos
- **Formato compacto**: Opción de resumen rápido para muchos productos

#### Uso

```typescript
import { ProductContextFormatter } from './rag/ProductContextFormatter';
import { ProductInfo } from '../knowledge/ProductKnowledgeBase';

// Formatear lista de productos
const products: ProductInfo[] = [...]; // productos recuperados
const context = ProductContextFormatter.formatProductContext(products);

// Formatear un único producto
const singleContext = ProductContextFormatter.formatSingleProduct(product);

// Generar resumen compacto
const summary = ProductContextFormatter.formatCompactSummary(products);
```

#### Ejemplo de salida

```
PRODUCTOS DISPONIBLES:

1. Laptop Dell XPS 13
   - SKU: DELL-XPS13-001
   - Marca: Dell
   - Precio: €1299.99
   - Disponibilidad: En stock ✓
   - Descripción: Ultrabook premium con pantalla InfinityEdge de 13.3 pulgadas, procesador Intel Core i7 de 11ª generación y diseño ultradelgado...
   - Especificaciones técnicas:
     * Procesador: Intel Core i7-1165G7
     * Ram: 16GB DDR4
     * Almacenamiento: 512GB SSD NVMe
     * Pantalla: 13.3" FHD (1920x1080)
     * Sistema Operativo: Windows 11 Pro
```
