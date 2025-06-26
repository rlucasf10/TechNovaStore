// Script para crear colecciones y algunos índices en MongoDB para TechNovaStore
// Puedes ejecutarlo desde mongosh o MongoDB Compass (nueva consulta)


// Si ejecutas este script como init en Docker, la base de datos se define por MONGO_INITDB_DATABASE
// Si lo ejecutas manualmente en mongosh, puedes usar: 
// use technovastore;

// Colección de productos
if (!db.getCollectionNames().includes('products')) {
  db.createCollection('products');
}
db.products.createIndex({ sku: 1 }, { unique: true, sparse: true });

// Colección de histórico de precios
if (!db.getCollectionNames().includes('price_history')) {
  db.createCollection('price_history');
}
db.price_history.createIndex({ product_id: 1, date: -1 });

// Colección de logs de sincronización
if (!db.getCollectionNames().includes('sync_logs')) {
  db.createCollection('sync_logs');
}
db.sync_logs.createIndex({ date: -1 });
