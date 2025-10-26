import { body, param, query } from 'express-validator';

export const validateCreateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.product_sku')
    .notEmpty()
    .withMessage('Product SKU is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Product SKU must be between 3 and 100 characters'),
  
  body('items.*.product_name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('items.*.unit_price')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('shipping_address')
    .isObject()
    .withMessage('Shipping address is required'),
  
  body('shipping_address.street')
    .notEmpty()
    .withMessage('Shipping street address is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Street address must be between 5 and 255 characters'),
  
  body('shipping_address.city')
    .notEmpty()
    .withMessage('Shipping city is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('shipping_address.state')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('shipping_address.postal_code')
    .notEmpty()
    .withMessage('Shipping postal code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  
  body('shipping_address.country')
    .notEmpty()
    .withMessage('Shipping country is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  
  body('billing_address')
    .isObject()
    .withMessage('Billing address is required'),
  
  body('billing_address.street')
    .notEmpty()
    .withMessage('Billing street address is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Street address must be between 5 and 255 characters'),
  
  body('billing_address.city')
    .notEmpty()
    .withMessage('Billing city is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('billing_address.state')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('billing_address.postal_code')
    .notEmpty()
    .withMessage('Billing postal code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  
  body('billing_address.country')
    .notEmpty()
    .withMessage('Billing country is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  
  body('payment_method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
];

export const validateUpdateOrderStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid order ID'),
  
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),
];

export const validateUpdateTrackingInfo = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid order ID'),
  
  body('tracking_number')
    .notEmpty()
    .withMessage('Tracking number is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Tracking number must be between 5 and 100 characters'),
  
  body('estimated_delivery')
    .optional()
    .isISO8601()
    .withMessage('Estimated delivery must be a valid date'),
];

export const validateOrderId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid order ID'),
];

export const validateOrderNumber = [
  param('orderNumber')
    .notEmpty()
    .withMessage('Order number is required')
    .matches(/^ORD-\d+-[A-Z0-9]{8}$/)
    .withMessage('Invalid order number format'),
];

export const validateOrderQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),
  
  query('user_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'total_amount', 'status'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateProcessPayment = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid order ID'),
  
  body('customerInfo')
    .isObject()
    .withMessage('Customer information is required'),
  
  body('customerInfo.email')
    .isEmail()
    .withMessage('Valid email is required'),
  
  body('customerInfo.name')
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
];

export const validateProcessRefund = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid order ID'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number'),
];