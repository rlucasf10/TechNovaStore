/**
 * Tests para GetSyncMetrics
 */

import { GetSyncMetrics } from './GetSyncMetrics';
import { JobQueue } from '../shared/queue/JobQueue';
import { SyncJob, SyncJobStatus } from '../shared/types/sync';

describe('GetSyncMetrics', () => {
  let getSyncMetrics: GetSyncMetrics;
  let mockJobQueue: jest.Mocked<JobQueue>;

  beforeEach(() => {
    mockJobQueue = {
      getQueueStats: jest.fn(),
      getJobHistory: jest.fn(),
    } as any;

    getSyncMetrics = new GetSyncMetrics(mockJobQueue);
  });

  describe('execute', () => {
    it('debe calcular métricas correctamente con trabajos completados', async () => {
      const now = new Date();
      const completedJobs: Partial<SyncJob>[] = [
        {
          id: 'job-1',
          status: SyncJobStatus.COMPLETED,
          started_at: new Date(now.getTime() - 5000),
          completed_at: now,
        },
        {
          id: 'job-2',
          status: SyncJobStatus.COMPLETED,
          started_at: new Date(now.getTime() - 3000),
          completed_at: now,
        },
      ];

      mockJobQueue.getQueueStats.mockReturnValue({
        total: 2,
        pending: 0,
        running: 0,
        completed: 2,
        failed: 0,
      });

      mockJobQueue.getJobHistory.mockReturnValue(completedJobs as SyncJob[]);

      const result = await getSyncMetrics.execute();

      expect(result.total_jobs).toBe(2);
      expect(result.completed_jobs).toBe(2);
      expect(result.failed_jobs).toBe(0);
      expect(result.average_duration).toBeGreaterThan(0);
    });

    it('debe calcular métricas con trabajos fallidos', async () => {
      const failedJobs: Partial<SyncJob>[] = [
        {
          id: 'job-1',
          status: SyncJobStatus.FAILED,
          error: 'Connection timeout',
        },
        {
          id: 'job-2',
          status: SyncJobStatus.FAILED,
          error: 'Invalid data',
        },
      ];

      mockJobQueue.getQueueStats.mockReturnValue({
        total: 2,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 2,
      });

      mockJobQueue.getJobHistory.mockReturnValue(failedJobs as SyncJob[]);

      const result = await getSyncMetrics.execute();

      expect(result.failed_jobs).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Connection timeout');
      expect(result.errors).toContain('Invalid data');
    });

    it('debe manejar cola vacía', async () => {
      mockJobQueue.getQueueStats.mockReturnValue({
        total: 0,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
      });

      mockJobQueue.getJobHistory.mockReturnValue([]);

      const result = await getSyncMetrics.execute();

      expect(result.total_jobs).toBe(0);
      expect(result.completed_jobs).toBe(0);
      expect(result.failed_jobs).toBe(0);
      expect(result.average_duration).toBe(0);
    });

    it('debe calcular duración promedio correctamente', async () => {
      const now = new Date();
      const jobs: Partial<SyncJob>[] = [
        {
          id: 'job-1',
          status: SyncJobStatus.COMPLETED,
          started_at: new Date(now.getTime() - 10000),
          completed_at: new Date(now.getTime() - 5000),
        },
        {
          id: 'job-2',
          status: SyncJobStatus.COMPLETED,
          started_at: new Date(now.getTime() - 8000),
          completed_at: new Date(now.getTime() - 2000),
        },
      ];

      mockJobQueue.getQueueStats.mockReturnValue({
        total: 2,
        pending: 0,
        running: 0,
        completed: 2,
        failed: 0,
      });

      mockJobQueue.getJobHistory.mockReturnValue(jobs as SyncJob[]);

      const result = await getSyncMetrics.execute();

      expect(result.average_duration).toBeGreaterThan(5000);
      expect(result.average_duration).toBeLessThan(6000);
    });

    it('debe manejar trabajos sin timestamps', async () => {
      const jobs: Partial<SyncJob>[] = [
        {
          id: 'job-1',
          status: SyncJobStatus.COMPLETED,
          started_at: undefined,
          completed_at: undefined,
        },
      ];

      mockJobQueue.getQueueStats.mockReturnValue({
        total: 1,
        pending: 0,
        running: 0,
        completed: 1,
        failed: 0,
      });

      mockJobQueue.getJobHistory.mockReturnValue(jobs as SyncJob[]);

      const result = await getSyncMetrics.execute();

      expect(result.average_duration).toBe(0);
    });

    it('debe manejar errores sin mensaje', async () => {
      const jobs: Partial<SyncJob>[] = [
        {
          id: 'job-1',
          status: SyncJobStatus.FAILED,
          error: undefined,
        },
      ];

      mockJobQueue.getQueueStats.mockReturnValue({
        total: 1,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 1,
      });

      mockJobQueue.getJobHistory.mockReturnValue(jobs as SyncJob[]);

      const result = await getSyncMetrics.execute();

      expect(result.errors).toContain('Unknown error');
    });

    it('debe limitar el historial a 100 trabajos', async () => {
      await getSyncMetrics.execute();

      expect(mockJobQueue.getJobHistory).toHaveBeenCalledWith(100);
    });

    it('debe retornar última sincronización correctamente', async () => {
      const lastSync = new Date('2024-01-01T12:00:00Z');
      const jobs: Partial<SyncJob>[] = [
        {
          id: 'job-1',
          status: SyncJobStatus.COMPLETED,
          started_at: new Date('2024-01-01T11:59:00Z'),
          completed_at: lastSync,
        },
      ];

      mockJobQueue.getQueueStats.mockReturnValue({
        total: 1,
        pending: 0,
        running: 0,
        completed: 1,
        failed: 0,
      });

      mockJobQueue.getJobHistory.mockReturnValue(jobs as SyncJob[]);

      const result = await getSyncMetrics.execute();

      expect(result.last_sync).toEqual(lastSync);
    });

    it('debe manejar mezcla de trabajos completados y fallidos', async () => {
      const jobs: Partial<SyncJob>[] = [
        { id: 'job-1', status: SyncJobStatus.COMPLETED, started_at: new Date(), completed_at: new Date() },
        { id: 'job-2', status: SyncJobStatus.FAILED, error: 'Error 1' },
        { id: 'job-3', status: SyncJobStatus.COMPLETED, started_at: new Date(), completed_at: new Date() },
        { id: 'job-4', status: SyncJobStatus.FAILED, error: 'Error 2' },
      ];

      mockJobQueue.getQueueStats.mockReturnValue({
        total: 4,
        pending: 0,
        running: 0,
        completed: 2,
        failed: 2,
      });

      mockJobQueue.getJobHistory.mockReturnValue(jobs as SyncJob[]);

      const result = await getSyncMetrics.execute();

      expect(result.completed_jobs).toBe(2);
      expect(result.failed_jobs).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('debe redondear la duración promedio', async () => {
      const now = new Date();
      const jobs: Partial<SyncJob>[] = [
        {
          id: 'job-1',
          status: SyncJobStatus.COMPLETED,
          started_at: new Date(now.getTime() - 1234),
          completed_at: now,
        },
      ];

      mockJobQueue.getQueueStats.mockReturnValue({
        total: 1,
        pending: 0,
        running: 0,
        completed: 1,
        failed: 0,
      });

      mockJobQueue.getJobHistory.mockReturnValue(jobs as SyncJob[]);

      const result = await getSyncMetrics.execute();

      expect(Number.isInteger(result.average_duration)).toBe(true);
    });

    it('debe ejecutarse sin errores múltiples veces', async () => {
      mockJobQueue.getQueueStats.mockReturnValue({
        total: 0,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
      });

      mockJobQueue.getJobHistory.mockReturnValue([]);

      await expect(getSyncMetrics.execute()).resolves.not.toThrow();
      await expect(getSyncMetrics.execute()).resolves.not.toThrow();
      await expect(getSyncMetrics.execute()).resolves.not.toThrow();
    });
  });
});
