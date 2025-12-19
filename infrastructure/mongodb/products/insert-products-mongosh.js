/**
 * Script para insertar productos de prueba en MongoDB usando mongosh
 * 
 * Uso desde Docker:
 *   docker cp infrastructure/mongodb/products/seed-products.json technovastore-mongodb:/tmp/
 *   docker cp infrastructure/mongodb/products/insert-products-mongosh.js technovastore-mongodb:/tmp/
 *   docker exec -it technovastore-mongodb mongosh -u admin -p password --authenticationDatabase admin technovastore /tmp/insert-products-mongosh.js
 */

// Leer productos desde el archivo JSON usando fs
const fs = require('fs');
const productsData = fs.readFileSync('/tmp/seed-products.json', 'utf8');
const products = JSON.parse(productsData);

// Eliminar índice problemático si existe
try {
  db.products.dropIndex('sku_1');
  print('✅ Índice sku_1 eliminado');
} catch (e) {
  print('ℹ️  Índice sku_1 no existe (esto es normal)');
}

// Verificar si ya existen productos
const existingCount = db.products.countDocuments();

if (existingCount > 0) {
  print(`⚠️  Ya existen ${existingCount} productos en la colección`);
  print('🗑️  Eliminando productos existentes...');
  db.products.deleteMany({});
  print('✅ Productos eliminados');
}

// Agregar timestamps, SKU y renombrar price a our_price
const productsWithTimestamps = products.map((product, index) => {
  const { price, ...rest } = product;
  
  // Proveedor ficticio temporal hasta que sync-engine funcione
  const fakeProvider = {
    name: 'TechNova Warehouse',
    price: price * 0.85, // 15% menos que nuestro precio
    availability: true,
    shipping_cost: 0,
    delivery_time: 2,
    last_updated: new Date().toISOString()
  };
  
  return {
    ...rest,
    sku: `PROD-${String(index + 1).padStart(5, '0')}`,
    our_price: price, // Renombrar price a our_price
    markup_percentage: 15, // Margen de ganancia por defecto
    providers: [fakeProvider], // Proveedor ficticio temporal
    created_at: new Date(),
    updated_at: new Date()
  };
});

// Insertar productos
print(`📦 Insertando ${productsWithTimestamps.length} productos...`);
const result = db.products.insertMany(productsWithTimestamps);

print(`✅ ${Object.keys(result.insertedIds).length} productos insertados exitosamente`);

// Mostrar resumen por categoría
print('\n📊 Resumen por categoría:');
const categories = db.products.aggregate([
  {
    $group: {
      _id: '$category',
      count: { $sum: 1 },
      total_stock: { $sum: '$stock' }
    }
  },
  { $sort: { count: -1 } }
]).toArray();

categories.forEach(cat => {
  print(`   - ${cat._id}: ${cat.count} productos, ${cat.total_stock} unidades en stock`);
});

// Crear índices para mejorar el rendimiento
print('\n🔍 Creando índices...');
db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ category: 1 });
db.products.createIndex({ brand: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ is_active: 1 });
db.products.createIndex({ featured: 1 });
db.products.createIndex({ created_at: -1 });
print('✅ Índices creados');

print('\n🎉 ¡Proceso completado exitosamente!');
