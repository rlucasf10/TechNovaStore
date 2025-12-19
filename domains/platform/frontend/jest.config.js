/**
 * Configuración de Jest para el frontend
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test', '<rootDir>/scripts', '<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'scripts/**/*.ts',
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
    }],
  },
  moduleNameMapper: {
    // Archivos CSS y assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/test/__mocks__/fileMock.js',
    
    // Path aliases específicos (deben ir primero)
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/shared$': '<rootDir>/src/shared',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/catalog/(.*)$': '<rootDir>/src/features/catalog/$1',
    '^@/catalog$': '<rootDir>/src/features/catalog',
    '^@/commerce/(.*)$': '<rootDir>/src/features/commerce/$1',
    '^@/commerce$': '<rootDir>/src/features/commerce',
    '^@/customer/(.*)$': '<rootDir>/src/features/customer/$1',
    '^@/customer$': '<rootDir>/src/features/customer',
    '^@/support/(.*)$': '<rootDir>/src/features/support/$1',
    '^@/support$': '<rootDir>/src/features/support',
    '^@/admin/(.*)$': '<rootDir>/src/features/admin/$1',
    '^@/admin$': '<rootDir>/src/features/admin',
    '^@/components/(.*)$': '<rootDir>/src/shared/components/$1',
    '^@/ui/(.*)$': '<rootDir>/src/shared/components/ui/$1',
    '^@/ui$': '<rootDir>/src/shared/components/ui',
    '^@/layout/(.*)$': '<rootDir>/src/shared/components/layout/$1',
    '^@/layout$': '<rootDir>/src/shared/components/layout',
    '^@/lib/(.*)$': '<rootDir>/src/shared/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/shared/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/shared/types/$1',
    '^@/types$': '<rootDir>/src/shared/types',
    '^@/services/(.*)$': '<rootDir>/src/shared/services/$1',
    '^@/store/(.*)$': '<rootDir>/src/shared/store/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    // Regla genérica (debe ir al final)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
