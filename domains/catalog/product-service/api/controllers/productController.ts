import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ListProducts, ProductQuery } from '../../list-products/ListProducts';
import { GetProductById } from '../../get-product-by-id/GetProductById';
import { GetProductBySku } from '../../get-product-by-sku/GetProductBySku';
import { GetProductsBatch } from '../../get-products-batch/GetProductsBatch';
import { CreateProduct } from '../../create-product/CreateProduct';
import { UpdateProduct } from '../../update-product/UpdateProduct';
import { DeleteProduct } from '../../delete-product/DeleteProduct';
import { SearchProducts } from '../../search-products/SearchProducts';
import { GetRelatedProducts } from '../../get-related-products/GetRelatedProducts';
import { UpdateProductCampaign } from '../../update-product-campaign/UpdateProductCampaign';
import { ClearProductCampaign } from '../../clear-product-campaign/ClearProductCampaign';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../../shared/infrastructure/logger';

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

    const result = await ListProducts.execute(query);

    return res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  });

  static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await GetProductById.execute(id);

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

    const product = await GetProductBySku.execute(sku);

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

  /**
   * Obtener múltiples productos por IDs (batch)
   * Útil para wishlist, carrito, etc.
   */
  static getProductsBatch = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;

    // Validar que se proporcionen IDs
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        error: 'Se requiere un array de IDs',
      });
    }

    if (ids.length === 0) {
      return res.json({
        success: true,
        data: [],
        notFound: [],
      });
    }

    const result = await GetProductsBatch.execute({ ids });

    return res.json({
      success: true,
      data: result.products,
      notFound: result.notFound,
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

    // NOTA: La verificación de rol ya se hace en el middleware requireRole(['admin'])
    // No es necesario verificar aquí de nuevo

    const product = await CreateProduct.execute(req.body);

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
    
    // NOTA: La verificación de rol ya se hace en el middleware requireRole(['admin'])
    // No es necesario verificar aquí de nuevo

    const product = await UpdateProduct.execute(id, req.body);

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
    
    // NOTA: La verificación de rol ya se hace en el middleware requireRole(['admin'])
    // No es necesario verificar aquí de nuevo

    const deleted = await DeleteProduct.execute(id);

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

    const products = await SearchProducts.execute(q, limit);

    return res.json({
      success: true,
      data: products,
      count: products.length,
    });
  });

  static getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    // El nuevo algoritmo no necesita verificar si el producto existe primero
    // ya que lo hace internamente y retorna [] si no existe
    const relatedProducts = await GetRelatedProducts.execute(id, limit);

    return res.json({
      success: true,
      data: relatedProducts,
    });
  });

  static updateProductCampaign = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;

    // Este endpoint es solo para el Campaign Manager Service
    // No requiere autenticación de usuario, pero debería estar protegido
    // por el API Gateway para que solo el Campaign Manager pueda acceder

    const product = await UpdateProductCampaign.execute(id, req.body);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    logger.info(`Product campaign updated: ${product.sku}`, {
      productId: product._id,
      campaignId: req.body.campaign_id,
    });

    return res.json({
      success: true,
      data: product,
    });
  });

  static clearProductCampaign = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Este endpoint es solo para el Campaign Manager Service
    // No requiere autenticación de usuario, pero debería estar protegido
    // por el API Gateway para que solo el Campaign Manager pueda acceder

    const product = await ClearProductCampaign.execute(id);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    logger.info(`Product campaign cleared: ${product.sku}`, {
      productId: product._id,
    });

    return res.json({
      success: true,
      data: product,
      message: 'Campaign fields cleared successfully',
    });
  });
}