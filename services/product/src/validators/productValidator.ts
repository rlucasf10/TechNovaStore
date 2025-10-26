import { body, query, param } from 'express-validator';

export const validateCreateProduct = [
  body('sku')
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('SKU must contain only uppercase letters, numbers, hyphens, and underscores'),
  
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  
  body('brand')
    .notEmpty()
    .withMessage('Brand is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand must be between 2 and 100 characters'),
  
  body('our_price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('markup_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Markup percentage must be between 0 and 100'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  
  body('providers')
    .optional()
    .isArray()
    .withMessage('Providers must be an array'),
  
  body('providers.*.name')
    .optional()
    .notEmpty()
    .withMessage('Provider name is required'),
  
  body('providers.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Provider price must be a positive number'),
  
  body('providers.*.shipping_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a positive number'),
  
  body('providers.*.delivery_time')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Delivery time must be at least 1 day'),
];

export const validateUpdateProduct = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('sku')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('SKU must contain only uppercase letters, numbers, hyphens, and underscores'),
  
  body('name')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('category')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  
  body('brand')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand must be between 2 and 100 characters'),
  
  body('our_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('markup_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Markup percentage must be between 0 and 100'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
];

export const validateProductQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'our_price', 'created_at', 'updated_at', 'brand', 'category'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateProductId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
];

export const validateProductSku = [
  param('sku')
    .notEmpty()
    .withMessage('SKU is required')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Invalid SKU format'),
];

export const validateSearchQuery = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];