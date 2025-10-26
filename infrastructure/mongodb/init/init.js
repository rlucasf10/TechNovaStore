// MongoDB initialization script
db = db.getSiblingDB('technovastore');

// Create collections
db.createCollection('products');
db.createCollection('categories');
db.createCollection('product_history');
db.createCollection('chat_sessions');
db.createCollection('recommendations');

// Create indexes for products collection
db.products.createIndex({ "sku": 1 }, { unique: true });
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "brand": 1 });
db.products.createIndex({ "is_active": 1 });
db.products.createIndex({ "providers.name": 1 });
db.products.createIndex({ "our_price": 1 });
db.products.createIndex({ "created_at": 1 });

// Create indexes for categories collection
db.categories.createIndex({ "slug": 1 }, { unique: true });
db.categories.createIndex({ "parent_id": 1 });
db.categories.createIndex({ "is_active": 1 });

// Create indexes for product_history collection
db.product_history.createIndex({ "product_id": 1 });
db.product_history.createIndex({ "timestamp": 1 });
db.product_history.createIndex({ "provider": 1 });

// Create indexes for chat_sessions collection
db.chat_sessions.createIndex({ "user_id": 1 });
db.chat_sessions.createIndex({ "created_at": 1 });
db.chat_sessions.createIndex({ "is_active": 1 });

// Create indexes for recommendations collection
db.recommendations.createIndex({ "user_id": 1 });
db.recommendations.createIndex({ "product_id": 1 });
db.recommendations.createIndex({ "score": -1 });
db.recommendations.createIndex({ "created_at": 1 });

print('MongoDB initialization completed successfully');