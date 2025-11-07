import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class CategoryController {
  // Get all categories
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await Category.find({ is_active: true })
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      data: categories,
    });
  });

  // Get category by slug
  static getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, is_active: true }).lean();

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
      });
    }

    return res.json({
      success: true,
      data: category,
    });
  });

  // Get category tree (hierarchical structure)
  static getCategoryTree = asyncHandler(async (req: Request, res: Response) => {
    const categories = await Category.find({ is_active: true })
      .sort({ name: 1 })
      .lean();

    // Build tree structure
    const categoryMap = new Map();
    const tree: any[] = [];

    // First pass: create map
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), { ...cat, children: [] });
    });

    // Second pass: build tree
    categories.forEach(cat => {
      const category = categoryMap.get(cat._id.toString());
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id.toString());
        if (parent) {
          parent.children.push(category);
        }
      } else {
        tree.push(category);
      }
    });

    return res.json({
      success: true,
      data: tree,
    });
  });

  // Create category (admin only)
  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    const userRole = req.headers['x-user-role'] as string;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const category = await Category.create(req.body);

    logger.info(`Category created: ${category.slug}`, {
      categoryId: category._id,
      userId: req.headers['x-user-id'],
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  });

  // Update category (admin only)
  static updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
      });
    }

    logger.info(`Category updated: ${category.slug}`, {
      categoryId: category._id,
      userId: req.headers['x-user-id'],
    });

    return res.json({
      success: true,
      data: category,
    });
  });

  // Delete category (admin only)
  static deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
      });
    }

    logger.info(`Category deleted: ${id}`, {
      userId: req.headers['x-user-id'],
    });

    return res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  });
}
