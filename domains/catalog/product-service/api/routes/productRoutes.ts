import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductQuery,
  validateProductId,
  validateProductSku,
  validateSearchQuery,
  validateUpdateProductCampaign,
} from '../validators/productValidator';
import { authMiddleware, requireRole } from '../../shared/middleware/auth';

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

// Obtener múltiples productos por IDs (batch)
productRoutes.post(
  '/batch',
  ProductController.getProductsBatch
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

productRoutes.get(
  '/:id/related',
  validateProductId,
  ProductController.getRelatedProducts
);

// Admin routes (authentication and admin role required)
productRoutes.post(
  '/',
  authMiddleware,
  requireRole(['admin']),
  validateCreateProduct,
  ProductController.createProduct
);

productRoutes.put(
  '/:id',
  authMiddleware,
  requireRole(['admin']),
  validateUpdateProduct,
  ProductController.updateProduct
);

productRoutes.delete(
  '/:id',
  authMiddleware,
  requireRole(['admin']),
  validateProductId,
  ProductController.deleteProduct
);

// Campaign management routes (for Campaign Manager Service)
// Estas rutas son para comunicación entre servicios, requieren autenticación admin
productRoutes.patch(
  '/:id/campaign',
  authMiddleware,
  requireRole(['admin']),
  validateUpdateProductCampaign,
  ProductController.updateProductCampaign
);

productRoutes.delete(
  '/:id/campaign',
  authMiddleware,
  requireRole(['admin']),
  validateProductId,
  ProductController.clearProductCampaign
);