// Priority constants and validation. Pure module — safe to import in both
// server (API routes, lib/db) and client (app/page.tsx) code.

export type Priority = 'high' | 'medium' | 'low';

export const PRIORITY_VALUES: Priority[] = ['high', 'medium', 'low'];

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  high: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  medium:
    'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
  low: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
};

export function isPriority(value: unknown): value is Priority {
  return value === 'high' || value === 'medium' || value === 'low';
}

// Returns 'medium' for null/undefined; throws on any other invalid value.
export function validatePriority(value: unknown): Priority {
  if (value === undefined || value === null) return 'medium';
  if (isPriority(value)) return value;
  throw new Error(
    `Invalid priority: ${String(value)}. Must be 'high', 'medium', or 'low'.`
  );
}
