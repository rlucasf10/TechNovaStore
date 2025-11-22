/**
 * Tests para TriggerPriceUpdate
 */

import { TriggerPriceUpdate } from './TriggerPriceUpdate';
import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { ProviderType } from '../shared/types/provider';

describe('TriggerPriceUpdate', () => {
  let triggerPriceUpdate: TriggerPriceUpdate;
  let mockScheduler: jest.Mocked<SyncScheduler>;

  beforeEach(() => {
    mockScheduler = {
      triggerPriceUpdate: jest.fn(),
    } as any;

    triggerPriceUpdate = new TriggerPriceUpdate(mockScheduler);
  });

  describe('execute', () => {
    it('debe disparar actualización de precios sin proveedores específicos', async () => {
      await triggerPriceUpdate.execute();

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledWith(undefined);
      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledTimes(1);
    });

    it('debe disparar actualización de precios con proveedores específicos', async () => {
      const providers: ProviderType[] = [ProviderType.AMAZON, ProviderType.EBAY];

      await triggerPriceUpdate.execute(providers);

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledWith(providers);
      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledTimes(1);
    });

    it('debe disparar actualización con un solo proveedor', async () => {
      const providers: ProviderType[] = [ProviderType.NEWEGG];

      await triggerPriceUpdate.execute(providers);

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledWith(providers);
    });

    it('debe disparar actualización con lista vacía de proveedores', async () => {
      const providers: ProviderType[] = [];

      await triggerPriceUpdate.execute(providers);

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledWith(providers);
    });

    it('debe disparar actualización con todos los tipos de proveedores', async () => {
      const providers: ProviderType[] = [
        ProviderType.AMAZON,
        ProviderType.EBAY,
        ProviderType.ALIEXPRESS,
        ProviderType.NEWEGG,
        ProviderType.BANGGOOD
      ];

      await triggerPriceUpdate.execute(providers);

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledWith(providers);
    });

    it('debe manejar múltiples llamadas consecutivas', async () => {
      await triggerPriceUpdate.execute([ProviderType.AMAZON]);
      await triggerPriceUpdate.execute([ProviderType.EBAY]);
      await triggerPriceUpdate.execute();

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledTimes(3);
    });

    it('debe pasar undefined cuando no se proporcionan proveedores', async () => {
      await triggerPriceUpdate.execute(undefined);

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledWith(undefined);
    });

    it('debe ejecutarse sin errores cuando el scheduler está configurado correctamente', async () => {
      await expect(triggerPriceUpdate.execute()).resolves.not.toThrow();
    });

    it('debe propagar errores del scheduler', async () => {
      const error = new Error('Scheduler error');
      mockScheduler.triggerPriceUpdate.mockImplementation(() => {
        throw error;
      });

      await expect(triggerPriceUpdate.execute()).rejects.toThrow('Scheduler error');
    });

    it('debe llamar al scheduler exactamente una vez por ejecución', async () => {
      await triggerPriceUpdate.execute([ProviderType.AMAZON, ProviderType.EBAY]);

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledTimes(1);
      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledWith([ProviderType.AMAZON, ProviderType.EBAY]);
    });

    it('debe manejar proveedores duplicados en la lista', async () => {
      const providers: ProviderType[] = [ProviderType.AMAZON, ProviderType.AMAZON, ProviderType.EBAY];

      await triggerPriceUpdate.execute(providers);

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledWith(providers);
    });

    it('debe ejecutarse correctamente con diferentes combinaciones de proveedores', async () => {
      await triggerPriceUpdate.execute([ProviderType.AMAZON]);
      await triggerPriceUpdate.execute([ProviderType.EBAY, ProviderType.NEWEGG]);
      await triggerPriceUpdate.execute([ProviderType.ALIEXPRESS, ProviderType.BANGGOOD, ProviderType.AMAZON]);

      expect(mockScheduler.triggerPriceUpdate).toHaveBeenCalledTimes(3);
    });
  });
});
