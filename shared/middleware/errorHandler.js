"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const errorHandler = (error, req, res, _next) => {
    let { statusCode = 500, message } = error;
    console.error('Error occurred:', {
        error: message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }
    if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Database validation error';
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'Resource already exists';
    }
    const response = {
        error: message,
        status: statusCode,
    };
    if (process.env.NODE_ENV !== 'production') {
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map