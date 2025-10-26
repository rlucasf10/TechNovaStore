import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';

export const categoryRoutes = Router();

// Public routes
categoryRoutes.get('/', CategoryController.getCategories);
categoryRoutes.get('/tree', CategoryController.getCategoryTree);
categoryRoutes.get('/:slug', CategoryController.getCategoryBySlug);

// Admin routes
categoryRoutes.post('/', CategoryController.createCategory);
categoryRoutes.put('/:id', CategoryController.updateCategory);
categoryRoutes.delete('/:id', CategoryController.deleteCategory);
