/**
 * Validadores para el servicio de seguimiento de envíos
 * Utiliza express-validator para validar parámetros de entrada
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { param, body } = require('express-validator');

/**
 * Validador para el parámetro orderNumber en rutas GET
 * Valida que el número de pedido tenga el formato correcto: ORD-{timestamp}-{8 caracteres alfanuméricos}
 * Ejemplo válido: ORD-1734567890123-A1B2C3D4
 */
export const validateOrderNumber = [
  param('orderNumber')
    .notEmpty()
    .withMessage('Order number is required')
    .isString()
    .withMessage('Order number must be a string')
    .trim()
    .matches(/^ORD-\d+-[A-Z0-9]{8}$/)
    .withMessage('Invalid order number format. Expected format: ORD-{timestamp}-{8 alphanumeric characters}'),
];

/**
 * Validador para actualización de tracking
 * Valida orderNumber en params y opcionalmente datos en body
 */
export const validateUpdateTracking = [
  param('orderNumber')
    .notEmpty()
    .withMessage('Order number is required')
    .isString()
    .withMessage('Order number must be a string')
    .trim()
    .matches(/^ORD-\d+-[A-Z0-9]{8}$/)
    .withMessage('Invalid order number format. Expected format: ORD-{timestamp}-{8 alphanumeric characters}'),
  
  // Campos opcionales en el body para actualización manual
  body('trackingNumber')
    .optional()
    .isString()
    .withMessage('Tracking number must be a string')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Tracking number must be between 5 and 100 characters'),
  
  body('carrier')
    .optional()
    .isString()
    .withMessage('Carrier must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  
  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(['pending', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'exception'])
    .withMessage('Invalid shipment status'),
];
