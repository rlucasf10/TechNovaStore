import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authMiddleware, requireRole } from '../../shared/middleware/auth';

export const categoryRoutes = Router();

// Rutas públicas - no requieren autenticación
categoryRoutes.get('/', CategoryController.getCategories);
categoryRoutes.get('/tree', CategoryController.getCategoryTree);
categoryRoutes.get('/:slug', CategoryController.getCategoryBySlug);

// ✅ SEGURIDAD: Rutas administrativas - requieren autenticación y rol admin
// Solo administradores pueden crear, modificar o eliminar categorías
categoryRoutes.post(
  '/',
  authMiddleware,
  requireRole(['admin']),
  CategoryController.createCategory
);

categoryRoutes.put(
  '/:id',
  authMiddleware,
  requireRole(['admin']),
  CategoryController.updateCategory
);

categoryRoutes.delete(
  '/:id',
  authMiddleware,
  requireRole(['admin']),
  CategoryController.deleteCategory
);
