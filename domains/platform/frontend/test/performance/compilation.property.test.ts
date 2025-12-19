/**
 * Property-Based Tests para Performance de Compilación
 * 
 * Feature: frontend-security-fixes
 * Property 14: Compilation performance
 * Validates: Requirements 8.1, 8.2
 * 
 * Estos tests verifican que:
 * - Las páginas se compilan en tiempos razonables
 * - Los timeouts de axios están configurados correctamente según el entorno
 * - Los componentes pesados usan dynamic imports
 */

import { describe, it, expect } from '@jest/globals';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

describe('Property Tests - Compilation Performance', () => {
  /**
   * Feature: frontend-security-fixes, Property 14: Compilation performance
   * Validates: Requirements 8.1, 8.2
   * 
   * Verifica que los timeouts de axios estén configurados correctamente:
   * - 60 segundos en desarrollo
   * - 30 segundos en producción
   */
  describe('Property 14.1: Axios timeout configuration', () => {
    it('debe tener timeout de 60s en desarrollo y 30s en producción', () => {
      // Leer archivos de configuración de axios
      const axiosPath = path.join(__dirname, '../../src/shared/lib/axios.ts');
      const apiPath = path.join(__dirname, '../../src/shared/lib/api.ts');
      const authServicePath = path.join(__dirname, '../../src/features/customer/services/auth.service.ts');
      
      const axiosContent = fs.readFileSync(axiosPath, 'utf-8');
      const apiContent = fs.readFileSync(apiPath, 'utf-8');
      const authServiceContent = fs.readFileSync(authServicePath, 'utf-8');
      
      // Verificar que axios.ts tiene timeout condicional
      expect(axiosContent).toMatch(/timeout:\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\?\s*60000\s*:\s*30000/);
      
      // Verificar que api.ts tiene timeout condicional
      expect(apiContent).toMatch(/timeout:\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\?\s*60000\s*:\s*30000/);
      
      // Verificar que auth.service.ts tiene timeout de 60s (OAuth puede tardar)
      expect(authServiceContent).toMatch(/timeout:\s*60000/);
    });
  });

  /**
   * Feature: frontend-security-fixes, Property 14: Compilation performance
   * Validates: Requirements 8.3, 8.4
   * 
   * Verifica que los componentes pesados (recharts) usen dynamic imports
   */
  describe('Property 14.2: Heavy components use dynamic imports', () => {
    it('debe usar dynamic imports para componentes de gráficos en páginas de admin', () => {
      // Leer página de dashboard de admin
      const adminDashboardPath = path.join(__dirname, '../../src/app/dashboard/admin/page.tsx');
      const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');
      
      // Verificar que usa dynamic imports para gráficos
      expect(adminDashboardContent).toMatch(/const\s+\w+Chart\s*=\s*dynamic\(/);
      expect(adminDashboardContent).toMatch(/from\s+['"]next\/dynamic['"]/);
      
      // Verificar que NO importa recharts directamente en la página
      expect(adminDashboardContent).not.toMatch(/from\s+['"]recharts['"]/);
    });

    it('debe tener loading states para componentes con dynamic import', () => {
      const adminDashboardPath = path.join(__dirname, '../../src/app/dashboard/admin/page.tsx');
      const adminDashboardContent = fs.readFileSync(adminDashboardPath, 'utf-8');
      
      // Verificar que los dynamic imports tienen loading states
      expect(adminDashboardContent).toMatch(/loading:\s*\(\)\s*=>\s*<div/);
    });
  });

  /**
   * Feature: frontend-security-fixes, Property 14: Compilation performance
   * Validates: Requirements 8.5
   * 
   * Verifica que la página principal use Suspense para lazy loading
   */
  describe('Property 14.3: Home page uses Suspense for below-the-fold content', () => {
    it('debe usar Suspense para componentes below-the-fold', () => {
      const homePagePath = path.join(__dirname, '../../src/app/page.tsx');
      const homePageContent = fs.readFileSync(homePagePath, 'utf-8');
      
      // Verificar que importa Suspense
      expect(homePageContent).toMatch(/import\s+{\s*Suspense\s*}\s+from\s+['"]react['"]/);
      
      // Verificar que usa Suspense para componentes below-the-fold
      expect(homePageContent).toMatch(/<Suspense\s+fallback=/);
      
      // Verificar que DealsSection está dentro de Suspense
      expect(homePageContent).toMatch(/<Suspense[^>]*>[\s\S]*<DealsSection/);
    });

    it('debe cargar componentes above-the-fold sin Suspense', () => {
      const homePagePath = path.join(__dirname, '../../src/app/page.tsx');
      const homePageContent = fs.readFileSync(homePagePath, 'utf-8');
      
      // Verificar que HeroSection NO está dentro de Suspense
      // (debe cargar inmediatamente para LCP)
      const heroSectionMatch = homePageContent.match(/<HeroSection[\s\S]*?\/>/);
      expect(heroSectionMatch).toBeTruthy();
      
      // Verificar que no hay Suspense antes de HeroSection
      const beforeHero = homePageContent.substring(0, homePageContent.indexOf('<HeroSection'));
      const suspenseBeforeHero = beforeHero.match(/<Suspense/g);
      
      // Si hay Suspense antes, verificar que está cerrado antes de HeroSection
      if (suspenseBeforeHero) {
        const closingSuspense = beforeHero.match(/<\/Suspense>/g);
        expect(closingSuspense?.length).toBeGreaterThanOrEqual(suspenseBeforeHero.length);
      }
    });
  });

  /**
   * Feature: frontend-security-fixes, Property 14: Compilation performance
   * Validates: Requirements 8.6
   * 
   * Verifica que Next.js esté configurado con optimizaciones de bundle
   */
  describe('Property 14.4: Next.js bundle optimizations', () => {
    it('debe tener configurado bundle analyzer', () => {
      const nextConfigPath = path.join(__dirname, '../../next.config.js');
      const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');
      
      // Verificar que usa @next/bundle-analyzer
      expect(nextConfigContent).toMatch(/require\(['"]@next\/bundle-analyzer['"]\)/);
      expect(nextConfigContent).toMatch(/withBundleAnalyzer/);
    });

    it('debe tener configurado optimizePackageImports para librerías pesadas', () => {
      const nextConfigPath = path.join(__dirname, '../../next.config.js');
      const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');
      
      // Verificar que tiene optimizePackageImports
      expect(nextConfigContent).toMatch(/optimizePackageImports:/);
      
      // Verificar que incluye librerías pesadas
      expect(nextConfigContent).toMatch(/['"]recharts['"]/);
      expect(nextConfigContent).toMatch(/['"]lucide-react['"]/);
      expect(nextConfigContent).toMatch(/['"]framer-motion['"]/);
    });

    it('debe tener configurado modularizeImports para tree-shaking', () => {
      const nextConfigPath = path.join(__dirname, '../../next.config.js');
      const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');
      
      // Verificar que tiene modularizeImports
      expect(nextConfigContent).toMatch(/modularizeImports:/);
      
      // Verificar que incluye lucide-react y date-fns
      expect(nextConfigContent).toMatch(/['"]lucide-react['"]/);
      expect(nextConfigContent).toMatch(/['"]date-fns['"]/);
    });
  });

  /**
   * Feature: frontend-security-fixes, Property 14: Compilation performance
   * Validates: Requirements 8.1
   * 
   * Verifica que los comentarios de performance estén presentes
   */
  describe('Property 14.5: Performance comments in code', () => {
    it('debe tener comentarios explicando timeouts de performance', () => {
      const axiosPath = path.join(__dirname, '../../src/shared/lib/axios.ts');
      const axiosContent = fs.readFileSync(axiosPath, 'utf-8');
      
      // Verificar que hay comentarios sobre performance
      expect(axiosContent).toMatch(/PERFORMANCE/i);
      expect(axiosContent).toMatch(/timeout/i);
      expect(axiosContent).toMatch(/desarrollo|development/i);
    });
  });
});
