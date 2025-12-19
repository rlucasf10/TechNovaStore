/**
 * Validadores para el servicio de notificaciones
 * Utiliza express-validator para validar parámetros de entrada
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { param, body } from 'express-validator';

/**
 * Validador para el parámetro userId en rutas
 * Valida que el userId sea un UUID válido o un ID numérico
 */
export const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Invalid user ID format. Only alphanumeric characters and hyphens are allowed')
    .isLength({ min: 1, max: 100 })
    .withMessage('User ID must be between 1 and 100 characters'),
];

/**
 * Validador para el parámetro notificationId en rutas
 * Valida que el notificationId sea un UUID válido o un ID numérico
 */
export const validateNotificationId = [
  param('notificationId')
    .notEmpty()
    .withMessage('Notification ID is required')
    .isString()
    .withMessage('Notification ID must be a string')
    .trim()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Invalid notification ID format. Only alphanumeric characters and hyphens are allowed')
    .isLength({ min: 1, max: 100 })
    .withMessage('Notification ID must be between 1 and 100 characters'),
];

/**
 * Validador para crear una notificación de usuario
 * Valida los campos requeridos en el body
 */
export const validateCreateUserNotification = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Invalid user ID format'),
  
  body('type')
    .notEmpty()
    .withMessage('Notification type is required')
    .isString()
    .withMessage('Notification type must be a string')
    .isIn(['order', 'payment', 'shipment', 'promotion', 'system', 'alert'])
    .withMessage('Invalid notification type'),
  
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

/**
 * Validador para envío de confirmación de pedido
 */
export const validateOrderConfirmation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string')
    .trim(),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim(),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
];

/**
 * Validador para envío de confirmación de pago
 */
export const validatePaymentConfirmation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string')
    .trim(),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim(),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number'),
];

/**
 * Validador para envío de estado de envío
 */
export const validateShipmentStatus = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string')
    .trim(),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim(),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isString()
    .withMessage('Status must be a string')
    .isIn(['pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned'])
    .withMessage('Invalid shipment status'),
];

/**
 * Validador para envío de alerta de retraso
 */
export const validateDelayAlert = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string')
    .trim(),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim(),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
];

/**
 * Validador para envío de cancelación de pedido
 */
export const validateOrderCancellation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string')
    .trim(),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim(),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be at most 500 characters'),
];

/**
 * Validador para envío de notificación de factura generada
 */
export const validateInvoiceGenerated = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isString()
    .withMessage('Order ID must be a string')
    .trim(),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim(),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('invoiceNumber')
    .notEmpty()
    .withMessage('Invoice number is required')
    .isString()
    .withMessage('Invoice number must be a string')
    .trim(),
];
