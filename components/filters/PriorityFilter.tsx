'use client';

import type { Priority } from '@/lib/priority';
import type { Tag } from '@/lib/db';

export type PriorityFilter = Priority | 'all';

interface PriorityFilterProps {
  priority: PriorityFilter;
  tagId: number | 'all';
  tags: Tag[];
  onPriorityChange: (value: PriorityFilter) => void;
  onTagChange: (tagId: number | 'all') => void;
}

export function PriorityFilter({
  priority,
  tagId,
  tags,
  onPriorityChange,
  onTagChange,
}: PriorityFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Priority */}
      <div className="flex items-center gap-2">
        <label htmlFor="priority-filter" className="text-sm text-gray-600 dark:text-gray-400">
          Filter:
        </label>
        <select
          id="priority-filter"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as PriorityFilter)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <select
          id="tag-filter"
          value={tagId}
          onChange={(e) => onTagChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
