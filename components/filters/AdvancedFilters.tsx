'use client';

import type { FilterPreset, FilterState } from '@/lib/filters';

interface AdvancedFiltersProps {
  expanded: boolean;
  filters: FilterState;
  presets: FilterPreset[];
  onToggle: () => void;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onApplyPreset: (filters: FilterState) => void;
  onDeletePreset: (id: string) => void;
}

export function AdvancedFilters({
  expanded,
  filters,
  presets,
  onToggle,
  onUpdateFilter,
  onApplyPreset,
  onDeletePreset,
}: AdvancedFiltersProps) {
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      >
        ▶ Advanced
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          Advanced Filters
        </h3>
        <button
          type="button"
          onClick={onToggle}
          className="px-2 py-1 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
        >
          ▼ Advanced
        </button>
      </div>

      <div className="space-y-3">
        {/* Completion Status */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Completion
          </label>
          <select
            value={filters.completion}
            onChange={(e) =>
              onUpdateFilter('completion', e.target.value as FilterState['completion'])
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Todos</option>
            <option value="incomplete">Incomplete Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Due Date From
            </label>
            <input
              type="date"
              value={filters.dueDateFrom ?? ''}
              onChange={(e) => onUpdateFilter('dueDateFrom', e.target.value || null)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Due Date To
            </label>
            <input
              type="date"
              value={filters.dueDateTo ?? ''}
              onChange={(e) => onUpdateFilter('dueDateTo', e.target.value || null)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Saved Presets */}
        {presets.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Saved Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <span
                  key={preset.id}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs dark:border-gray-600 dark:bg-gray-700"
                >
                  <button
                    type="button"
                    onClick={() => onApplyPreset(preset.filters)}
                    className="font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    aria-label={`Delete preset ${preset.name}`}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
