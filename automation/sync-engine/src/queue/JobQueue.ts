import { SyncJob, SyncJobStatus } from '../types/sync';

export class JobQueue {
  private jobs: Map<string, SyncJob> = new Map();
  private pendingJobs: SyncJob[] = [];
  private runningJobs: Set<string> = new Set();
  private maxConcurrentJobs: number;

  constructor(maxConcurrentJobs: number = 5) {
    this.maxConcurrentJobs = maxConcurrentJobs;
  }

  addJob(job: SyncJob): void {
    this.jobs.set(job.id, job);
    this.pendingJobs.push(job);
    this.sortPendingJobs();
    
    console.log(`Added job ${job.id} (${job.type}) for provider ${job.provider}`);
  }

  getNextJob(): SyncJob | null {
    if (this.pendingJobs.length === 0 || this.runningJobs.size >= this.maxConcurrentJobs) {
      return null;
    }

    const job = this.pendingJobs.shift();
    if (job) {
      job.status = SyncJobStatus.RUNNING;
      job.started_at = new Date();
      this.runningJobs.add(job.id);
      this.jobs.set(job.id, job);
    }

    return job || null;
  }

  completeJob(jobId: string, error?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    job.completed_at = new Date();
    this.runningJobs.delete(jobId);

    if (error) {
      job.status = SyncJobStatus.FAILED;
      job.error = error;
      job.retry_count++;

      // Retry logic
      if (job.retry_count < job.max_retries) {
        job.status = SyncJobStatus.RETRYING;
        // Add back to pending with lower priority
        job.priority = Math.max(job.priority + 1, 10);
        this.pendingJobs.push(job);
        this.sortPendingJobs();
        console.log(`Job ${jobId} failed, scheduling retry ${job.retry_count}/${job.max_retries}`);
      } else {
        console.error(`Job ${jobId} failed permanently after ${job.max_retries} retries: ${error}`);
      }
    } else {
      job.status = SyncJobStatus.COMPLETED;
      console.log(`Job ${jobId} completed successfully`);
    }

    this.jobs.set(jobId, job);
  }

  getJob(jobId: string): SyncJob | undefined {
    return this.jobs.get(jobId);
  }

  getJobsByStatus(status: SyncJobStatus): SyncJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  getJobsByProvider(provider: string): SyncJob[] {
    return Array.from(this.jobs.values()).filter(job => job.provider === provider);
  }

  getPendingJobsCount(): number {
    return this.pendingJobs.length;
  }

  getRunningJobsCount(): number {
    return this.runningJobs.size;
  }

  getQueueStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === SyncJobStatus.PENDING).length,
      running: jobs.filter(j => j.status === SyncJobStatus.RUNNING).length,
      completed: jobs.filter(j => j.status === SyncJobStatus.COMPLETED).length,
      failed: jobs.filter(j => j.status === SyncJobStatus.FAILED).length
    };
  }

  clearCompletedJobs(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [jobId, job] of this.jobs) {
      if (
        (job.status === SyncJobStatus.COMPLETED || job.status === SyncJobStatus.FAILED) &&
        job.completed_at &&
        job.completed_at < cutoffTime
      ) {
        this.jobs.delete(jobId);
        removedCount++;
      }
    }

    console.log(`Cleared ${removedCount} completed jobs older than ${olderThanHours} hours`);
    return removedCount;
  }

  private sortPendingJobs(): void {
    this.pendingJobs.sort((a, b) => {
      // Sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Then by creation time (older first)
      return a.created_at.getTime() - b.created_at.getTime();
    });
  }

  updateMaxConcurrentJobs(maxJobs: number): void {
    this.maxConcurrentJobs = maxJobs;
    console.log(`Updated max concurrent jobs to ${maxJobs}`);
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === SyncJobStatus.RUNNING) {
      console.warn(`Cannot cancel running job ${jobId}`);
      return false;
    }

    if (job.status === SyncJobStatus.PENDING) {
      const index = this.pendingJobs.findIndex(j => j.id === jobId);
      if (index !== -1) {
        this.pendingJobs.splice(index, 1);
      }
    }

    job.status = SyncJobStatus.FAILED;
    job.error = 'Cancelled by user';
    job.completed_at = new Date();
    this.jobs.set(jobId, job);

    console.log(`Cancelled job ${jobId}`);
    return true;
  }

  getJobHistory(limit: number = 100): SyncJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
      .slice(0, limit);
  }
}