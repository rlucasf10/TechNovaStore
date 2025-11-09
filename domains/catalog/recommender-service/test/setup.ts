import mongoose from 'mongoose';

// @ts-ignore - Jest globals
beforeAll(async () => {
  // Connect to real MongoDB instance (running in Docker)
  const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/technovastore_test';
  await mongoose.connect(mongoUri);
});

// @ts-ignore - Jest globals
afterAll(async () => {
  await mongoose.disconnect();
});

// @ts-ignore - Jest globals
afterEach(async () => {
  // Clean up test data after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});