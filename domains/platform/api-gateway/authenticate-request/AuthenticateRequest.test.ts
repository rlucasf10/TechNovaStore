/**
 * Tests para el middleware de autenticación del API Gateway
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, optionalAuth, requireRole } from './AuthenticateRequest';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import axios from 'axios';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('axios');
jest.mock('../shared/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    test('should return 401 if no authorization header', async () => {
      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 if authorization header does not start with Bearer', async () => {
      mockReq.headers = { authorization: 'InvalidToken' };

      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.',
      });
    });

    test('should validate token with user service successfully', async () => {
      const token = 'valid-token';
      mockReq.headers = { authorization: `Bearer ${token}` };

      const userData = {
        id: '1',
        email: 'test@example.com',
        role: 'customer',
      };

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: userData,
        },
      });

      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(userData);
      expect(mockReq.headers!['x-user-id']).toBe('1');
      expect(mockReq.headers!['x-user-email']).toBe('test@example.com');
      expect(mockReq.headers!['x-user-role']).toBe('customer');
      expect(mockNext).toHaveBeenCalled();
    });

    test('should fallback to local JWT validation if user service fails', async () => {
      const token = 'valid-token';
      mockReq.headers = { authorization: `Bearer ${token}` };

      const decodedToken = {
        id: '1',
        email: 'test@example.com',
        role: 'customer',
      };

      (axios.post as jest.Mock).mockRejectedValue(new Error('Service unavailable'));
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(decodedToken);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 401 for expired token', async () => {
      const token = 'expired-token';
      mockReq.headers = { authorization: `Bearer ${token}` };

      (axios.post as jest.Mock).mockRejectedValue(new Error('Service unavailable'));
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token expired',
      });
    });

    test('should return 401 for invalid token', async () => {
      const token = 'invalid-token';
      mockReq.headers = { authorization: `Bearer ${token}` };

      (axios.post as jest.Mock).mockRejectedValue(new Error('Service unavailable'));
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
    });
  });

  describe('optionalAuth', () => {
    test('should continue without user if no token provided', () => {
      optionalAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should decode token if provided', () => {
      const token = 'valid-token';
      mockReq.headers = { authorization: `Bearer ${token}` };

      const decodedToken = {
        id: '1',
        email: 'test@example.com',
        role: 'customer',
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      optionalAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(decodedToken);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should continue even if token is invalid', () => {
      const token = 'invalid-token';
      mockReq.headers = { authorization: `Bearer ${token}` };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    test('should return 401 if user is not authenticated', () => {
      const middleware = requireRole(['admin']);

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
    });

    test('should return 403 if user does not have required role', () => {
      mockReq.user = {
        id: '1',
        email: 'test@example.com',
        role: 'customer',
      };

      const middleware = requireRole(['admin']);

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
      });
    });

    test('should call next if user has required role', () => {
      mockReq.user = {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
      };

      const middleware = requireRole(['admin']);

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should accept multiple roles', () => {
      mockReq.user = {
        id: '1',
        email: 'manager@example.com',
        role: 'manager',
      };

      const middleware = requireRole(['admin', 'manager']);

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
