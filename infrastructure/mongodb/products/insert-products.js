/**
 * Script para insertar productos de prueba en MongoDB
 * 
 * Uso:
 *   node insert-products.js
 * 
 * O desde Docker:
 *   docker exec -it technovastore-mongodb mongosh -u admin -p password --authenticationDatabase admin technovastore /data/insert-products.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuración de conexión
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27088/technovastore?authSource=admin';
const DB_NAME = 'technovastore';
const COLLECTION_NAME = 'products';

// Leer productos desde el archivo JSON
const productsPath = path.join(__dirname, 'seed-products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

async function insertProducts() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Conectando a MongoDB...');
    await client.connect();
    console.log('✅ Conectado exitosamente');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Verificar si ya existen productos
    const existingCount = await collection.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} productos en la colección`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('¿Deseas eliminar los productos existentes y reinsertar? (s/n): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'y') {
        console.log('🗑️  Eliminando productos existentes...');
        await collection.deleteMany({});
        console.log('✅ Productos eliminados');
      } else {
        console.log('❌ Operación cancelada');
        return;
      }
    }

    // Agregar timestamps a cada producto
    const productsWithTimestamps = products.map(product => ({
      ...product,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Insertar productos
    console.log(`📦 Insertando ${productsWithTimestamps.length} productos...`);
    const result = await collection.insertMany(productsWithTimestamps);
    
    console.log(`✅ ${result.insertedCount} productos insertados exitosamente`);
    
    // Mostrar resumen por categoría
    console.log('\n📊 Resumen por categoría:');
    const categories = await collection.aggregate([
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
      console.log(`   - ${cat._id}: ${cat.count} productos, ${cat.total_stock} unidades en stock`);
    });

    // Crear índices para mejorar el rendimiento
    console.log('\n🔍 Creando índices...');
    await collection.createIndex({ name: 'text', description: 'text' });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ brand: 1 });
    await collection.createIndex({ price: 1 });
    await collection.createIndex({ is_active: 1 });
    await collection.createIndex({ featured: 1 });
    await collection.createIndex({ created_at: -1 });
    console.log('✅ Índices creados');

    console.log('\n🎉 ¡Proceso completado exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
insertProducts();
