/**
 * Tests para TriggerFullSync
 */

import { TriggerFullSync } from './TriggerFullSync';
import { SyncScheduler } from '../shared/scheduler/SyncScheduler';
import { ProviderType } from '../shared/types/provider';

describe('TriggerFullSync', () => {
  let triggerFullSync: TriggerFullSync;
  let mockScheduler: jest.Mocked<SyncScheduler>;

  beforeEach(() => {
    mockScheduler = {
      triggerFullSync: jest.fn(),
    } as any;

    triggerFullSync = new TriggerFullSync(mockScheduler);
  });

  describe('execute', () => {
    it('debe disparar sincronización completa sin proveedores específicos', async () => {
      await triggerFullSync.execute();

      expect(mockScheduler.triggerFullSync).toHaveBeenCalledWith(undefined);
      expect(mockScheduler.triggerFullSync).toHaveBeenCalledTimes(1);
    });

    it('debe disparar sincronización completa con proveedores específicos', async () => {
      const providers: ProviderType[] = [ProviderType.AMAZON, ProviderType.EBAY];

      await triggerFullSync.execute(providers);

      expect(mockScheduler.triggerFullSync).toHaveBeenCalledWith(providers);
      expect(mockScheduler.triggerFullSync).toHaveBeenCalledTimes(1);
    });

    it('debe disparar sincronización con un solo proveedor', async () => {
      const providers: ProviderType[] = [ProviderType.ALIEXPRESS];

      await triggerFullSync.execute(providers);

      expect(mockScheduler.triggerFullSync).toHaveBeenCalledWith(providers);
    });

    it('debe disparar sincronización con lista vacía de proveedores', async () => {
      const providers: ProviderType[] = [];

      await triggerFullSync.execute(providers);

      expect(mockScheduler.triggerFullSync).toHaveBeenCalledWith(providers);
    });

    it('debe disparar sincronización con todos los tipos de proveedores', async () => {
      const providers: ProviderType[] = [
        ProviderType.AMAZON,
        ProviderType.EBAY,
        ProviderType.ALIEXPRESS,
        ProviderType.NEWEGG,
        ProviderType.BANGGOOD
      ];

      await triggerFullSync.execute(providers);

      expect(mockScheduler.triggerFullSync).toHaveBeenCalledWith(providers);
    });

    it('debe manejar múltiples llamadas consecutivas', async () => {
      await triggerFullSync.execute([ProviderType.AMAZON]);
      await triggerFullSync.execute([ProviderType.EBAY]);
      await triggerFullSync.execute();

      expect(mockScheduler.triggerFullSync).toHaveBeenCalledTimes(3);
    });

    it('debe pasar undefined cuando no se proporcionan proveedores', async () => {
      await triggerFullSync.execute(undefined);

      expect(mockScheduler.triggerFullSync).toHaveBeenCalledWith(undefined);
    });

    it('debe ejecutarse sin errores cuando el scheduler está configurado correctamente', async () => {
      await expect(triggerFullSync.execute()).resolves.not.toThrow();
    });

    it('debe propagar errores del scheduler', async () => {
      const error = new Error('Scheduler error');
      mockScheduler.triggerFullSync.mockImplementation(() => {
        throw error;
      });

      await expect(triggerFullSync.execute()).rejects.toThrow('Scheduler error');
    });

    it('debe llamar al scheduler exactamente una vez por ejecución', async () => {
      await triggerFullSync.execute([ProviderType.AMAZON, ProviderType.EBAY]);

      expect(mockScheduler.triggerFullSync).toHaveBeenCalledTimes(1);
      expect(mockScheduler.triggerFullSync).toHaveBeenCalledWith([ProviderType.AMAZON, ProviderType.EBAY]);
    });
  });
});
