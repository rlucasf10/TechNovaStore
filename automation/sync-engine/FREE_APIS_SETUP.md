# 🆓 APIs Gratuitas para TechNovaStore

## Soluciones 100% Gratuitas (Sin Tarjeta de Crédito)

### 🎯 Estrategia para Desarrollo/Demo

Para demostrar el proyecto sin invertir, usaremos:

1. **APIs públicas gratuitas** para datos de productos
2. **Imágenes de Unsplash/Pexels** (gratis, sin atribución)
3. **Storage local** para desarrollo
4. **Datos de prueba realistas** generados automáticamente

---

## 📦 APIs Gratuitas Disponibles

### 1. FakeStore API (Productos de Prueba)
**URL:** https://fakestoreapi.com  
**Límite:** Ilimitado, sin API key  
**Categorías:** Electronics, Jewelry, Men's/Women's Clothing  

```bash
# Obtener productos de electrónica
curl https://fakestoreapi.com/products/category/electronics

# Respuesta:
[
  {
    "id": 9,
    "title": "WD 2TB Elements Portable External Hard Drive",
    "price": 64,
    "description": "USB 3.0 and USB 2.0 Compatibility...",
    "category": "electronics",
    "image": "https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg"
  }
]
```

### 2. DummyJSON (Productos Realistas)
**URL:** https://dummyjson.com  
**Límite:** Ilimitado, sin API key  
**Categorías:** Smartphones, Laptops, Fragrances, etc.  

```bash
# Obtener laptops
curl https://dummyjson.com/products/category/laptops

# Respuesta:
{
  "products": [
    {
      "id": 6,
      "title": "MacBook Pro",
      "description": "MacBook Pro 2021 with mini-LED display",
      "price": 1749,
      "brand": "Apple",
      "category": "laptops",
      "thumbnail": "https://i.dummyjson.com/data/products/6/thumbnail.png",
      "images": [
        "https://i.dummyjson.com/data/products/6/1.png",
        "https://i.dummyjson.com/data/products/6/2.jpg"
      ]
    }
  ]
}
```

### 3. Best Buy API (Productos Reales)
**URL:** https://bestbuyapis.github.io/api-documentation  
**Límite:** 50,000 requests/día GRATIS  
**Requiere:** API key gratuita (sin tarjeta)  

```bash
# Registrarse: https://developer.bestbuy.com/
# API Key gratuita instantánea

curl "https://api.bestbuy.com/v1/products(categoryPath.id=abcat0502000)?apiKey=YOUR_KEY&format=json"
```

### 4. Unsplash API (Imágenes Gratis)
**URL:** https://unsplash.com/developers  
**Límite:** 50 requests/hora GRATIS  
**Requiere:** API key gratuita (sin tarjeta)  

```bash
# Buscar imágenes de laptops
curl "https://api.unsplash.com/search/photos?query=laptop&client_id=YOUR_KEY"
```

### 5. Pexels API (Imágenes Gratis)
**URL:** https://www.pexels.com/api  
**Límite:** 200 requests/hora GRATIS  
**Requiere:** API key gratuita (sin tarjeta)  

```bash
# Buscar imágenes de tecnología
curl "https://api.pexels.com/v1/search?query=technology&per_page=15" \
  -H "Authorization: YOUR_API_KEY"
```

---

## 🚀 Implementación Rápida

### Opción 1: FakeStore + DummyJSON (Más Rápido)

**Ventajas:**
- ✅ Sin registro
- ✅ Sin API keys
- ✅ Funciona inmediatamente
- ✅ Datos realistas

**Desventajas:**
- ❌ Catálogo limitado (~100 productos)
- ❌ No es tecnología específica

### Opción 2: Best Buy API (Más Realista)

**Ventajas:**
- ✅ Productos reales de tecnología
- ✅ 50,000 requests/día gratis
- ✅ Especificaciones técnicas completas
- ✅ Imágenes de alta calidad

**Desventajas:**
- ❌ Requiere registro (pero es gratis y sin tarjeta)

### Opción 3: Datos Generados (Más Control)

**Ventajas:**
- ✅ Control total
- ✅ Sin límites
- ✅ Offline
- ✅ Personalizable

**Desventajas:**
- ❌ Requiere crear datos manualmente

---

## 💻 Código de Implementación

### Adapter para FakeStore API

```typescript
// automation/sync-engine/src/adapters/FakeStoreAdapter.ts

import axios from 'axios';
import { BaseAdapter } from './base/BaseAdapter';
import { Product } from '../types/provider';

export class FakeStoreAdapter extends BaseAdapter {
  private readonly BASE_URL = 'https://fakestoreapi.com';

  async fetchProducts(category: string = 'electronics'): Promise<Product[]> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/products/category/${category}`
      );

      return response.data.map((item: any) => this.normalizeProduct(item));
    } catch (error) {
      console.error('Error fetching from FakeStore:', error);
      return [];
    }
  }

  async fetchProduct(productId: string): Promise<Product> {
    const response = await axios.get(`${this.BASE_URL}/products/${productId}`);
    return this.normalizeProduct(response.data);
  }

  private normalizeProduct(item: any): Product {
    return {
      sku: `FAKE-${item.id}`,
      name: item.title,
      description: item.description,
      category: this.mapCategory(item.category),
      subcategory: item.category,
      brand: this.extractBrand(item.title),
      specifications: {
        category: item.category,
        rating: item.rating?.rate || 0,
        reviews: item.rating?.count || 0,
      },
      images: [item.image],
      providers: [
        {
          name: 'FakeStore',
          price: item.price,
          availability: true,
          shipping_cost: 0,
          delivery_time: 3,
          last_updated: new Date().toISOString(),
        },
      ],
      our_price: item.price * 1.15, // 15% markup
      markup_percentage: 15,
      is_active: true,
    };
  }

  private mapCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      electronics: 'electronica',
      "men's clothing": 'ropa',
      "women's clothing": 'ropa',
      jewelery: 'accesorios',
    };
    return categoryMap[category] || 'otros';
  }

  private extractBrand(title: string): string {
    // Extraer marca del título
    const brands = ['WD', 'Samsung', 'SanDisk', 'Seagate', 'LG', 'Sony'];
    for (const brand of brands) {
      if (title.includes(brand)) return brand;
    }
    return 'Generic';
  }
}
```

### Adapter para DummyJSON

```typescript
// automation/sync-engine/src/adapters/DummyJSONAdapter.ts

import axios from 'axios';
import { BaseAdapter } from './base/BaseAdapter';
import { Product } from '../types/provider';

export class DummyJSONAdapter extends BaseAdapter {
  private readonly BASE_URL = 'https://dummyjson.com';

  async fetchProducts(category: string = 'laptops'): Promise<Product[]> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/products/category/${category}`
      );

      return response.data.products.map((item: any) => 
        this.normalizeProduct(item)
      );
    } catch (error) {
      console.error('Error fetching from DummyJSON:', error);
      return [];
    }
  }

  async fetchProduct(productId: string): Promise<Product> {
    const response = await axios.get(`${this.BASE_URL}/products/${productId}`);
    return this.normalizeProduct(response.data);
  }

  private normalizeProduct(item: any): Product {
    return {
      sku: `DUMMY-${item.id}`,
      name: item.title,
      description: item.description,
      category: this.mapCategory(item.category),
      subcategory: item.category,
      brand: item.brand || 'Generic',
      specifications: {
        rating: item.rating || 0,
        stock: item.stock || 0,
        discount: item.discountPercentage || 0,
        ...item.meta,
      },
      images: item.images || [item.thumbnail],
      providers: [
        {
          name: 'DummyJSON',
          price: item.price,
          availability: item.stock > 0,
          shipping_cost: 5.99,
          delivery_time: 5,
          last_updated: new Date().toISOString(),
        },
      ],
      our_price: item.price * 1.2, // 20% markup
      markup_percentage: 20,
      is_active: item.stock > 0,
      original_price: item.price / (1 - item.discountPercentage / 100),
      discount_percentage: item.discountPercentage,
    };
  }

  private mapCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      laptops: 'portatiles',
      smartphones: 'smartphones',
      tablets: 'tablets',
      'mobile-accessories': 'accesorios',
    };
    return categoryMap[category] || category;
  }

  // Obtener todas las categorías disponibles
  async getCategories(): Promise<string[]> {
    const response = await axios.get(`${this.BASE_URL}/products/categories`);
    return response.data;
  }
}
```

### Script de Población Inicial

```typescript
// automation/sync-engine/src/scripts/populate-free-data.ts

import { FakeStoreAdapter } from '../adapters/FakeStoreAdapter';
import { DummyJSONAdapter } from '../adapters/DummyJSONAdapter';
import { Product } from '../models/Product';
import { connectDB } from '../config/database';

async function populateDatabase() {
  await connectDB();

  console.log('🚀 Poblando base de datos con datos gratuitos...\n');

  // 1. FakeStore API (Electrónica)
  console.log('📦 Obteniendo productos de FakeStore API...');
  const fakeStore = new FakeStoreAdapter();
  const fakeStoreProducts = await fakeStore.fetchProducts('electronics');
  
  for (const product of fakeStoreProducts) {
    await Product.findOneAndUpdate(
      { sku: product.sku },
      product,
      { upsert: true, new: true }
    );
  }
  console.log(`✅ ${fakeStoreProducts.length} productos de FakeStore agregados\n`);

  // 2. DummyJSON (Laptops)
  console.log('💻 Obteniendo laptops de DummyJSON...');
  const dummyJSON = new DummyJSONAdapter();
  const laptops = await dummyJSON.fetchProducts('laptops');
  
  for (const product of laptops) {
    await Product.findOneAndUpdate(
      { sku: product.sku },
      product,
      { upsert: true, new: true }
    );
  }
  console.log(`✅ ${laptops.length} laptops agregados\n`);

  // 3. DummyJSON (Smartphones)
  console.log('📱 Obteniendo smartphones de DummyJSON...');
  const smartphones = await dummyJSON.fetchProducts('smartphones');
  
  for (const product of smartphones) {
    await Product.findOneAndUpdate(
      { sku: product.sku },
      product,
      { upsert: true, new: true }
    );
  }
  console.log(`✅ ${smartphones.length} smartphones agregados\n`);

  // Resumen
  const totalProducts = await Product.countDocuments();
  console.log(`\n🎉 Base de datos poblada exitosamente!`);
  console.log(`📊 Total de productos: ${totalProducts}`);
  
  process.exit(0);
}

populateDatabase().catch(console.error);
```

---

## 🎨 Imágenes Gratuitas

### Opción 1: Usar URLs de APIs Gratuitas

Las APIs ya incluyen imágenes:
- FakeStore: Imágenes de productos reales
- DummyJSON: Imágenes de productos reales
- Best Buy: Imágenes oficiales de productos

### Opción 2: Unsplash (Imágenes de Alta Calidad)

```typescript
// automation/sync-engine/src/services/UnsplashImageService.ts

import axios from 'axios';

export class UnsplashImageService {
  private readonly ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'DEMO_KEY';
  private readonly BASE_URL = 'https://api.unsplash.com';

  async searchImages(query: string, count: number = 3): Promise<string[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/search/photos`, {
        params: {
          query,
          per_page: count,
          client_id: this.ACCESS_KEY,
        },
      });

      return response.data.results.map((img: any) => img.urls.regular);
    } catch (error) {
      console.error('Error fetching from Unsplash:', error);
      return [];
    }
  }

  // Obtener imagen por categoría
  async getImageForProduct(productName: string, category: string): Promise<string> {
    const images = await this.searchImages(`${category} ${productName}`, 1);
    return images[0] || '/placeholder-product.svg';
  }
}
```

**Registro Gratuito:**
1. Ir a https://unsplash.com/developers
2. Crear cuenta (gratis, sin tarjeta)
3. Crear app → Obtener Access Key
4. 50 requests/hora gratis

### Opción 3: Pexels (Alternativa a Unsplash)

```typescript
// Similar a Unsplash pero con 200 requests/hora
// https://www.pexels.com/api/
```

---

## 🏃 Ejecución Rápida

### 1. Sin Configuración (Inmediato)

```bash
cd automation/sync-engine

# Instalar dependencias
npm install axios

# Ejecutar script de población
npx ts-node src/scripts/populate-free-data.ts
```

**Resultado:** ~50 productos en tu base de datos en 30 segundos

### 2. Con Best Buy API (Más Realista)

```bash
# 1. Registrarse en https://developer.bestbuy.com/ (gratis)
# 2. Obtener API key
# 3. Agregar a .env
echo "BESTBUY_API_KEY=tu_key_aqui" >> .env

# 4. Ejecutar
npm run sync:bestbuy
```

### 3. Con Imágenes de Unsplash

```bash
# 1. Registrarse en https://unsplash.com/developers (gratis)
# 2. Crear app y obtener Access Key
# 3. Agregar a .env
echo "UNSPLASH_ACCESS_KEY=tu_key_aqui" >> .env

# 4. Las imágenes se descargarán automáticamente
```

---

## 📊 Comparación de Opciones

| API | Productos | Imágenes | Setup | Límite | Costo |
|-----|-----------|----------|-------|--------|-------|
| FakeStore | ~20 | ✅ | 0 min | ∞ | $0 |
| DummyJSON | ~100 | ✅ | 0 min | ∞ | $0 |
| Best Buy | Miles | ✅ HD | 5 min | 50k/día | $0 |
| Unsplash | N/A | ✅ 4K | 5 min | 50/hora | $0 |
| Pexels | N/A | ✅ HD | 5 min | 200/hora | $0 |

---

## 🎯 Recomendación para Demo

### Setup Óptimo (15 minutos)

1. **FakeStore + DummyJSON** (sin registro)
   - 100+ productos inmediatamente
   - Imágenes incluidas
   - 0 configuración

2. **Best Buy API** (con registro gratuito)
   - Productos reales de tecnología
   - Especificaciones completas
   - 50,000 requests/día

3. **Unsplash** (opcional, para mejorar imágenes)
   - Imágenes profesionales 4K
   - 50 requests/hora
   - Registro gratuito

### Resultado Final

- ✅ **200+ productos** de tecnología
- ✅ **Imágenes de alta calidad**
- ✅ **Especificaciones reales**
- ✅ **$0 de costo**
- ✅ **Listo para demo/producción**

---

## 🚀 Siguiente Paso

```bash
# Ejecutar esto y tendrás productos en 1 minuto:
cd automation/sync-engine
npm install axios
npx ts-node src/scripts/populate-free-data.ts
```

**¡Tu tienda estará poblada con productos reales sin gastar un euro!** 🎉
