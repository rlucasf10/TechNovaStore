/**
 * Tests para ManageProviders
 */

import { ManageProviders, ProviderInfo } from './ManageProviders';
import { AdapterFactory } from '../shared/adapters/AdapterFactory';
import { ProviderType, ProviderConfig } from '../shared/types/provider';

// Mock AdapterFactory
jest.mock('../shared/adapters/AdapterFactory');

describe('ManageProviders', () => {
  let manageProviders: ManageProviders;
  let mockAdapter: any;

  beforeEach(() => {
    manageProviders = new ManageProviders();

    mockAdapter = {
      name: 'Test Provider',
      getRateLimit: jest.fn().mockReturnValue(100),
      isHealthy: jest.fn().mockResolvedValue(true),
      constructor: { name: 'AmazonAdapter' },
    };

    jest.clearAllMocks();
  });

  describe('addProvider', () => {
    it('debe agregar un proveedor correctamente', () => {
      const config: ProviderConfig = {
        name: 'Amazon US',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        baseUrl: 'https://api.amazon.com',
        rateLimit: 100,
        timeout: 30000,
        retryAttempts: 3,
      };

      manageProviders.addProvider(ProviderType.AMAZON, config);

      expect(AdapterFactory.createAdapter).toHaveBeenCalledWith(ProviderType.AMAZON, config);
    });

    it('debe agregar múltiples proveedores', () => {
      const config1: ProviderConfig = {
        name: 'Amazon',
        apiKey: 'key1',
        baseUrl: 'https://api.amazon.com',
        rateLimit: 100,
        timeout: 30000,
        retryAttempts: 3,
      };

      const config2: ProviderConfig = {
        name: 'eBay',
        apiKey: 'key2',
        baseUrl: 'https://api.ebay.com',
        rateLimit: 50,
        timeout: 30000,
        retryAttempts: 3,
      };

      manageProviders.addProvider(ProviderType.AMAZON, config1);
      manageProviders.addProvider(ProviderType.EBAY, config2);

      expect(AdapterFactory.createAdapter).toHaveBeenCalledTimes(2);
    });

    it('debe agregar proveedor con configuración mínima', () => {
      const config: ProviderConfig = {
        name: 'Basic Provider',
        baseUrl: 'https://api.example.com',
        rateLimit: 10,
        timeout: 30000,
        retryAttempts: 3,
      };

      manageProviders.addProvider(ProviderType.AMAZON, config);

      expect(AdapterFactory.createAdapter).toHaveBeenCalledWith(ProviderType.AMAZON, config);
    });
  });

  describe('removeProvider', () => {
    it('debe eliminar un proveedor correctamente', () => {
      (AdapterFactory.removeAdapter as jest.Mock).mockReturnValue(true);

      const result = manageProviders.removeProvider(ProviderType.AMAZON);

      expect(result).toBe(true);
      expect(AdapterFactory.removeAdapter).toHaveBeenCalledWith(ProviderType.AMAZON, undefined);
    });

    it('debe eliminar un proveedor específico por nombre', () => {
      (AdapterFactory.removeAdapter as jest.Mock).mockReturnValue(true);

      const result = manageProviders.removeProvider(ProviderType.AMAZON, 'Amazon US');

      expect(result).toBe(true);
      expect(AdapterFactory.removeAdapter).toHaveBeenCalledWith(ProviderType.AMAZON, 'Amazon US');
    });

    it('debe retornar false si el proveedor no existe', () => {
      (AdapterFactory.removeAdapter as jest.Mock).mockReturnValue(false);

      const result = manageProviders.removeProvider(ProviderType.AMAZON);

      expect(result).toBe(false);
    });

    it('debe manejar eliminación de múltiples proveedores', () => {
      (AdapterFactory.removeAdapter as jest.Mock).mockReturnValue(true);

      manageProviders.removeProvider(ProviderType.AMAZON);
      manageProviders.removeProvider(ProviderType.EBAY);

      expect(AdapterFactory.removeAdapter).toHaveBeenCalledTimes(2);
    });
  });

  describe('listProviders', () => {
    it('debe listar todos los proveedores', async () => {
      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter]);

      const result = await manageProviders.listProviders();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Provider');
      expect(result[0].isHealthy).toBe(true);
    });

    it('debe listar múltiples proveedores', async () => {
      const mockAdapter2 = {
        ...mockAdapter,
        name: 'Provider 2',
        constructor: { name: 'EbayAdapter' },
      };

      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter, mockAdapter2]);

      const result = await manageProviders.listProviders();

      expect(result).toHaveLength(2);
    });

    it('debe manejar lista vacía de proveedores', async () => {
      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([]);

      const result = await manageProviders.listProviders();

      expect(result).toHaveLength(0);
    });

    it('debe incluir información de rate limit', async () => {
      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter]);

      const result = await manageProviders.listProviders();

      expect(result[0].rateLimit).toBe(100);
    });

    it('debe manejar proveedores no saludables', async () => {
      mockAdapter.isHealthy.mockResolvedValue(false);
      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter]);

      const result = await manageProviders.listProviders();

      expect(result[0].isHealthy).toBe(false);
    });

    it('debe manejar errores en health check', async () => {
      mockAdapter.isHealthy.mockRejectedValue(new Error('Health check failed'));
      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter]);

      const result = await manageProviders.listProviders();

      expect(result[0].isHealthy).toBe(false);
    });

    it('debe extraer el tipo de proveedor del nombre del adapter', async () => {
      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter]);

      const result = await manageProviders.listProviders();

      expect(result[0].type).toBe('amazon');
    });
  });

  describe('getProvider', () => {
    beforeEach(() => {
      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter]);
    });

    it('debe obtener un proveedor por tipo', async () => {
      const result = await manageProviders.getProvider(ProviderType.AMAZON);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Provider');
    });

    it('debe obtener un proveedor por tipo y nombre', async () => {
      const result = await manageProviders.getProvider(ProviderType.AMAZON, 'Test Provider');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Provider');
    });

    it('debe retornar undefined si el proveedor no existe', async () => {
      const result = await manageProviders.getProvider(ProviderType.EBAY);

      expect(result).toBeUndefined();
    });

    it('debe retornar undefined si el nombre no coincide', async () => {
      const result = await manageProviders.getProvider(ProviderType.AMAZON, 'Non-existent');

      expect(result).toBeUndefined();
    });

    it('debe retornar el primer proveedor si hay múltiples del mismo tipo', async () => {
      const mockAdapter2 = {
        ...mockAdapter,
        name: 'Amazon 2',
      };

      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter, mockAdapter2]);

      const result = await manageProviders.getProvider(ProviderType.AMAZON);

      expect(result?.name).toBe('Test Provider');
    });

    it('debe distinguir proveedores por nombre cuando se especifica', async () => {
      const mockAdapter2 = {
        ...mockAdapter,
        name: 'Amazon 2',
      };

      (AdapterFactory.getAllAdapters as jest.Mock).mockReturnValue([mockAdapter, mockAdapter2]);

      const result = await manageProviders.getProvider(ProviderType.AMAZON, 'Amazon 2');

      expect(result?.name).toBe('Amazon 2');
    });
  });
});
