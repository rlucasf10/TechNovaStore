import { body } from 'express-validator';

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('First name must contain only letters and spaces'),
  
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Last name must contain only letters and spaces'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  body('address.street')
    .optional()
    .isLength({ min: 5, max: 255 })
    .withMessage('Street address must be between 5 and 255 characters'),
  
  body('address.city')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('address.state')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('address.postal_code')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  
  body('address.country')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

export const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid token format'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
];