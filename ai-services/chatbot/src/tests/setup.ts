// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(30000);

// Mock MongoDB connection for tests
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  model: jest.fn().mockReturnValue({
    find: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      })
    }),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    }),
    aggregate: jest.fn().mockResolvedValue([])
  })
}));

// Mock Python shell for spaCy integration
jest.mock('python-shell', () => ({
  PythonShell: {
    run: jest.fn().mockImplementation((script: string, options: any) => {
      const text = options.args[0] || '';
      
      // Create realistic mock responses based on input text
      let mockResponse: any = {
        tokens: [],
        entities: [],
        pos_tags: [],
        dependencies: [],
        lemmas: [],
        sentiment: "neutral",
        keywords: []
      };

      // Mock lemmas and keywords based on input
      if (text.toLowerCase().includes('busco') || text.toLowerCase().includes('laptop')) {
        mockResponse.lemmas = ['buscar', 'laptop'];
        mockResponse.keywords = ['buscar', 'laptop'];
      }
      
      if (text.toLowerCase().includes('comparar') || text.toLowerCase().includes('precio')) {
        mockResponse.lemmas = ['comparar', 'precio'];
        mockResponse.keywords = ['comparar', 'precio'];
      }

      if (text.toLowerCase().includes('móvil') || text.toLowerCase().includes('movil')) {
        mockResponse.lemmas = ['móvil'];
        mockResponse.keywords = ['móvil'];
      }

      return Promise.resolve([JSON.stringify(mockResponse)]);
    })
  }
}));