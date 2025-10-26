import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { PasswordReset } from '../models/PasswordReset';
import { RBACService, Role, Permission } from '../middleware/rbac';

describe('Authentication System', () => {

  describe('RBAC System', () => {
    it('should check permissions correctly for customer role', () => {
      expect(RBACService.hasPermission(Role.CUSTOMER, Permission.READ_OWN_PROFILE)).toBe(true);
      expect(RBACService.hasPermission(Role.CUSTOMER, Permission.READ_ALL_USERS)).toBe(false);
      expect(RBACService.hasPermission(Role.CUSTOMER, Permission.CREATE_ORDER)).toBe(true);
    });

    it('should check permissions correctly for admin role', () => {
      expect(RBACService.hasPermission(Role.ADMIN, Permission.READ_OWN_PROFILE)).toBe(true);
      expect(RBACService.hasPermission(Role.ADMIN, Permission.READ_ALL_USERS)).toBe(true);
      expect(RBACService.hasPermission(Role.ADMIN, Permission.CREATE_PRODUCT)).toBe(true);
      expect(RBACService.hasPermission(Role.ADMIN, Permission.MANAGE_SYSTEM_CONFIG)).toBe(false);
    });

    it('should check permissions correctly for super admin role', () => {
      expect(RBACService.hasPermission(Role.SUPER_ADMIN, Permission.READ_OWN_PROFILE)).toBe(true);
      expect(RBACService.hasPermission(Role.SUPER_ADMIN, Permission.READ_ALL_USERS)).toBe(true);
      expect(RBACService.hasPermission(Role.SUPER_ADMIN, Permission.MANAGE_SYSTEM_CONFIG)).toBe(true);
      expect(RBACService.hasPermission(Role.SUPER_ADMIN, Permission.DELETE_ANY_USER)).toBe(true);
    });

    it('should check role hierarchy correctly', () => {
      expect(RBACService.hasRoleLevel(Role.ADMIN, Role.CUSTOMER)).toBe(true);
      expect(RBACService.hasRoleLevel(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true);
      expect(RBACService.hasRoleLevel(Role.CUSTOMER, Role.ADMIN)).toBe(false);
    });

    it('should check multiple permissions correctly', () => {
      const customerPermissions = [Permission.READ_OWN_PROFILE, Permission.CREATE_ORDER];
      const adminPermissions = [Permission.READ_ALL_USERS, Permission.CREATE_PRODUCT];
      
      expect(RBACService.hasAllPermissions(Role.CUSTOMER, customerPermissions)).toBe(true);
      expect(RBACService.hasAllPermissions(Role.CUSTOMER, adminPermissions)).toBe(false);
      expect(RBACService.hasAllPermissions(Role.ADMIN, adminPermissions)).toBe(true);
      
      expect(RBACService.hasAnyPermission(Role.CUSTOMER, adminPermissions)).toBe(false);
      expect(RBACService.hasAnyPermission(Role.ADMIN, customerPermissions)).toBe(true);
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await User.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });
  });

  describe('Token Generation', () => {
    it('should generate unique tokens', () => {
      const token1 = RefreshToken.generateToken();
      const token2 = RefreshToken.generateToken();
      const resetToken1 = PasswordReset.generateToken();
      const resetToken2 = PasswordReset.generateToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(128); // 64 bytes * 2 (hex)
      
      expect(resetToken1).toBeDefined();
      expect(resetToken2).toBeDefined();
      expect(resetToken1).not.toBe(resetToken2);
      expect(resetToken1.length).toBe(64); // 32 bytes * 2 (hex)
    });
  });

  describe('Resource Ownership', () => {
    it('should validate resource ownership correctly', () => {
      expect(RBACService.canAccessOwnResource('123', '123')).toBe(true);
      expect(RBACService.canAccessOwnResource('123', '456')).toBe(false);
      expect(RBACService.canAccessOwnResource('user-123', 'user-123')).toBe(true);
    });
  });

  describe('Role Permissions', () => {
    it('should return correct permissions for each role', () => {
      const customerPermissions = RBACService.getRolePermissions(Role.CUSTOMER);
      const adminPermissions = RBACService.getRolePermissions(Role.ADMIN);
      const superAdminPermissions = RBACService.getRolePermissions(Role.SUPER_ADMIN);
      
      expect(customerPermissions).toContain(Permission.READ_OWN_PROFILE);
      expect(customerPermissions).toContain(Permission.CREATE_ORDER);
      expect(customerPermissions).not.toContain(Permission.READ_ALL_USERS);
      
      expect(adminPermissions).toContain(Permission.READ_OWN_PROFILE);
      expect(adminPermissions).toContain(Permission.READ_ALL_USERS);
      expect(adminPermissions).toContain(Permission.CREATE_PRODUCT);
      expect(adminPermissions).not.toContain(Permission.MANAGE_SYSTEM_CONFIG);
      
      expect(superAdminPermissions).toContain(Permission.READ_OWN_PROFILE);
      expect(superAdminPermissions).toContain(Permission.READ_ALL_USERS);
      expect(superAdminPermissions).toContain(Permission.MANAGE_SYSTEM_CONFIG);
      expect(superAdminPermissions).toContain(Permission.DELETE_ANY_USER);
      
      // Check hierarchy - admin should have more permissions than customer
      expect(adminPermissions.length).toBeGreaterThan(customerPermissions.length);
      expect(superAdminPermissions.length).toBeGreaterThan(adminPermissions.length);
    });
  });
});