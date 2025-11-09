import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@technovastore/shared-types';

// Define roles and their hierarchical levels (mirrored from user service)
export enum Role {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// Define permissions (mirrored from user service)
export enum Permission {
  // User permissions
  READ_OWN_PROFILE = 'read_own_profile',
  UPDATE_OWN_PROFILE = 'update_own_profile',
  DELETE_OWN_ACCOUNT = 'delete_own_account',
  
  // Order permissions
  CREATE_ORDER = 'create_order',
  READ_OWN_ORDERS = 'read_own_orders',
  CANCEL_OWN_ORDER = 'cancel_own_order',
  
  // Admin permissions
  READ_ALL_USERS = 'read_all_users',
  UPDATE_ANY_USER = 'update_any_user',
  DELETE_ANY_USER = 'delete_any_user',
  READ_ALL_ORDERS = 'read_all_orders',
  UPDATE_ANY_ORDER = 'update_any_order',
  CANCEL_ANY_ORDER = 'cancel_any_order',
  
  // Product permissions
  READ_PRODUCTS = 'read_products',
  CREATE_PRODUCT = 'create_product',
  UPDATE_PRODUCT = 'update_product',
  DELETE_PRODUCT = 'delete_product',
  
  // System permissions
  MANAGE_SYSTEM_CONFIG = 'manage_system_config',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_ROLES = 'manage_roles',
}

// Role-Permission mapping (mirrored from user service)
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.CUSTOMER]: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.DELETE_OWN_ACCOUNT,
    Permission.CREATE_ORDER,
    Permission.READ_OWN_ORDERS,
    Permission.CANCEL_OWN_ORDER,
    Permission.READ_PRODUCTS,
  ],
  [Role.ADMIN]: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.DELETE_OWN_ACCOUNT,
    Permission.CREATE_ORDER,
    Permission.READ_OWN_ORDERS,
    Permission.CANCEL_OWN_ORDER,
    Permission.READ_PRODUCTS,
    Permission.READ_ALL_USERS,
    Permission.UPDATE_ANY_USER,
    Permission.READ_ALL_ORDERS,
    Permission.UPDATE_ANY_ORDER,
    Permission.CANCEL_ANY_ORDER,
    Permission.CREATE_PRODUCT,
    Permission.UPDATE_PRODUCT,
    Permission.DELETE_PRODUCT,
    Permission.VIEW_SYSTEM_LOGS,
  ],
  [Role.SUPER_ADMIN]: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.DELETE_OWN_ACCOUNT,
    Permission.CREATE_ORDER,
    Permission.READ_OWN_ORDERS,
    Permission.CANCEL_OWN_ORDER,
    Permission.READ_PRODUCTS,
    Permission.READ_ALL_USERS,
    Permission.UPDATE_ANY_USER,
    Permission.DELETE_ANY_USER,
    Permission.READ_ALL_ORDERS,
    Permission.UPDATE_ANY_ORDER,
    Permission.CANCEL_ANY_ORDER,
    Permission.CREATE_PRODUCT,
    Permission.UPDATE_PRODUCT,
    Permission.DELETE_PRODUCT,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.MANAGE_SYSTEM_CONFIG,
    Permission.MANAGE_ROLES,
  ],
};

// Role hierarchy for inheritance
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.CUSTOMER]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPER_ADMIN]: 3,
};

export class RBACService {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions ? permissions.includes(permission) : false;
  }

  /**
   * Check if a role has any of the specified permissions
   */
  static hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if a role has all of the specified permissions
   */
  static hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if a role is equal to or higher than the required role
   */
  static hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
    const userLevel = ROLE_HIERARCHY[userRole];
    const requiredLevel = ROLE_HIERARCHY[requiredRole];
    return userLevel >= requiredLevel;
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }
}

/**
 * Middleware to require specific permissions at the gateway level
 */
export const requirePermissions = (permissions: Permission | Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const userRole = req.user.role as Role;
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    const hasPermission = RBACService.hasAllPermissions(userRole, requiredPermissions);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required_permissions: requiredPermissions,
      });
    }

    // Add permission info to headers for downstream services
    req.headers['x-user-permissions'] = JSON.stringify(RBACService.getRolePermissions(userRole));

    next();
  };
};

/**
 * Middleware to require any of the specified permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const userRole = req.user.role as Role;
    const hasPermission = RBACService.hasAnyPermission(userRole, permissions);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required_permissions: permissions,
      });
    }

    // Add permission info to headers for downstream services
    req.headers['x-user-permissions'] = JSON.stringify(RBACService.getRolePermissions(userRole));

    next();
  };
};

/**
 * Middleware to require specific role level
 */
export const requireRole = (requiredRole: Role) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const userRole = req.user.role as Role;
    const hasRole = RBACService.hasRoleLevel(userRole, requiredRole);

    if (!hasRole) {
      return res.status(403).json({
        error: 'Insufficient role level',
        required_role: requiredRole,
        user_role: userRole,
      });
    }

    // Add permission info to headers for downstream services
    req.headers['x-user-permissions'] = JSON.stringify(RBACService.getRolePermissions(userRole));

    next();
  };
};

/**
 * Middleware for resource ownership validation at gateway level
 */
export const requireOwnershipOrAdmin = (resourceUserIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const userId = req.user.id.toString();
    const resourceUserId = req.params[resourceUserIdParam];
    const userRole = req.user.role as Role;

    // Allow if user owns the resource
    if (userId === resourceUserId) {
      return next();
    }

    // Allow if user has admin permissions
    if (RBACService.hasRoleLevel(userRole, Role.ADMIN)) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied. You can only access your own resources.',
    });
  };
};

// Export types and enums for use in other modules
export { Role as UserRole, Permission as UserPermission };