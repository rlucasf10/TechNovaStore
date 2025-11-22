module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/logs/'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!index.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/logs/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
