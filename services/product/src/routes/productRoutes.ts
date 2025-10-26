import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductQuery,
  validateProductId,
  validateProductSku,
  validateSearchQuery,
} from '../validators/productValidator';

export const productRoutes = Router();

// Public routes (no authentication required)
productRoutes.get(
  '/',
  validateProductQuery,
  ProductController.getProducts
);

productRoutes.get(
  '/search',
  validateSearchQuery,
  ProductController.searchProducts
);

productRoutes.get(
  '/:id',
  validateProductId,
  ProductController.getProductById
);

productRoutes.get(
  '/sku/:sku',
  validateProductSku,
  ProductController.getProductBySku
);

// Admin routes (authentication and admin role required)
productRoutes.post(
  '/',
  validateCreateProduct,
  ProductController.createProduct
);

productRoutes.put(
  '/:id',
  validateUpdateProduct,
  ProductController.updateProduct
);

productRoutes.delete(
  '/:id',
  validateProductId,
  ProductController.deleteProduct
);