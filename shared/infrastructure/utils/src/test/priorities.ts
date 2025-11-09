import { ResourceType } from './types';

/**
 * Priority system for resource cleanup ordering
 * Higher numbers = higher priority (cleaned first)
 */

/**
 * Default priority levels for different resource types
 */
export const DEFAULT_PRIORITIES: Record<ResourceType, number> = {
  timer: 10,      // Highest priority - timers should be cleared first
  socket: 8,      // High priority - close network connections
  server: 6,      // Medium-high priority - stop servers
  database: 4,    // Medium priority - close database connections
  process: 2,     // Low priority - terminate child processes
  custom: 5       // Default priority for custom resources
};

/**
 * Priority levels enum for easier reference
 */
export enum Priority {
  CRITICAL = 10,
  HIGH = 8,
  MEDIUM_HIGH = 6,
  MEDIUM = 5,
  MEDIUM_LOW = 4,
  LOW = 2,
  LOWEST = 1
}

/**
 * Get default priority for a resource type
 */
export function getDefaultPriority(type: ResourceType): number {
  return DEFAULT_PRIORITIES[type];
}

/**
 * Create a priority-based comparator for sorting resources
 */
export function createPriorityComparator() {
  return (a: { priority: number }, b: { priority: number }): number => {
    return b.priority - a.priority; // Higher priority first
  };
}

/**
 * Validate priority value
 */
export function isValidPriority(priority: number): boolean {
  return Number.isInteger(priority) && priority >= 0 && priority <= 10;
}

/**
 * Normalize priority to valid range
 */
export function normalizePriority(priority: number): number {
  if (!Number.isFinite(priority)) {
    return Priority.MEDIUM;
  }
  
  return Math.max(0, Math.min(10, Math.floor(priority)));
}

/**
 * Get priority description for logging
 */
export function getPriorityDescription(priority: number): string {
  if (priority >= 9) return 'CRITICAL';
  if (priority >= 7) return 'HIGH';
  if (priority >= 5) return 'MEDIUM';
  if (priority >= 3) return 'LOW';
  return 'LOWEST';
}

/**
 * Resource priority configuration for specific scenarios
 */
export const SCENARIO_PRIORITIES = {
  /**
   * Priorities optimized for integration tests
   */
  integration: {
    timer: Priority.CRITICAL,
    socket: Priority.HIGH,
    server: Priority.MEDIUM_HIGH,
    database: Priority.MEDIUM,
    process: Priority.LOW,
    custom: Priority.MEDIUM
  },

  /**
   * Priorities optimized for unit tests
   */
  unit: {
    timer: Priority.HIGH,
    socket: Priority.MEDIUM,
    server: Priority.LOW,
    database: Priority.LOW,
    process: Priority.LOWEST,
    custom: Priority.MEDIUM
  },

  /**
   * Priorities for CI environments (more aggressive)
   */
  ci: {
    timer: Priority.CRITICAL,
    socket: Priority.CRITICAL,
    server: Priority.HIGH,
    database: Priority.HIGH,
    process: Priority.MEDIUM,
    custom: Priority.MEDIUM
  }
};

/**
 * Get priorities for a specific scenario
 */
export function getScenarioPriorities(scenario: keyof typeof SCENARIO_PRIORITIES): Record<ResourceType, number> {
  return SCENARIO_PRIORITIES[scenario] || DEFAULT_PRIORITIES;
}

/**
 * Create a resource priority calculator based on type and age
 */
export function createPriorityCalculator(basePriorities?: Record<ResourceType, number>) {
  const priorities = basePriorities || DEFAULT_PRIORITIES;
  
  return (type: ResourceType, createdAt: number, metadata?: Record<string, any>): number => {
    let priority = priorities[type];
    
    // Adjust priority based on age (older resources get slightly higher priority)
    const ageInSeconds = (Date.now() - createdAt) / 1000;
    const ageBonus = Math.min(1, ageInSeconds / 60); // Max 1 point bonus after 1 minute
    
    // Adjust priority based on metadata hints
    if (metadata?.critical) {
      priority += 2;
    }
    
    if (metadata?.lowPriority) {
      priority -= 2;
    }
    
    return normalizePriority(priority + ageBonus);
  };
}