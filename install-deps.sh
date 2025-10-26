#!/bin/bash

echo "Installing dependencies for all services..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install shared config dependencies
echo "Installing shared config dependencies..."
cd shared/config && npm install && cd ../..

# Install API Gateway dependencies
echo "Installing API Gateway dependencies..."
cd api-gateway && npm install && cd ..

# Install service dependencies
echo "Installing Product Service dependencies..."
cd services/product && npm install && cd ../..

echo "Installing User Service dependencies..."
cd services/user && npm install && cd ../..

echo "Installing Order Service dependencies..."
cd services/order && npm install && cd ../..

echo "All dependencies installed!"
echo "You can now run the services with:"
echo "  npm run dev:gateway (for API Gateway)"
echo "  cd services/product && npm run dev (for Product Service)"
echo "  cd services/user && npm run dev (for User Service)"
echo "  cd services/order && npm run dev (for Order Service)"