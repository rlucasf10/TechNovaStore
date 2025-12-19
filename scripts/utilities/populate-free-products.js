/**
 * Script para poblar la base de datos con productos gratuitos
 * 
 * Usa APIs gratuitas sin necesidad de API keys:
 * - FakeStore API
 * - DummyJSON
 * 
 * Ejecutar: node scripts/utilitieses pa/populate-free-products.js
 */

const axios = require('axios');
const mongoose = require('mongoose');

// Configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27088/technovastore?authSource=admin';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

// Schema simplificado de producto
const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  category: String,
  subcategory: String,
  brand: String,
  specifications: mongoose.Schema.Types.Mixed,
  images: [String],
  providers: [{
    name: String,
    price: Number,
    availability: Boolean,
    shipping_cost: Number,
    delivery_time: Number,
    last_updated: Date,
  }],
  our_price: Number,
  markup_percentage: Number,
  is_active: Boolean,
  original_price: Number,
  discount_percentage: Number,
  rating: Number,
  review_count: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);

/**
 * Obtener productos de FakeStore API
 */
async function fetchFromFakeStore() {
  console.log('\n📦 Obteniendo productos de FakeStore API...');
  
  try {
    const response = await axios.get('https://fakestoreapi.com/products/category/electronics');
    
    const products = response.data.map(item => ({
      sku: `FS-${item.id}`,
      name: item.title,
      description: item.description,
      category: 'electronica',
      subcategory: 'accesorios',
      brand: extractBrand(item.title),
      specifications: {
        source: 'FakeStore API',
        original_category: item.category,
      },
      images: [item.image],
      providers: [{
        name: 'FakeStore',
        price: item.price,
        availability: true,
        shipping_cost: 0,
        delivery_time: 3,
        last_updated: new Date(),
      }],
      our_price: Math.round(item.price * 1.15 * 100) / 100,
      markup_percentage: 15,
      is_active: true,
      rating: item.rating?.rate || 4.0,
      review_count: item.rating?.count || 0,
    }));
    
    console.log(`✅ ${products.length} productos de FakeStore obtenidos`);
    return products;
  } catch (error) {
    console.error('❌ Error en FakeStore API:', error.message);
    return [];
  }
}

/**
 * Obtener productos de DummyJSON
 */
async function fetchFromDummyJSON(category) {
  console.log(`\n💻 Obteniendo ${category} de DummyJSON...`);
  
  try {
    const response = await axios.get(`https://dummyjson.com/products/category/${category}`);
    
    const products = response.data.products.map(item => ({
      sku: `DJ-${category.toUpperCase()}-${item.id}`,
      name: item.title,
      description: item.description,
      category: mapCategory(category),
      subcategory: category,
      brand: item.brand || 'Generic',
      specifications: {
        source: 'DummyJSON API',
        stock: item.stock,
        weight: item.weight,
        dimensions: item.dimensions,
        warranty: item.warrantyInformation,
        shipping: item.shippingInformation,
        return_policy: item.returnPolicy,
      },
      images: item.images || [item.thumbnail],
      providers: [{
        name: 'DummyJSON',
        price: item.price,
        availability: item.stock > 0,
        shipping_cost: 5.99,
        delivery_time: 5,
        last_updated: new Date(),
      }],
      our_price: Math.round(item.price * 1.2 * 100) / 100,
      markup_percentage: 20,
      is_active: item.stock > 0,
      original_price: item.discountPercentage > 0
        ? Math.round((item.price / (1 - item.discountPercentage / 100)) * 100) / 100
        : undefined,
      discount_percentage: item.discountPercentage || 0,
      rating: item.rating || 4.0,
      review_count: item.reviews?.length || 0,
    }));
    
    console.log(`✅ ${products.length} ${category} obtenidos`);
    return products;
  } catch (error) {
    console.error(`❌ Error en DummyJSON (${category}):`, error.message);
    return [];
  }
}

/**
 * Extraer marca del título
 */
function extractBrand(title) {
  const brands = [
    'WD', 'Western Digital', 'Samsung', 'SanDisk', 'Seagate',
    'LG', 'Sony', 'Acer', 'ASUS', 'Dell', 'HP', 'Lenovo',
    'Apple', 'Microsoft', 'Logitech', 'Razer', 'Corsair',
  ];

  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return 'Generic';
}

/**
 * Mapear categorías a español
 */
function mapCategory(category) {
  const categoryMap = {
    laptops: 'portatiles',
    smartphones: 'smartphones',
    tablets: 'tablets',
    'mobile-accessories': 'accesorios',
    electronics: 'electronica',
  };

  return categoryMap[category] || category;
}

/**
 * Guardar productos en MongoDB
 */
async function saveProducts(products) {
  let saved = 0;
  let updated = 0;
  let errors = 0;

  for (const product of products) {
    try {
      const existing = await Product.findOne({ sku: product.sku });
      
      if (existing) {
        await Product.updateOne({ sku: product.sku }, { 
          ...product, 
          updated_at: new Date() 
        });
        updated++;
      } else {
        await Product.create(product);
        saved++;
      }
    } catch (error) {
      console.error(`Error guardando ${product.sku}:`, error.message);
      errors++;
    }
  }

  return { saved, updated, errors };
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando población de base de datos con productos gratuitos...\n');
  console.log('📡 APIs utilizadas:');
  console.log('   - FakeStore API (https://fakestoreapi.com)');
  console.log('   - DummyJSON (https://dummyjson.com)');
  console.log('   - 100% GRATIS, sin API keys necesarias\n');

  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener productos de todas las fuentes
    const allProducts = [];

    // FakeStore
    const fakeStoreProducts = await fetchFromFakeStore();
    allProducts.push(...fakeStoreProducts);

    // DummyJSON - Laptops
    const laptops = await fetchFromDummyJSON('laptops');
    allProducts.push(...laptops);

    // DummyJSON - Smartphones
    const smartphones = await fetchFromDummyJSON('smartphones');
    allProducts.push(...smartphones);

    // DummyJSON - Tablets
    const tablets = await fetchFromDummyJSON('tablets');
    allProducts.push(...tablets);

    // Guardar en MongoDB
    console.log(`\n💾 Guardando ${allProducts.length} productos en MongoDB...`);
    const stats = await saveProducts(allProducts);

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡Población completada exitosamente!');
    console.log('='.repeat(50));
    console.log(`📊 Estadísticas:`);
    console.log(`   - Productos nuevos: ${stats.saved}`);
    console.log(`   - Productos actualizados: ${stats.updated}`);
    console.log(`   - Errores: ${stats.errors}`);
    
    const totalInDB = await Product.countDocuments();
    console.log(`   - Total en base de datos: ${totalInDB}`);
    console.log('='.repeat(50));

    // Mostrar algunos productos de ejemplo
    console.log('\n📦 Ejemplos de productos agregados:');
    const samples = await Product.find().limit(5);
    samples.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   SKU: ${p.sku}`);
      console.log(`   Precio: €${p.our_price}`);
      console.log(`   Marca: ${p.brand}`);
      console.log(`   Categoría: ${p.category}`);
    });

    console.log('\n✅ ¡Listo! Tu tienda ya tiene productos para mostrar.');
    console.log('🌐 Visita http://localhost:3011/productos para verlos\n');

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

// Ejecutar
main().catch(console.error);
