import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ProductService, ProductQuery } from '../services/productService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ProductController {
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const query: ProductQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      category: req.query.category as string,
      subcategory: req.query.subcategory as string,
      brand: req.query.brand as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      isActive: req.query.isActive !== 'false',
    };

    const result = await ProductService.getProducts(query);

    return res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  });

  static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await ProductService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  });

  static getProductBySku = asyncHandler(async (req: Request, res: Response) => {
    const { sku } = req.params;

    const product = await ProductService.getProductBySku(sku);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  });

  static createProduct = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    // Check if user has admin role (passed from API Gateway)
    const userRole = req.headers['x-user-role'] as string;
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const product = await ProductService.createProduct(req.body);

    logger.info(`Product created: ${product.sku}`, {
      productId: product._id,
      userId: req.headers['x-user-id'],
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  });

  static updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const product = await ProductService.updateProduct(id, req.body);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    logger.info(`Product updated: ${product.sku}`, {
      productId: product._id,
      userId: req.headers['x-user-id'],
    });

    return res.json({
      success: true,
      data: product,
    });
  });

  static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const deleted = await ProductService.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    logger.info(`Product deleted: ${id}`, {
      userId: req.headers['x-user-id'],
    });

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  });

  static searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Search query is required',
      });
    }

    const products = await ProductService.searchProducts(q, limit);

    return res.json({
      success: true,
      data: products,
      count: products.length,
    });
  });
}